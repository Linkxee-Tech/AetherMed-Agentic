# AetherMed: Project Manifest

## 1. Project name suggestions
- AetherMed
- NovaTriage
- CareFlow Orchestrator
- PulseAgent AI

## 2. Final recommended name
**AetherMed**

## 3. Problem statement
When patients experience acute symptoms at home, they often struggle to accurately assess severity, leading to either dangerous delays in seeking emergency care or unnecessary crowding of emergency rooms for minor issues. Existing healthcare chatbots are often simple decision trees or unsafe free-form generation bots that lack formal, structured clinical reasoning, failing to reliably escalate life-threatening "red flags."

## 4. Solution summary
AetherMed is a multi-agent healthcare assistant that orchestrates a distributed, sequential clinical reasoning pipeline. By passing a patient's symptoms and context through specialized agents (Triage, Research, Advice, Referral, and Response), the system simulates a clinical care team, ensuring safe, evidence-based recommendations and immediate detection of high-risk medical events.

## 5. User flow (step-by-step)
1. User enters symptoms, age range, urgency (1-5), and optional notes into the frontend application.
2. The Orchestrator receives the input and initiates the A2A (Agent-to-Agent) workflow.
3. The Triage agent evaluates the input for critical red flags and determines a clinical severity level.
4. The Research agent extracts the primary symptoms and queries a simulated clinical knowledge base.
5. The Advice agent formulates safe, non-diagnostic next actions based on severity and research.
6. The Referral agent maps the severity to the appropriate facility (ER, Urgent Care, PCP, Home Care).
7. The Response agent compiles all data into a structured format with prominent safety warnings.
8. The UI receives the payload and displays a structured, FHIR-inspired report with visual urgency indicators.

## 6. Agent architecture (diagram in text)
```
[User Input] 
    |
    v
[Orchestrator Layer] ---> [Context Buffer (FHIR-inspired)]
    |
    +--> 1. Triage Agent (Severity & Red Flags)
    |
    +--> 2. Research Agent (Tools: Knowledge Lookup)
    |
    +--> 3. Advice Agent (Tools: Risk Scoring)
    |
    +--> 4. Referral Agent (Tools: Facility Mapping)
    |
    +--> 5. Response Agent (Tools: Formatting)
    |
    v
[Final Report to UI]
```

## 7. Tools / MCP-style layer
The system relies on external functions to process and enrich clinical data:
- `parse_symptoms(text)`: Extracts a list of core symptoms from messy user text.
- `knowledge_lookup(symptom)`: Retrieves known risks and standard protocols from a local clinical JSON database.
- `risk_score(severity, age, urgency)`: Calculates a numerical priority score (1-100) combining multiple risk factors.
- `referral_lookup(severity, location)`: Returns a simulated facility name based on the required level of care.
- `format_response(agent_outputs)`: Structures the final array of outputs into the unified `PatientAssessment` schema.

## 8. A2A communication flow
A2A (Agent-to-Agent) communication is achieved sequentially through the Orchestrator via a shared Context Object:
1. The Orchestrator initializes a Context Object (`{ input, FHIR_Observation, flags, findings, draft_advice }`).
2. The Orchestrator calls Agent 1 (Triage) and passes the Context. Agent 1 mutates the Context (e.g., adds `flags: ['CRITICAL']`).
3. The Orchestrator passes the updated Context to Agent 2 (Research), which uses the `flags` to adjust its lookup strategy.
4. This handoff continues down the line, ensuring downstream agents possess the localized knowledge derived by upstream agents.

## 9. Data model (simplified)
The data model uses FHIR-inspired structures for consistency:
```json
{
  "PatientContext": {
    "ageRange": "50-60",
    "selfReportedUrgency": 5,
    "notes": "History of hypertension"
  },
  "Observation": {
    "symptoms": ["chest pain", "shortness of breath"]
  },
  "Condition": {
    "severityLevel": "CRITICAL",
    "riskScore": 95
  },
  "CarePlan": {
    "advice": "Do not wait. Call emergency services.",
    "referralType": "Emergency Room",
    "location": "General Hospital ER"
  }
}
```

## 10. Backend route structure (REST endpoints)
- `POST /api/v1/analyze`: Primary endpoint to trigger the multi-agent orchestrator pipeline. Accepts `{ symptoms, ageRange, urgency, notes }`. Returns `{ sessionId, report, trace }`.
- `GET /api/v1/session/:id`: (Optional for Future) Retrieve historical assessment data.

## 11. Frontend page structure (components)
- `App.jsx`: Main application container managing layout, state, and API requests.
- `AgentPulse.jsx`: Real-time visual indicator showing which agent in the orchestrator is currently active.
- `ReportCard.jsx`: The standardized rendering of the final response Agent output (handles colors by severity, warnings, actions).
- `AssessmentForm.jsx` (or inline in App): Collects symptoms, age, urgency slider, and notes.

## 12. API contract for each endpoint
**Request (`POST /api/v1/analyze`)**
```json
{
  "symptoms": "chest pain and sweating",
  "ageRange": "45-55",
  "urgency": 4,
  "notes": ""
}
```
**Response**
```json
{
  "sessionId": "uuid-1234",
  "data": {
    "urgency": "CRITICAL",
    "findings": [{"topic": "Triage", "summary": "Red flag detected"}],
    "recommendations": [{"title": "Action", "action": "Seek immediate care", "urgency": "HIGH"}],
    "referral": {"type": "Emergency Room", "suggestedFacility": "Nearest ER", "action": "Go now."}
  },
  "trace": ["Triage", "Research", "Advice", "Referral", "Response"]
}
```

## 13. Safety and privacy considerations
- **Disclaimers**: Every response includes a prominent, un-dismissible warning: "AetherMed is a simulated system for demonstration purposes only. It is NOT a medical device and does not provide actual medical diagnosis."
- **Privacy**: The hackathon MVP does not persist user data to an external database. All state is in-memory for the duration of the request.
- **Fail-Safe**: If the orchestrator fails or times out, the system defaults to recommending a physical doctor's visit.

## 14. Demo plan for judges
1. **The Hook (0:00-0:30)**: Explain the problem of inaccurate self-triage.
2. **The Execution (0:30-1:30)**: Live demo. Type "chest pain + difficulty breathing, age 58, urgency 4".
3. **The Reveal (1:30-2:30)**: Show the UI Agent Spinner ("Triage Agent analyzing..."). Watch it highlight CRITICAL. Show the final report returning a strict ER referral. Open the collapsed "Agent Trace" to prove it's not a single prompt, but 5 sequential agents coordinating.
4. **The Close (2:30-3:00)**: Highlight the technical sophistication (MCP tools, A2A handoffs) built in 24 hours.

## 15. MVP scope for hackathon (what to build first)
1. Simple UI form (symptoms, age, urgency, notes).
2. Backend orchestrator that calls 3 core agents (Triage → Advice → Referral).
3. Mock knowledge lookup (JSON file tool).
4. Hardcoded referral logic (if critical → ER).
5. Safety disclaimer on every response.
6. Clean, formatted output card in the UI.

## 16. Nice-to-have features (if time remains)
- Full LLM integration for the Research Agent (replacing the hardcoded JSON lookup).
- Advanced "Agent Trace" modal in the UI showing the raw JSON handoffs between agents.
- PDF Export of the final `ReportCard`.

## 17. Folder structure
```
/frontend
  /src
    /components
      AgentPulse.jsx
      ReportCard.jsx
    App.jsx
    index.css
/backend
  /agents
    triageAgent.js
    researchAgent.js
    adviceAgent.js
    referralAgent.js
    responseAgent.js
  /tools
    tools.js  (MCP layer functions)
  orchestrator.js
  server.js
project_manifest.md
README.md
```

## 18. Suggested database schema (if needed)
*Note: In-memory state is used for the MVP. If a DB is added:*
**Collection: Sessions**
- `_id`: String (UUID)
- `timestamp`: Date
- `patientContext`: Object (Age, Urgency, Notes)
- `symptomsRaw`: String
- `orchestratorTrace`: Array (Logs of agent actions)
- `finalReport`: Object (Urgency, Findings, Referral)

## 19. Suggested prompts for each agent
*For Hackathon MVP, we use simulated logic functions to guarantee demo stability, but if integrating an LLM, use these:*

**Triage Agent**: "You are a clinical triage evaluator. Analyze these symptoms: {symptoms}. Determine if there are 'Red Flags' (e.g. chest pain, stroke signs). Output severity as Low, Medium, High, or Critical. Output ONLY JSON."
**Research Agent**: "You are a medical researcher. Based on the triage report: {triage_data}, extract the primary conditions associated with these symptoms. Keep findings broad and non-diagnostic. Output ONLY JSON."
**Advice Agent**: "You are a patient safety advisor. Based on {research_data} and severity {severity}, generate 3 safe, non-diagnostic next actions (e.g. rest, hydrate, call 911). Output ONLY JSON."
**Referral Agent**: "You are a care coordinator. Based on {severity}, map the patient to the required facility (Emergency Room, Urgent Care, Primary Care, Home Care). Output ONLY JSON."
**Response Agent**: "You are the final formatter. Take the inputs from {all_agents} and format them into the finalized `PatientAssessment` JSON schema. Ensure disclaimers are present."

## 20. Final pitch script (30 seconds, for judging)
"Hi, we're the AetherMed team. We noticed that self-diagnosis often leads to emergency room crowding or dangerous delays in care. Chatbots aren't safe enough. So, we built AetherMed: a multi-agent orchestrator. Under the hood, it’s not one prompt, it’s a clinical team. A Triage agent screens for red flags, a Research agent checks our knowledge base, and an Advice agent determines the care path—all communicating sequentially. It's safe, structured, and brings clinical-grade reasoning to the patient's pocket."
