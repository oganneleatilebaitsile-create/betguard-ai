"""
BetGuard AI — Linked Accounts Signal
-------------------------------------
This is a LEARNING EXERCISE using invented, fictional data only.
It is NOT connected to any real betting company, real accounts,
real payments, or real betting activity of any kind.

Extends the original single-account risk calculator with a fourth
signal: whether this account shares a device or IP address with
OTHER accounts that are also showing risk signs. This is a simple,
explainable version of the "graph-based" or "network" fraud
detection approach real fraud teams use to catch coordinated
rings ("gnoming") — groups of accounts working together — rather
than just looking at one account in isolation.

Pair this with betguard_risk_calculator.py: run the per-account
score first, then use this to see whether a group of accounts is
riskier together than any one of them looks alone.
"""

from betguard_risk_calculator import calculate_risk_score, classify_risk


def build_linked_group(accounts):
    """
    Given a list of account dicts, group them by shared device_id
    or shared ip_address. Returns a dict of group_key -> list of
    account ids that share that device or IP.

    Each account dict looks like:
        {
            "id": "acct_1",
            "device_id": "device_A",
            "ip_address": "197.0.2.10",
            "shared_device_accounts": 0,
            "bonus_claims": 2,
            "unusual_deposits": False,
        }
    """
    by_device = {}
    by_ip = {}
    for acct in accounts:
        by_device.setdefault(acct["device_id"], []).append(acct["id"])
        by_ip.setdefault(acct["ip_address"], []).append(acct["id"])

    groups = {}
    for device_id, ids in by_device.items():
        if len(ids) > 1:
            groups["device:" + device_id] = ids
    for ip, ids in by_ip.items():
        if len(ids) > 1:
            key = "ip:" + ip
            # avoid double-counting a group already caught by device_id
            if not any(set(ids) == set(v) for v in groups.values()):
                groups[key] = ids
    return groups


def linked_account_bonus(account_id, groups):
    """
    How much extra risk this account picks up for being part of a
    linked group. Simple and explainable, on purpose:
      - not linked to anyone else: +0
      - linked to 1 other account: +10
      - linked to 2 or more other accounts: +20
    """
    max_group_size = 1
    for ids in groups.values():
        if account_id in ids:
            max_group_size = max(max_group_size, len(ids))
    others = max_group_size - 1
    if others <= 0:
        return 0, "Not linked to any other account by device or IP."
    if others == 1:
        return 10, "Shares a device or IP with 1 other account."
    return 20, f"Shares a device or IP with {others} other accounts — part of a larger cluster."


def score_account_with_links(account, all_accounts):
    """
    Combine the original three-signal score with the new linked
    accounts signal, for one account, in the context of a wider
    batch of accounts.
    """
    base_score = calculate_risk_score(
        account["shared_device_accounts"],
        account["bonus_claims"],
        account["unusual_deposits"],
    )
    groups = build_linked_group(all_accounts)
    link_bonus, link_note = linked_account_bonus(account["id"], groups)
    total_score = min(base_score + link_bonus, 100)
    tier, explanation = classify_risk(total_score)
    return {
        "id": account["id"],
        "base_score": base_score,
        "link_bonus": link_bonus,
        "link_note": link_note,
        "total_score": total_score,
        "tier": tier,
        "explanation": explanation,
    }


def demo():
    """
    Runs a small worked example with invented accounts, so you can
    see the linked-accounts signal in action without typing anything
    in. This is the easiest way to show the feature in the README
    or a demo video.
    """
    fictional_accounts = [
        {"id": "acct_1", "device_id": "device_A", "ip_address": "197.0.2.10",
         "shared_device_accounts": 0, "bonus_claims": 2, "unusual_deposits": False},
        {"id": "acct_2", "device_id": "device_A", "ip_address": "197.0.2.11",
         "shared_device_accounts": 0, "bonus_claims": 3, "unusual_deposits": False},
        {"id": "acct_3", "device_id": "device_A", "ip_address": "197.0.2.12",
         "shared_device_accounts": 0, "bonus_claims": 1, "unusual_deposits": True},
        {"id": "acct_4", "device_id": "device_B", "ip_address": "197.0.2.20",
         "shared_device_accounts": 0, "bonus_claims": 0, "unusual_deposits": False},
    ]

    print("=" * 60)
    print("  BetGuard AI — Linked Accounts Signal (demo)")
    print("  (fictional data only — for learning purposes)")
    print("=" * 60)
    print()
    print("  acct_1, acct_2 and acct_3 share device_A.")
    print("  acct_4 is unrelated.")
    print()

    for acct in fictional_accounts:
        result = score_account_with_links(acct, fictional_accounts)
        print("-" * 60)
        print(f"  Account:      {result['id']}")
        print(f"  Base score:   {result['base_score']} / 100 (single-account signals)")
        print(f"  Link bonus:   +{result['link_bonus']} ({result['link_note']})")
        print(f"  Total score:  {result['total_score']} / 100")
        print(f"  Risk level:   {result['tier']}")
        print(f"  Note:         {result['explanation']}")
    print("-" * 60)
    print()
    print("Reminder: this uses invented accounts and a simplified formula.")
    print("It is a practice exercise, not a real fraud-detection system.")


if __name__ == "__main__":
    demo()
  
