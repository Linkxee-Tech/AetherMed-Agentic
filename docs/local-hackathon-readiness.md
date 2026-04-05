# Local Hackathon Readiness

This repository now supports a stronger local-only workflow while Prompt Opinion platform setup is pending.

## What Changed

- Added an offline clinical engine for the existing multi-agent chain.
- Made MongoDB persistence optional so demos can run without a live database.
- Added `/api/v1/health` to expose backend status and active engine mode.
- Added a synthetic evaluation suite to validate red-flag routing and referral logic.
- Switched the frontend API base URL to use `VITE_API_BASE_URL` when present.

## Offline Agent Mode

Set `AETHERMED_AGENT_MODE=offline` in the backend environment to force local heuristic agents instead of live OpenAI-powered routing.

This is useful for:

- local demos without network reliability
- synthetic evaluation runs
- hackathon rehearsals where deterministic behavior is more important than model variability

## Synthetic Evaluation

Run the backend evaluation suite:

```powershell
cd backend
npm run eval:synthetic
```

It verifies sample cases such as:

- chest pain plus shortness of breath escalating to emergency care
- pediatric fever and vomiting routing to urgent care
- moderate headache and dizziness routing to primary care

## Remaining Prompt Opinion Work

The main submission gap is still external integration:

- Prompt Opinion agent configuration and publishing
- platform-native A2A / COIN alignment
- SHARP / FHIR context propagation inside Prompt Opinion
- the final in-platform demo flow

Everything in this document is meant to improve local readiness until network-dependent setup is available.
