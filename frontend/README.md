# AetherMed Agentic Frontend

This frontend is a React + Vite interface for AetherMed Agentic.

## What it does

- Collects text symptoms, age range, urgency, and optional notes
- Supports image review for visible body issues
- Supports medical document explanation from screenshots, text files, and PDFs with extractable text
- Includes an upload assistant that classifies uploads and asks only the minimum extra context needed
- Includes direct camera capture for users who want to scan immediately instead of choosing an existing file
- Renders structured multimodal summaries returned by the backend

## Local development

```bash
npm install
npm run dev
```

The frontend expects the backend API at `http://127.0.0.1:5000/api/v1` unless `VITE_API_BASE_URL` is provided.

## Build

```bash
npm run build
```

## Notes

- `pdfjs-dist` is loaded lazily so PDF support does not bloat the main bundle.
- The UI is designed as a presentation-ready demo shell, but all medical output remains safety-limited and non-diagnostic.
