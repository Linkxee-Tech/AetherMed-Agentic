# Prompt Opinion A2A Deployment

This guide is for deploying the AetherMed backend in `backend/` as a Prompt Opinion compatible A2A agent.

## What Prompt Opinion Needs

Register this URL in Prompt Opinion after deployment:

```text
https://aethermed-agentic.onrender.com/.well-known/agent-card.json
```

The backend now exposes:

- `GET /.well-known/agent-card.json`
- `POST /` for A2A JSON-RPC
- `GET /health` for platform health checks

## Required Environment Variables

Minimum:

```env
OPENAI_API_KEY=...
ALLOWED_ORIGINS=https://aether-med-agentic.vercel.app,https://aethermed-agentic.onrender.com
PROMPT_OPINION_API_KEY=
```

Recommended:

```env
OPENAI_MODEL=gpt-5-mini
OPENAI_VISION_MODEL=gpt-4.1-mini
AETHERMED_AGENT_MODE=auto
MONGODB_URI=mongodb+srv://AetherMedAgentic:***@aethermedagentic.y4ee5if.mongodb.net/?appName=AetherMedAgentic
PROMPT_OPINION_AGENT_NAME=aethermed_master_agent
PROMPT_OPINION_AGENT_DESCRIPTION=AetherMed multimodal healthcare guidance agent for Prompt Opinion.
PROMPT_OPINION_AGENT_VERSION=1.0.0
PROMPT_OPINION_AGENT_URL=https://aethermed-agentic.onrender.com
```

Notes:

- `PROMPT_OPINION_AGENT_URL` should be the final public backend URL.
- If omitted on Render or Railway, the backend can infer the public URL from platform-provided environment variables.
- `PROMPT_OPINION_API_KEY` is optional in code. It is currently safe to leave blank if you want Prompt Opinion to call the agent without header auth.

## Supported A2A Skills

The agent card now advertises these Prompt Opinion friendly skills:

- Symptom Triage
- Visible Symptom Review
- Medical Document Explainer
- Medical Imaging Safety Guidance
- Multilingual Health Guidance

## A2A Request Examples

Text symptom analysis:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "text",
          "text": "I have fever, sore throat, and body aches for two days."
        }
      ],
      "metadata": {
        "task": "symptom_analysis"
      }
    }
  }
}
```

Visible image review using structured data:

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "data",
          "data": {
            "task": "visual_symptom_review",
            "notes": "Red itchy rash on left arm for two days",
            "imageDataUrl": "data:image/png;base64,..."
          }
        }
      ]
    }
  }
}
```

Medical document explanation:

```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "data",
          "data": {
            "task": "medical_document_explanation",
            "documentText": "HbA1c 9.2 percent. Follow-up in 3 months.",
            "notes": "Please explain this in simple language."
          }
        }
      ]
    }
  }
}
```

## Render

Official references:

- https://render.com/docs/configure-environment-variables
- https://render.com/docs/blueprint-spec
- https://render.com/docs/monorepo-support

Prepared file:

- `render.yaml` at the repo root

Dashboard settings if you deploy manually:

- Service type: Web Service
- Runtime: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Health Check Path: `/health`

Set these environment variables in Render:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_VISION_MODEL`
- `AETHERMED_AGENT_MODE`
- `ALLOWED_ORIGINS`
- `MONGODB_URI`
- `PROMPT_OPINION_API_KEY`
- `PROMPT_OPINION_AGENT_NAME`
- `PROMPT_OPINION_AGENT_DESCRIPTION`
- `PROMPT_OPINION_AGENT_VERSION`

After deploy, register:

```text
https://aethermed-agentic.onrender.com/.well-known/agent-card.json
```

## Railway

Official references:

- https://docs.railway.com/config-as-code
- https://docs.railway.com/cli/deploying
- https://docs.railway.com/guides/variables

Recommended service settings:

- Service root: `backend`
- Start command: `node server.js`
- Healthcheck path: `/health`

Railway usually injects `PORT` automatically. The backend already reads `process.env.PORT`.

Set these service variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-5-mini`
- `OPENAI_VISION_MODEL=gpt-4.1-mini`
- `AETHERMED_AGENT_MODE=auto`
- `ALLOWED_ORIGINS=https://aether-med-agentic.vercel.app,https://aethermed-agentic.onrender.com`
- `MONGODB_URI`
- `PROMPT_OPINION_API_KEY`
- `PROMPT_OPINION_AGENT_NAME=aethermed_master_agent`
- `PROMPT_OPINION_AGENT_DESCRIPTION=AetherMed multimodal healthcare guidance agent for Prompt Opinion.`
- `PROMPT_OPINION_AGENT_VERSION=1.0.0`

If your Railway public domain is already assigned, you can also set:

- `PROMPT_OPINION_AGENT_URL=https://<your-railway-domain>`

Otherwise the backend can derive the public URL from Railway's public domain variable.

CLI deploy from the repo root:

```bash
railway up --service <your-service-name>
```

## Cloud Run

Official references:

- https://docs.cloud.google.com/run/docs/deploying-source-code
- https://cloud.google.com/run/docs/configuring/healthchecks

Deploy from the repo root so Cloud Run builds only the backend folder:

```bash
gcloud run deploy aethermed-prompt-opinion \
  --source backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=YOUR_KEY,OPENAI_MODEL=gpt-5-mini,OPENAI_VISION_MODEL=gpt-4.1-mini,AETHERMED_AGENT_MODE=auto,ALLOWED_ORIGINS=https://your-frontend.example.com,PROMPT_OPINION_API_KEY=YOUR_PROMPT_OPINION_KEY,PROMPT_OPINION_AGENT_NAME=aethermed_master_agent,PROMPT_OPINION_AGENT_DESCRIPTION="AetherMed multimodal healthcare guidance agent for Prompt Opinion.",PROMPT_OPINION_AGENT_VERSION=1.0.0
```

Cloud Run injects `PORT` automatically, so no extra port config is needed.

After deployment, either:

1. Copy the generated service URL and set it as `PROMPT_OPINION_AGENT_URL` in a second deploy/update.
2. Register the generated URL directly in Prompt Opinion.

Health check path to use if you add a startup or liveness probe:

```text
/health
```

## Final Prompt Opinion Registration

Use the deployed agent card URL:

```text
https://aethermed-agentic.onrender.com/.well-known/agent-card.json
```

If you later enable Prompt Opinion API-key protection, the value sent by Prompt Opinion must match your deployed `PROMPT_OPINION_API_KEY`.
