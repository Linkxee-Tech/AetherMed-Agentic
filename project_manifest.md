# AetherMed Agentic Project Manifest

## Product name

**AetherMed Agentic**

## Current product scope

AetherMed Agentic is a safety-first, multilingual healthcare guidance system with multimodal intake.

It can currently handle:

- text symptoms
- visible body images
- medical reports or clinic notes
- X-rays or scans through a non-diagnostic safety path
- upload-first routing with optional direct camera capture

## Core routing model

The backend routes requests into one of four safe paths:

1. `text` -> orchestrated triage and recommendation workflow
2. `visual` -> visible symptom image review
3. `document` -> medical document explanation
4. `medical_imaging` -> safety-limited non-diagnostic response

## Safety position

- The system does not provide a medical diagnosis.
- The system does not prescribe treatment.
- Prescription dosing is not provided.
- Emergency symptoms are escalated immediately.
- Medical imaging is not interpreted as a radiology diagnosis.
- Medical documents are explained in plain language without overriding the original report.

## Frontend experience

The React frontend provides:

- text symptom assessment
- upload assistant with automatic routing
- direct image review
- medical document explainer
- direct camera scan for users who do not already have a file on the device
- session history and local user preferences

## Backend services

Main routes:

- `GET /api/v1/health`
- `POST /api/v1/analyze`
- `POST /api/v1/analyze-visual`
- `POST /api/v1/analyze-document`
- `POST /api/v1/upload-assistant`
- `POST /api/v1/analyze-input`
- `GET /api/v1/session/:id`

## Runtime modes

The project supports:

- OpenAI-backed live mode
- offline fallback mode with deterministic safety-first behavior

This keeps the demo resilient even when live model access is unavailable.

## Demo positioning

For presentation, the strongest end-to-end demo flow is:

1. show text symptom triage with multilingual handling
2. show upload assistant classifying an image
3. show document explanation in plain language
4. show scan-safe refusal for an X-ray or similar imaging upload

## Repository note

This manifest reflects the current implemented product, not the earlier hackathon-only MVP plan.
