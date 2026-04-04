---

# 🧠 AetherMed Agentic

**A Multilingual Multi-Agent AI Healthcare Assistant**

---

## 🚀 Overview

**AetherMed Agentic** is a next-generation healthcare AI system designed to provide **intelligent, safe, and real-time health guidance** using a **multi-agent architecture**.

Unlike traditional chatbots, AetherMed Agentic operates as a **coordinated system of AI agents** that analyze symptoms, assess risk, and recommend appropriate next steps.

It is built to be **globally accessible**, leveraging multilingual AI to support users in their native languages.

---

## 🎯 Problem

Millions of people struggle to:

* Understand their symptoms
* Decide when to seek medical care
* Access reliable preliminary health guidance

This often leads to:

* Delayed treatment
* Unsafe self-medication
* Poor health decisions

---

## 💡 Solution

AetherMed Agentic solves this by providing:

* 🧠 Intelligent symptom analysis
* ⚠️ Risk-level classification (low, moderate, emergency)
* 📚 Medical insight generation
* 💊 Safe, non-diagnostic recommendations
* 🚑 Guided next steps (home care, clinic, emergency)
* 🌍 Multilingual support (global usability)

---

## 🏗️ Architecture

### 🔗 Multi-Agent System (A2A)

The system uses **Agent-to-Agent communication**:

```text
User Input
   ↓
Orchestrator
   ↓
Triage Agent
   ↓
Medical Insight Agent
   ↓
Recommendation Agent
   ↓
Referral Agent
   ↓
Final Response
```

---

### 🧠 Agents

* **Orchestrator Agent**
  Coordinates workflow and manages agent communication

* **Triage Agent**
  Assesses urgency and detects red flags

* **Medical Insight Agent**
  Provides possible explanations using medical knowledge

* **Recommendation Agent**
  Generates safe, non-diagnostic advice

* **Referral Agent**
  Suggests next steps (self-care, clinic, emergency care)

---

### 🔧 Tools Layer (MCP-style)

* Symptom parsing
* Risk scoring
* Medical knowledge lookup
* Response formatting (Strict FHIR R4 standard)

---

## 🌍 Multilingual Support

AetherMed Agentic uses native multilingual capabilities of modern AI models to:

* Automatically detect user language
* Understand global inputs
* Respond in the user’s native language

👉 No external translation APIs required

---

## 🛠️ Tech Stack

* **Frontend:** React / Vite
* **Backend:** Node.js (Express)
* **AI Engine:** Google Gemini API (gemini-1.5-flash)
* **Data Protocol:** FHIR R4 Interoperability 

---

## ⚙️ How It Works

1. User submits symptoms
2. System analyzes input
3. Agents collaborate to:
   * assess risk
   * interpret symptoms
   * generate safe advice
4. Final response is returned in user’s language via a strict FHIR data payload

---

## ⚠️ Safety & Disclaimer

* This system **does NOT provide medical diagnosis**
* All recommendations are **informational only**
* Users are advised to consult qualified healthcare professionals
* Emergency symptoms trigger **immediate escalation advice**

---

## 🎥 Demo Flow

1. User inputs:
   > “Chest pain and sweating”
2. System:
   * Detects high risk
   * Flags emergency
3. Output:
   * Risk Level: CRITICAL
   * Recommendation: Seek urgent medical attention at the nearest Emergency Room

---

## 🏆 Key Features

* Multi-agent AI system (not a chatbot)
* Real-time decision support
* Safety-first design
* Global multilingual accessibility
* Scalable architecture

---

## 📦 Installation 

```bash
git clone https://github.com/Linkxee-Tech/AetherMed-Agentic.git
cd AetherMed-Agentic

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the **backend** folder (`backend/.env`):

```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## ▶️ Run the Project

From the root `AetherMed-Agentic` folder, you can use our proxy scripts to start the environments:

**Terminal 1 (Backend):**
```bash
npm run backend
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

The frontend UI will launch on `http://localhost:5173`.

---

## 🧪 Example API Request

```json
POST /api/v1/analyze

{
  "symptoms": "I have headache and a heavy fever.",
  "ageRange": "18-35",
  "urgency": 3,
  "notes": "History of migraines"
}
```

---

## 🚀 Future Improvements

* Real hospital/location integration via MCP Superpowers
* Expanded medical dataset knowledge base
* Real-time external Database connection
* Mobile app version

---

## 📚 What We Learned

* Power of multi-agent AI systems
* Ensuring LLM reliability and data-structure safety in healthcare
* Designing scalable and modular architectures
* Enforcing strict Open Standard formats (FHIR)

---

## 🤝 Contributing

Contributions are welcome. Feel free to fork and improve.

---

## 📜 License

MIT License

---

## 🏁 Final Note

**AetherMed Agentic** represents a step toward intelligent, accessible, and responsible AI-powered healthcare guidance.
