# Proposed Architecture

The current MVP (`cli/` and `web-demo/`) is a deliberately simple, transparent
weighted-scoring model. This document sketches the direction a production
version could grow into — it is a design proposal for discussion, **not**
a description of anything that has been built or benchmarked.

## Today (built)

- Three input signals: shared-device account count, bonus claim count,
  deposit-pattern level.
- A weighted formula combining them into a single 0–100 score.
- Score maps to a Low / Moderate / High risk tier with a recommended action.
- Two interfaces: a CLI prompt (`cli/betguard_risk_calculator.py`) and an
  interactive web demo (`web-demo/index.html`) with live sliders and a gauge.

## Proposed direction (not built)

- **Model**: move from fixed weights to a trained classifier (e.g. gradient-
  boosted trees) once real, labeled data is available to train and validate
  one.
- **Signals**: expand beyond the current three — device/IP correlation,
  KYC verification status, withdrawal-to-deposit ratio, velocity checks.
- **Serving**: a real-time scoring API sitting between the account-management
  system and the review queue, returning a score and tier per event.
- **Feedback loop**: reviewer decisions (confirmed fraud vs. false positive)
  feed back into retraining, so weights/model improve over time instead of
  staying static.

## Why start rule-based

A transparent, weighted model is easy to explain to a compliance or audit
team, easy to tune by hand before there's enough data to train a model, and
easy to hand over rather than lock a partner into a single vendor's black
box. The trained-model step is a natural evolution once labeled data exists
— not a prerequisite for the MVP to be useful.
