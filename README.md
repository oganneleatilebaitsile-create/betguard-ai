# BetGuard AI
**🔗 Live demo:** [betguard-ai.../app](https://oganneleatilebaitsile-create.github.io/betguard-ai/app/) — try the review console directly, no download needed.

A small, explainable risk-scoring engine for flagging account-level fraud patterns in online betting/gaming accounts — multi-accounting, bonus abuse, and irregular deposit activity — built as a learning project and portfolio piece.
A small, explainable risk-scoring engine for flagging account-level fraud
patterns in online betting/gaming accounts — multi-accounting, bonus abuse,
and irregular deposit activity — built as a learning project and portfolio
piece.

> **This is a demo built on invented, fictional data.** It is not connected
> to Betway, any real betting company, real accounts, payments, or
> real betting activity of any kind.

## What it does

Every account is scored against three signals:

| Signal                    | What it flags                                              |
|----------------------------|-------------------------------------------------------------|
| Shared device accounts     | Multiple accounts logging in from the same device           |
| Bonus claims                | How many promo/free-bet offers an account has claimed        |
| Deposit pattern             | Whether recent deposits break from the account's own history |

Those combine into a single 0–100 risk score, which maps to a tier:

| Score  | Tier      | Action                                              |
|--------|-----------|------------------------------------------------------|
| 0–29   | Low       | No action — continue normal monitoring               |
| 30–59  | Moderate  | Flag for a closer look at the next natural touchpoint |
| 60–100 | High      | Hold for manual review before approving bonuses/payouts |

## Project structure
