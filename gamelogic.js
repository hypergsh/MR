// 游戏核心逻辑 (gameLogic.js)
// 游戏状态管理
const gameState = {
  currentLocation: '', // 当前位置
  previousLocation: '', // 上一个位置
  energyLevel: 0,      // 能量值
  diceRoll: 0,         // 骰子点数
  gameResult: '',      // 游戏结果："success" 或 "failure" 或空字符串
  history: [],         // 游戏历史记录
  nextDestination: '',  // 下一个目的地
  displayingMultipleDestinations: false // 新增：标记是否正在显示多个目的地
};

// 游戏地点 - 修改后的名称
const LOCATIONS = {
  HOTEL: "Starting Point",         // 原 "旅馆" 改为 "起点"
  CANTEEN: "Canteen",              // 原 "食堂" 不变，但改为英文
  COMPUTER_BUILDING: "Exchange Building",  // 原 "计算机楼" 改为 "Exchange Building"
  EXCHANGE_BUILDING: "Yangfujia Building", // 原 "交换楼" 改为 "Yangfujia Building"
  LIBRARY: "Library"               // 原 "图书馆" 改为英文 "Library"
};

// 地点图片映射 - 保持原图片名称不变
const LOCATION_IMAGES = {
  [LOCATIONS.HOTEL]: "images/hotel.jpg",
  [LOCATIONS.CANTEEN]: "images/canteen.jpg",
  [LOCATIONS.COMPUTER_BUILDING]: "images/computer_building.jpg",
  [LOCATIONS.EXCHANGE_BUILDING]: "images/exchange_building.jpg",
  [LOCATIONS.LIBRARY]: "images/library.jpg"
};

// 初始化游戏
function initGame() {
  // 从本地存储加载游戏状态
  const savedState = localStorage.getItem('campusGameState');
  if (savedState) {
    Object.assign(gameState, JSON.parse(savedState));
  } else {
    // 首次游戏，设置初始状态
    resetGame();
  }
  
  updateUI();
}

// 重置游戏
function resetGame() {
  gameState.currentLocation = LOCATIONS.HOTEL;
  gameState.previousLocation = '';
  gameState.energyLevel = 0;
  gameState.diceRoll = 0;
  gameState.gameResult = '';
  gameState.history = [];
  gameState.nextDestination = '';
  gameState.displayingMultipleDestinations = false;
  
  saveGameState();
  updateUI();
  
  // 显示重置成功消息
  showMessage("Game reset! Please scan the QR code at the Computer Building or roll the dice to start the game.");
  
  // 隐藏目的地图片
  hideDestinationImage();
}

// 保存游戏状态到本地存储
function saveGameState() {
  localStorage.setItem('campusGameState', JSON.stringify(gameState));
}

// 处理位置更新
function handleLocationUpdate(locationCode) {
  console.log("位置更新:", locationCode);
  
  // 记录上一个位置
  gameState.previousLocation = gameState.currentLocation;
  
  // 更新当前位置
  gameState.currentLocation = locationCode;
  
  // 重置骰子点数，确保玩家需要手动掷骰子
  gameState.diceRoll = 0;
  
  // 重置下一个目的地
  gameState.nextDestination = '';
  
  // 重置多目的地显示标记
  gameState.displayingMultipleDestinations = false;
  
  // 记录历史
  gameState.history.push({
    location: locationCode,
    timestamp: new Date().toISOString()
  });
  
  // 应用位置初始规则（不涉及骰子结果）
  applyLocationRules();
  
  // 保存游戏状态
  saveGameState();
  
  // 更新UI
  updateUI();
}

// 应用位置初始规则（不包含骰子结果处理）
function applyLocationRules() {
  const { currentLocation, previousLocation, energyLevel } = gameState;
  
  // 隐藏目的地图片（将在需要时再显示）
  hideDestinationImage();
  
  // 起点逻辑
  if (currentLocation === LOCATIONS.HOTEL) {
    // 重置游戏结果，因为我们又回到了起点
    gameState.gameResult = '';
    showMessage(`Welcome to the ${LOCATIONS.HOTEL}! You've been chosen for an adventure. A monster has been released into the campus and is chasing you! Check Google Maps for actual locations to visit. Roll the dice to decide your next move.`);
  }
  
  // 食堂逻辑
  else if (currentLocation === LOCATIONS.CANTEEN) {
    // 在食堂能量值恢复到10
    gameState.energyLevel = 10;
    
    // 检查是否是从正确的地点来到食堂
    if (previousLocation === LOCATIONS.HOTEL) {
      showMessage(`You've arrived at the ${LOCATIONS.CANTEEN}! The delicious food fully restores your energy to 10. With a full stomach, you feel much better prepared for your escape. Roll the dice to decide your next move.`);
    } else {
      // 如果不是从旅馆来，就要重新开始
      resetToHotel(`Game logic error: You shouldn't move from ${previousLocation} to ${LOCATIONS.CANTEEN}. Please return to ${LOCATIONS.HOTEL} and restart.`);
      return;
    }
  }
  
  // Exchange Building逻辑 (原计算机楼)
  else if (currentLocation === LOCATIONS.COMPUTER_BUILDING) {
    // 检查是否是从正确的地点来到计算机楼
    if (previousLocation === LOCATIONS.HOTEL && gameState.energyLevel === 5) {
      showMessage(`You've reached the ${LOCATIONS.COMPUTER_BUILDING}. You hear the monster's footsteps not far behind! Current energy: 5. Roll the dice to see if you can shake off the monster.`);
    } else if (previousLocation === LOCATIONS.CANTEEN && gameState.energyLevel === 10) {
      showMessage(`You've reached the ${LOCATIONS.COMPUTER_BUILDING}. The monster is closing in, but your full energy might give you an advantage! Current energy: 10. Roll the dice to see if you can shake off the monster.`);
    } else {
      // 如果不是从正确的地点来，就要重新开始
      resetToHotel(`Game logic error: You shouldn't move from ${previousLocation} to ${LOCATIONS.COMPUTER_BUILDING}. Please return to ${LOCATIONS.HOTEL} and restart.`);
      return;
    }
  }
  
  // Yangfujia Building逻辑 (原交换楼)
  else if (currentLocation === LOCATIONS.EXCHANGE_BUILDING) {
    // 检查能量值
    if (previousLocation === LOCATIONS.HOTEL && gameState.energyLevel === 5) {
      // 从旅馆直接来到交换楼，能量值为5，必然失败
      gameState.gameResult = "failure";
      showMessage(`You've arrived at the ${LOCATIONS.EXCHANGE_BUILDING}, but with only 5 energy, you're too exhausted to continue! You couldn't escape the monster. Game over! Please return to ${LOCATIONS.HOTEL} to restart.`);
      
      // 显示旅馆目的地图片
      showDestinationImage(LOCATIONS.HOTEL, "Please return to");
    } else if (previousLocation === LOCATIONS.CANTEEN && gameState.energyLevel === 10) {
      // 从食堂来到交换楼，能量值为10，必然成功
      gameState.gameResult = "success";
      gameState.nextDestination = LOCATIONS.LIBRARY;
      showMessage(`You've reached the ${LOCATIONS.EXCHANGE_BUILDING} with plenty of energy (10)! You're moving quickly and the monster seems to be falling behind. Continue to the ${LOCATIONS.LIBRARY} for safety!`);
      
      // 显示图书馆目的地图片
      showDestinationImage(LOCATIONS.LIBRARY, "Please proceed to");
    } else {
      // 如果不是从正确的地点来，就要重新开始
      resetToHotel(`Game logic error: You shouldn't move from ${previousLocation} to ${LOCATIONS.EXCHANGE_BUILDING}. Please return to ${LOCATIONS.HOTEL} and restart.`);
      return;
    }
  }
  
  // 图书馆逻辑（终点）
  else if (currentLocation === LOCATIONS.LIBRARY) {
    // 检查是否是从正确的地点来到图书馆
    if ((previousLocation === LOCATIONS.COMPUTER_BUILDING || previousLocation === LOCATIONS.EXCHANGE_BUILDING) && 
        gameState.gameResult === "success") {
      showMessage(`Congratulations! You've successfully reached the ${LOCATIONS.LIBRARY} and completed the game! You've managed to escape the monster and find safety within these hallowed halls of knowledge.`);
    } else {
      // 如果不是从正确的地点来或者游戏状态不正确，就要重新开始
      resetToHotel(`Game logic error: You shouldn't move from ${previousLocation} to ${LOCATIONS.LIBRARY} or the game state is incorrect. Please return to ${LOCATIONS.HOTEL} and restart.`);
      return;
    }
  }
  
  // 未知位置
  else {
    showMessage(`Unknown location: ${currentLocation}. Please scan a valid QR code at one of the game locations.`);
  }
}

// 掷骰子 - 修改版
function rollDice() {
  console.log("掷骰子开始");
  
  // 检查是否在允许掷骰子的位置
  if (!(gameState.currentLocation === LOCATIONS.HOTEL || 
        gameState.currentLocation === LOCATIONS.CANTEEN || 
        gameState.currentLocation === LOCATIONS.COMPUTER_BUILDING)) {
    showMessage("Dice rolling is not allowed at the current location.");
    return;
  }
  
  // 检查骰子点数是否已设置（防止重复掷骰子）
  if (gameState.diceRoll !== 0) {
    showMessage("You've already rolled the dice. Please proceed to the next location as instructed.");
    return;
  }
  
  // 掷骰子
  gameState.diceRoll = Math.floor(Math.random() * 6) + 1; // 1-6的随机数
  console.log("掷骰子结果:", gameState.diceRoll);
  
  // 在应用规则前，先重置多目的地显示标记
  gameState.displayingMultipleDestinations = false;
  
  // 在应用规则前，确保目的地容器是隐藏的
  hideDestinationImage();
  
  // 根据当前位置和骰子结果应用规则
  applyDiceRules();
  
  // 保存游戏状态
  saveGameState();
  
  // 更新UI（排除目的地部分，因为已经在applyDiceRules中处理）
  updateUIExceptDestination();
}

// 应用骰子规则
function applyDiceRules() {
  const { currentLocation, diceRoll } = gameState;
  console.log(`应用骰子规则: 位置=${currentLocation}, 点数=${diceRoll}`);
  
  // 起点掷骰子规则
  if (currentLocation === LOCATIONS.HOTEL) {
    if (diceRoll <= 3) {
      // 点数 ≤ 3：玩家必须去食堂，能量值为0
      gameState.energyLevel = 0;
      gameState.nextDestination = LOCATIONS.CANTEEN;
      showMessage(`You rolled a ${diceRoll}. You're feeling hungry and weak (energy: 0). You must head to the ${LOCATIONS.CANTEEN} to regain your strength before continuing. Check Google Maps for its location!`);
      
      // 显示食堂目的地图片
      showDestinationImage(LOCATIONS.CANTEEN, "Please proceed to");
    } else {
      // 点数 > 3：玩家有三个选择，能量值为5
      gameState.energyLevel = 5;
      showMessage(`You rolled a ${diceRoll}. You feel somewhat energetic (energy: 5) and have three options: visit the ${LOCATIONS.CANTEEN} for a full meal, head to the ${LOCATIONS.COMPUTER_BUILDING} which is close to the library, or try the ${LOCATIONS.EXCHANGE_BUILDING} which may be a shortcut. Choose wisely and check Google Maps for these locations!`);
      
      // 设置多目的地显示标记
      gameState.displayingMultipleDestinations = true;
      
      // 显示三个可能目的地的图片
      console.log("显示多目的地选项");
      showMultipleDestinations([LOCATIONS.CANTEEN, LOCATIONS.COMPUTER_BUILDING, LOCATIONS.EXCHANGE_BUILDING]);
    }
  }
  
  // 食堂掷骰子规则
  else if (currentLocation === LOCATIONS.CANTEEN) {
    if (diceRoll <= 3) {
      gameState.nextDestination = LOCATIONS.COMPUTER_BUILDING;
      showMessage(`You rolled a ${diceRoll}. After your meal, you decide it's safer to head to the ${LOCATIONS.COMPUTER_BUILDING} which is closer to the library. You can see the monster has entered the campus! Be quick!`);
      
      // 显示计算机楼目的地图片
      showDestinationImage(LOCATIONS.COMPUTER_BUILDING, "Please proceed to");
    } else {
      gameState.nextDestination = LOCATIONS.EXCHANGE_BUILDING;
      showMessage(`You rolled a ${diceRoll}. With your full energy, you decide to take a risk and head to the ${LOCATIONS.EXCHANGE_BUILDING}. It might be a longer route, but perhaps you can lose the monster there! Check Google Maps to locate this building.`);
      
      // 显示交换楼目的地图片
      showDestinationImage(LOCATIONS.EXCHANGE_BUILDING, "Please proceed to");
    }
  }
  
  // Exchange Building (原计算机楼)掷骰子规则
  else if (currentLocation === LOCATIONS.COMPUTER_BUILDING) {
    if (diceRoll <= 3) {
      // 成功甩开怪兽
      gameState.gameResult = "success";
      gameState.nextDestination = LOCATIONS.LIBRARY;
      showMessage(`You rolled a ${diceRoll}. Perfect timing! You managed to slip away while the monster was distracted. You can see the ${LOCATIONS.LIBRARY} ahead - make a run for it!`);
      
      // 显示图书馆目的地图片
      showDestinationImage(LOCATIONS.LIBRARY, "Please proceed to");
    } else {
      // 被怪兽追上
      gameState.gameResult = "failure";
      gameState.nextDestination = LOCATIONS.HOTEL;
      showMessage(`You rolled a ${diceRoll}. Oh no! The monster spotted you and is closing in quickly! Game over - the monster caught you. Return to ${LOCATIONS.HOTEL} to restart the game.`);
      
      // 显示旅馆目的地图片
      showDestinationImage(LOCATIONS.HOTEL, "Please return to");
    }
  }
}

// 将玩家重置到旅馆
function resetToHotel(message) {
  showMessage(message);
  gameState.currentLocation = LOCATIONS.HOTEL;
  gameState.previousLocation = '';
  gameState.energyLevel = 0;
  gameState.diceRoll = 0;
  gameState.gameResult = '';
  gameState.nextDestination = '';
  gameState.displayingMultipleDestinations = false;
  
  // 隐藏目的地图片
  hideDestinationImage();
  
  saveGameState();
  updateUI();
}

// 显示消息给玩家
function showMessage(message) {
  const messageElement = document.getElementById('gameMessage');
  if (messageElement) {
    messageElement.textContent = message;
  } else {
    alert(message); // 备用方案
  }
}

// 显示单个目的地图片
function showDestinationImage(location, captionPrefix = "Proceed to") {
  console.log(`显示单个目的地: ${location}`);
  const container = document.getElementById('destinationImageContainer');
  const image = document.getElementById('destinationImage');
  const caption = document.getElementById('destinationCaption');
  
  if (container && image && caption) {
    image.src = LOCATION_IMAGES[location] || '';
    image.alt = `${location} image`;
    caption.textContent = `${captionPrefix}: ${location}`;
    
    // 显示图片容器
    container.style.display = 'block';
    
    // 确保不会有多目的地显示的元素存在
    const oldOptionsDiv = container.querySelector('.destination-options');
    if (oldOptionsDiv) {
      container.removeChild(oldOptionsDiv);
    }
  }
}

// 显示多个目的地选项的改进版本
function showMultipleDestinations(locations) {
  console.log(`显示多个目的地: ${locations.join(', ')}`);
  // 查找容器元素
  const container = document.getElementById('destinationImageContainer');
  const mainImage = document.getElementById('destinationImage');
  const caption = document.getElementById('destinationCaption');
  
  if (!container || !mainImage || !caption) {
    console.error("找不到目的地容器元素");
    return;
  }
  
  // 移除可能已存在的额外图片元素
  const oldOptions = document.querySelectorAll('.additional-destination');
  oldOptions.forEach(option => option.remove());
  
  if (locations.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  // 显示第一个目的地为主图片
  mainImage.src = LOCATION_IMAGES[locations[0]] || '';
  mainImage.alt = `${locations[0]} image`;
  
  if (locations.length === 1) {
    // 只有一个选择
    caption.textContent = `Proceed to: ${locations[0]}`;
    container.style.display = 'block';
    return;
  }
  
  // 多个选择的情况
  caption.textContent = "Choose a destination:";
  
  // 创建一个选项容器
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'destination-options';
  optionsDiv.style.display = 'flex';
  optionsDiv.style.justifyContent = 'center';
  optionsDiv.style.flexWrap = 'wrap';
  optionsDiv.style.gap = '10px';
  optionsDiv.style.marginTop = '10px';
  
  // 为每个地点创建一个显示项
  locations.forEach(location => {
    const option = document.createElement('div');
    option.className = 'additional-destination';
    option.style.textAlign = 'center';
    option.style.margin = '5px';
    option.style.width = '30%'; // 设置宽度使一行可以显示3个
    
    // 创建图片元素
    const img = document.createElement('img');
    img.src = LOCATION_IMAGES[location] || '';
    img.alt = `${location} image`;
    img.style.width = '100%';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    img.style.maxHeight = '100px';
    img.style.objectFit = 'cover';
    
    // 创建标题元素
    const title = document.createElement('div');
    title.textContent = location;
    title.style.marginTop = '5px';
    title.style.fontWeight = 'bold';
    title.style.color = '#2e7d32';
    
    option.appendChild(img);
    option.appendChild(title);
    optionsDiv.appendChild(option);
  });
  
  // 移除旧的选项容器（如果有）
  const oldOptionsDiv = container.querySelector('.destination-options');
  if (oldOptionsDiv) {
    container.removeChild(oldOptionsDiv);
  }
  
  // 添加新的选项容器
  container.appendChild(optionsDiv);
  
  // 显示容器
  container.style.display = 'block';
}

// 隐藏目的地图片
function hideDestinationImage() {
  console.log("隐藏目的地图片");
  const container = document.getElementById('destinationImageContainer');
  if (container) {
    container.style.display = 'none';
    
    // 清理可能存在的多目的地选项
    const oldOptionsDiv = container.querySelector('.destination-options');
    if (oldOptionsDiv) {
      container.removeChild(oldOptionsDiv);
    }
  }
}

// 新增：更新UI但不处理目的地显示
function updateUIExceptDestination() {
  // 更新位置显示
  const locationElement = document.getElementById('currentLocation');
  if (locationElement) {
    locationElement.textContent = gameState.currentLocation || "-";
  }
  
  // 更新能量值显示
  const energyElement = document.getElementById('energyLevel');
  if (energyElement) {
    energyElement.textContent = gameState.energyLevel;
  }
  
  // 更新骰子点数显示
  const diceElement = document.getElementById('diceRoll');
  if (diceElement) {
    diceElement.textContent = gameState.diceRoll > 0 ? gameState.diceRoll : '-';
  }
  
  // 更新游戏结果显示
  const resultElement = document.getElementById('gameResult');
  if (resultElement) {
    if (gameState.gameResult === "success") {
      resultElement.textContent = "Success";
      resultElement.className = "success";
    } else if (gameState.gameResult === "failure") {
      resultElement.textContent = "Failure";
      resultElement.className = "failure";
    } else {
      resultElement.textContent = "In Progress";
      resultElement.className = "";
    }
  }
  
  // 根据当前位置启用/禁用掷骰子按钮
  const rollDiceButton = document.getElementById('rollDiceButton');
  if (rollDiceButton) {
    // 只有在旅馆、食堂和计算机楼才允许掷骰子，且必须是尚未掷过骰子的状态
    rollDiceButton.disabled = !(
      (gameState.currentLocation === LOCATIONS.HOTEL ||
       gameState.currentLocation === LOCATIONS.CANTEEN ||
       gameState.currentLocation === LOCATIONS.COMPUTER_BUILDING) &&
      gameState.diceRoll === 0
    );
  }
  
  // 故意省略目的地图片更新，因为这已经在applyDiceRules中处理了
}

// 更新UI - 修改版
function updateUI() {
  // 更新位置显示
  const locationElement = document.getElementById('currentLocation');
  if (locationElement) {
    locationElement.textContent = gameState.currentLocation || "-";
  }
  
  // 更新能量值显示
  const energyElement = document.getElementById('energyLevel');
  if (energyElement) {
    energyElement.textContent = gameState.energyLevel;
  }
  
  // 更新骰子点数显示
  const diceElement = document.getElementById('diceRoll');
  if (diceElement) {
    diceElement.textContent = gameState.diceRoll > 0 ? gameState.diceRoll : '-';
  }
  
  // 更新游戏结果显示
  const resultElement = document.getElementById('gameResult');
  if (resultElement) {
    if (gameState.gameResult === "success") {
      resultElement.textContent = "Success";
      resultElement.className = "success";
    } else if (gameState.gameResult === "failure") {
      resultElement.textContent = "Failure";
      resultElement.className = "failure";
    } else {
      resultElement.textContent = "In Progress";
      resultElement.className = "";
    }
  }
  
  // 根据当前位置启用/禁用掷骰子按钮
  const rollDiceButton = document.getElementById('rollDiceButton');
  if (rollDiceButton) {
    // 只有在旅馆、食堂和计算机楼才允许掷骰子，且必须是尚未掷过骰子的状态
    rollDiceButton.disabled = !(
      (gameState.currentLocation === LOCATIONS.HOTEL ||
       gameState.currentLocation === LOCATIONS.CANTEEN ||
       gameState.currentLocation === LOCATIONS.COMPUTER_BUILDING) &&
      gameState.diceRoll === 0
    );
  }
  
  // 关键修改：仅在非多目的地显示状态下更新目的地图片
  if (!gameState.displayingMultipleDestinations) {
    console.log("updateUI: 更新目的地图片 (非多目的地状态)");
    // 更新目的地图片
    if (gameState.nextDestination) {
      showDestinationImage(gameState.nextDestination, "Please proceed to");
    } else if (gameState.gameResult === "failure" && gameState.currentLocation !== LOCATIONS.HOTEL) {
      showDestinationImage(LOCATIONS.HOTEL, "Please return to");
    } else if (gameState.diceRoll === 0) { // 只有在未掷骰子时才隐藏
      // 如果没有明确的下一个目的地且不是失败状态，隐藏图片
      hideDestinationImage();
    }
  } else {
    console.log("updateUI: 保持多目的地显示状态");
  }
}

// 导出函数供主页面使用
window.gameModule = {
  initGame,
  handleLocationUpdate,
  rollDice,
  resetGame,
  showDestinationImage,
  hideDestinationImage,
  updateUIExceptDestination
};