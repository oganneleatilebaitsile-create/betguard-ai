"""
BetGuard AI — Practice Risk Calculator
----------------------------------------
This is a LEARNING EXERCISE using invented, fictional data only.
It is NOT connected to Betway, any real betting company, real
accounts, real payments, or real betting activity of any kind.

It shows how a simple rule-based risk score could be built —
the same basic idea used by fraud/risk teams to flag accounts
worth a closer look (not to place or influence bets).
"""


def get_positive_int(prompt):
    """Ask for a whole number >= 0, keep asking until we get one."""
    while True:
        raw = input(prompt).strip()
        if raw.isdigit():
            return int(raw)
        print("  Please enter a whole number (e.g. 0, 1, 2, 3)...")


def get_yes_no(prompt):
    """Ask a yes/no question, return True/False."""
    while True:
        raw = input(prompt).strip().lower()
        if raw in ("y", "yes"):
            return True
        if raw in ("n", "no"):
            return False
        print("  Please answer y or n...")


def calculate_risk_score(shared_device_accounts, bonus_claims, unusual_deposits):
    """
    Combine the three inputs into a single practice risk score (0-100).
    """
    score = 0
    score += shared_device_accounts * 15
    score += bonus_claims * 8
    if unusual_deposits:
        score += 25
    return min(score, 100)


def classify_risk(score):
    """Turn a numeric score into a plain-English risk tier."""
    if score < 30:
        return "Low", "Nothing unusual stands out from these three signals."
    elif score < 60:
        return "Moderate", "A couple of signals worth a second look, not yet alarming."
    else:
        return "High", "Several signals stacking up — this account would typically get flagged for manual review."


def main():
    print("=" * 50)
    print("  BetGuard AI — Practice Risk Calculator")
    print("  (fictional data only — for learning purposes)")
    print("=" * 50)
    print()

    shared_device_accounts = get_positive_int(
        "How many accounts use the same device? (0 if just this one): "
    )
    bonus_claims = get_positive_int(
        "How many bonus claims were made on this account?: "
    )
    unusual_deposits = get_yes_no(
        "Was there an unusual deposit pattern? (y/n): "
    )

    score = calculate_risk_score(shared_device_accounts, bonus_claims, unusual_deposits)
    tier, explanation = classify_risk(score)

    print()
    print("-" * 50)
    print(f"  Risk score:  {score} / 100")
    print(f"  Risk level:  {tier}")
    print(f"  Note:        {explanation}")
    print("-" * 50)
    print()
    print("Reminder: this uses invented numbers and a simplified formula.")
    print("It is a practice exercise, not a real fraud-detection system.")


if __name__ == "__main__":
    main()
