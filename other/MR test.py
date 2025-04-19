import random


def simulate_game():
    """
    Simulate one game, return the path number and whether it was successful

    Path definitions:
    1. Path 1: Starting Point → Canteen → Exchange Building → Library
    2. Path 2: Starting Point → Canteen → Yangfujia Building → Library
    3. Path 3: Starting Point → Exchange Building → Library
    4. Path 4: Starting Point → Yangfujia Building
    5. Path 5: Starting Point → Canteen (player choice) → Exchange Building → Library
    6. Path 6: Starting Point → Canteen (player choice) → Yangfujia Building → Library
    7. Path 7: Invalid path (system reset)
    """
    # Start from the Starting Point (Hotel)
    first_dice = random.randint(1, 6)

    # Determine the result of the first dice roll
    if first_dice <= 3:  # Roll ≤ 3: Must go to Canteen, energy value is 0
        # Energy value recovers to 10 at the Canteen
        energy = 10

        # Roll dice at the Canteen
        canteen_dice = random.randint(1, 6)

        if canteen_dice <= 3:  # Proceed to Exchange Building
            # Roll dice at the Exchange Building
            ex_dice = random.randint(1, 6)

            if ex_dice <= 3:  # Successfully escape the monster, proceed to the Library
                return 1, True  # Path 1 success
            else:  # Caught by the monster
                return 1, False  # Path 1 failure
        else:  # Proceed to Yangfujia Building
            # Check energy value at Yangfujia Building, currently 10 > 5, enough energy to proceed to the Library
            return 2, True  # Path 2 success (guaranteed)
    else:  # Roll > 3: Player has three choices, energy value is 5
        energy = 5

        # Player randomly chooses destination - here each location has 1/3 probability
        choice_rand = random.random()

        if choice_rand < 1 / 3:  # Choose Exchange Building - 1/3 probability
            # Roll dice at the Exchange Building
            ex_dice = random.randint(1, 6)

            if ex_dice <= 3:  # Successfully escape the monster, proceed to the Library
                return 3, True  # Path 3 success
            else:  # Caught by the monster
                return 3, False  # Path 3 failure

        elif choice_rand < 2 / 3:  # Choose Yangfujia Building - 1/3 probability
            # Check energy value at Yangfujia Building, currently 5 ≤ 5, insufficient energy
            return 4, False  # Path 4 failure (guaranteed)

        else:  # Choose Canteen - 1/3 probability
            # Energy value recovers to 10 at the Canteen
            energy = 10

            # Roll dice at the Canteen
            canteen_dice = random.randint(1, 6)

            if canteen_dice <= 3:  # Proceed to Exchange Building
                # Roll dice at the Exchange Building
                ex_dice = random.randint(1, 6)

                if ex_dice <= 3:  # Successfully escape the monster, proceed to the Library
                    return 5, True  # Path 5 success
                else:  # Caught by the monster
                    return 5, False  # Path 5 failure
            else:  # Proceed to Yangfujia Building
                # Check energy value at Yangfujia Building, currently 10 > 5, enough energy to proceed to the Library
                return 6, True  # Path 6 success (guaranteed)


def calculate_theoretical_probabilities():
    """Calculate the theoretical probabilities analyzed in the document"""
    theoretical = {
        "paths": {
            1: {
                "occurrence_rate": 12.5,  # 0.5(dice roll≤3) × 0.5(dice roll≤3) = 0.25 × 50% = 12.5%
                "success_rate": 50.0,  # 50%
                "contribution": 6.25  # 12.5% × 50% = 6.25%
            },
            2: {
                "occurrence_rate": 12.5,  # 0.5(dice roll≤3) × 0.5(dice roll>3) = 0.25 × 50% = 12.5%
                "success_rate": 100.0,  # 100%
                "contribution": 12.5  # 12.5% × 100% = 12.5%
            },
            3: {
                "occurrence_rate": 8.33,  # 0.5(dice roll>3) × (1/3)(choose Exchange Building) = 16.67% × 50% = 8.33%
                "success_rate": 50.0,  # 50%
                "contribution": 4.17  # 8.33% × 50% = 4.17%
            },
            4: {
                "occurrence_rate": 16.67,  # 0.5(dice roll>3) × (1/3)(choose Yangfujia Building) = 16.67%
                "success_rate": 0.0,  # 0%
                "contribution": 0.0  # 16.67% × 0% = 0%
            },
            5: {
                "occurrence_rate": 8.33,  # 0.5(dice roll>3) × (1/3)(choose Canteen) × 0.5(dice roll≤3) = 0.0833 × 50% = 4.17%
                "success_rate": 50.0,  # 50%
                "contribution": 2.09  # 8.33% × 50% = 4.17% (document calculation error, should be 4.17%)
            },
            6: {
                "occurrence_rate": 8.33,  # 0.5(dice roll>3) × (1/3)(choose Canteen) × 0.5(dice roll>3) = 0.0833 = 4.17%
                "success_rate": 100.0,  # 100%
                "contribution": 4.17  # 8.33% × 100% = 8.33% (document calculation error, should be 8.33%)
            }
        },
        "overall_success_rate": 29.18  # Total
    }

    # Correct calculation errors in analysis document
    theoretical["paths"][3]["occurrence_rate"] = 16.67 / 2  # Should be 0.5(dice roll>3) × (1/3) = 16.67%
    theoretical["paths"][5]["occurrence_rate"] = 16.67 / 6  # Should be 0.5 × (1/3) × 0.5 = 8.33%
    theoretical["paths"][6]["occurrence_rate"] = 16.67 / 6  # Should be 0.5 × (1/3) × 0.5 = 8.33%

    # Recalculate contribution rates
    for path in theoretical["paths"]:
        occ = theoretical["paths"][path]["occurrence_rate"]
        succ = theoretical["paths"][path]["success_rate"]
        theoretical["paths"][path]["contribution"] = occ * succ / 100

    # Recalculate overall success rate
    total = sum(theoretical["paths"][path]["contribution"] for path in theoretical["paths"])
    theoretical["overall_success_rate"] = total

    return theoretical


def run_simulation(num_simulations=100000):
    """Run the specified number of game simulations and return statistics"""
    # Initialize statistical data
    path_counts = {i: 0 for i in range(1, 8)}
    success_counts = {i: 0 for i in range(1, 8)}

    # Run simulation
    for _ in range(num_simulations):
        path, success = simulate_game()
        path_counts[path] += 1
        if success:
            success_counts[path] += 1

    # Calculate statistical results
    results = {
        "total_simulations": num_simulations,
        "total_success": sum(success_counts.values()),
        "paths": {}
    }

    # Calculate statistics for each path
    for path in range(1, 7):  # Paths 1-6
        count = path_counts[path]
        success = success_counts[path]

        if count > 0:
            success_rate = success / count * 100
            occurrence_rate = count / num_simulations * 100
            contribution = success / num_simulations * 100
        else:
            success_rate = 0
            occurrence_rate = 0
            contribution = 0

        results["paths"][path] = {
            "count": count,
            "occurrence_rate": occurrence_rate,
            "success_count": success,
            "success_rate": success_rate,
            "contribution": contribution
        }

    # Calculate overall success rate
    results["overall_success_rate"] = results["total_success"] / num_simulations * 100

    return results


def print_results(results, theoretical=None):
    """Print results in the format analyzed in the document"""
    print("=" * 70)
    print("Game Path Analysis Summary")
    print("=" * 70)
    print("Success and Failure Rates for 7 Main Paths")

    path_descriptions = {
        1: "Starting Point → Canteen → Exchange Building → Library",
        2: "Starting Point → Canteen → Yangfujia Building → Library",
        3: "Starting Point → Exchange Building → Library",
        4: "Starting Point → Yangfujia Building",
        5: "Starting Point → Canteen (player choice) → Exchange Building → Library",
        6: "Starting Point → Canteen (player choice) → Yangfujia Building → Library",
        7: "Starting Point → Any invalid path → Reset to Starting Point"
    }

    # Print information for each path
    for path in range(1, 7):
        path_data = results["paths"][path]

        print(f"\n{path}. Path {path}: {path_descriptions[path]}")
        print(f"   * Success Rate: {path_data['success_rate']:.2f}%")
        print(f"   * Failure Rate: {100 - path_data['success_rate']:.2f}%")
        print(f"   * Occurrence Probability: {path_data['occurrence_rate']:.2f}%")
        if theoretical:
            print(f"   * Theoretical Occurrence Probability: {theoretical['paths'][path]['occurrence_rate']:.2f}%")
        print(f"   * Contribution to Overall Success Rate: {path_data['contribution']:.2f}%")
        if theoretical:
            print(f"   * Theoretical Contribution: {theoretical['paths'][path]['contribution']:.2f}%")

    # Print overall success probability
    print("\n" + "=" * 70)
    print("Overall Success Probability Analysis:")

    # Print each path's contribution to the overall success rate
    total_contribution = 0
    for path in range(1, 7):
        path_data = results["paths"][path]
        contribution = path_data["contribution"]
        total_contribution += contribution
        print(
            f"* Path {path} Contribution: {path_data['occurrence_rate']:.2f}% × {path_data['success_rate']:.2f}% = {contribution:.2f}%")

    print(f"Overall Success Probability: Approximately {total_contribution:.2f}%")
    print(f"Simulation Calculation Result: {results['overall_success_rate']:.2f}%")
    if theoretical:
        print(f"Theoretical Value in Analysis Document: {theoretical['overall_success_rate']:.2f}%")

    print("\n" + "=" * 70)
    print("Key Findings")
    print("1. Safest Paths:")
    for path in [2, 6]:
        print(f"   * Path {path}: {path_descriptions[path]} (100% success)")

    print("2. Most Dangerous Path:")
    print(f"   * Path 4: {path_descriptions[4]} (100% failure)")

    print("3. Highest Probability Success Path:")
    max_contribution = max([results['paths'][p]['contribution'] for p in range(1, 7)])
    max_paths = [p for p in range(1, 7) if abs(results['paths'][p]['contribution'] - max_contribution) < 0.01]
    for path in max_paths:
        print(
            f"   * Path {path}, Occurrence Probability {results['paths'][path]['occurrence_rate']:.2f}% with Success Rate {results['paths'][path]['success_rate']:.0f}%")

    print("4. Criticality of Energy System:")
    print("   * Restoring energy to 10 at the Canteen is a key factor for success")
    print("   * Any path through the Canteen and then to Yangfujia Building guarantees success")
    print("   * With energy at 5, only the Exchange Building path is possible, with only 50% success rate")
    print("=" * 70)


def main():
    # Set a random seed to ensure reproducible results
    random.seed(42)

    # Calculate theoretical probabilities
    theoretical = calculate_theoretical_probabilities()

    # Run simulation
    results = run_simulation(100000)

    # Print results
    print_results(results, theoretical)


if __name__ == "__main__":
    main()