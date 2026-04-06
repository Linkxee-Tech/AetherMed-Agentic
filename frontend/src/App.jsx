import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion as motionLib, AnimatePresence } from 'framer-motion';
import { Send, Plus, History, Settings, User, Clock, AlertCircle, Menu, X, Mic, MicOff, HeartPulse, Shield, Languages, Camera, Activity, Search, FileText, Eye, CheckCircle, ArrowRightCircle } from 'lucide-react';
import ReportCard from './components/ReportCard';
import VisualReportCard from './components/VisualReportCard';
import DocumentReportCard from './components/DocumentReportCard';
import SafetyBanner from './components/SafetyBanner';
import WorkflowTimeline from './components/WorkflowTimeline';
import UploadDropzone from './components/UploadDropzone';
import { formatDetectedLanguage } from './lib/clinicalPresentation';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1').replace(/\/$/, '');
// Ensure /api/v1 is present if not already included in the env variable
const API_BASE = RAW_API_BASE.includes('/api/v1') ? RAW_API_BASE : `${RAW_API_BASE}/api/v1`;
const CLIENT_ID_STORAGE_KEY = 'aethermed_client_id';
const HISTORY_STORAGE_NAMESPACE = 'aethermed_history';
const SETTINGS_STORAGE_NAMESPACE = 'aethermed_settings';
const LEGACY_HISTORY_STORAGE_KEY = 'aethermed_history';
const LEGACY_SETTINGS_STORAGE_KEY = 'aethermed_settings';
const MotionDiv = motionLib.div;
const APP_NAME = 'AetherMed Agentic';
const MAX_VISUAL_IMAGE_SIZE_MB = 6;
const MAX_DOCUMENT_IMAGE_SIZE_MB = 6;
const MAX_UPLOAD_ASSISTANT_IMAGE_SIZE_MB = 6;
const MAX_DOCUMENT_TEXT_FILE_SIZE_MB = 3;
const MAX_CAMERA_CAPTURE_EDGE = 1600;
const CAMERA_CAPTURE_QUALITY = 0.84;
const DEFAULT_USER_SETTINGS = {
  defaultAgeRange: '18-35',
  theme: 'dark'
};
const URGENCY_MARKS = [
  { value: 1, label: '1', hint: 'Low' },
  { value: 2, label: '2', hint: 'Mild' },
  { value: 3, label: '3', hint: 'Moderate' },
  { value: 4, label: '4', hint: 'High' },
  { value: 5, label: '5', hint: 'Severe' },
];
const DEMO_CASES = [
  {
    label: 'Chest pain',
    symptoms: 'Tight chest pain with sweating and trouble breathing for the last 20 minutes.',
    notes: 'Symptoms started suddenly. Adult patient.',
    urgency: 5
  },
  {
    label: 'Fever and headache',
    symptoms: 'Fever, headache, body aches, and reduced appetite since yesterday evening.',
    notes: 'No severe breathing difficulty reported.',
    urgency: 3
  },
  {
    label: 'Skin rash',
    symptoms: 'Itchy red skin rash on the forearm spreading over the last 2 days.',
    notes: 'No facial swelling or breathing symptoms reported.',
    urgency: 2
  }
];
const ASSESSMENT_MODE_CONFIG = {
  text: {
    heroTitle: 'Multi-agent symptom intake built for safe, structured clinical guidance',
    heroDescription: 'AetherMed translates free-text symptoms into a staged healthcare workflow with visible risk review, research-backed synthesis, and clear next steps.',
    helperTitle: 'Symptom intake',
    helperText: 'Best for direct symptom descriptions when you want a judge to see risk review, agent orchestration, and structured recommendations in one flow.',
    features: [
      { label: 'Workflow visibility', text: 'Shows how symptoms are analyzed, risk-scored, and converted into safe guidance.' },
      { label: 'Multilingual context', text: 'Language handling is surfaced throughout the intake and final response.' },
      { label: 'Clinical framing', text: 'Results are packaged into cards, not one long chatbot paragraph.' }
    ],
    loadingTitle: 'AetherMed is reviewing the symptom intake',
    loadingDescription: 'The system is normalizing the report, assessing urgency, gathering supporting insights, and packaging safe next steps.',
    submitLabel: 'Generate clinical guidance',
    disabledMessage: 'Describe symptoms to start the decision-support workflow.'
  },
  upload: {
    heroTitle: 'A single upload path that routes images and documents safely',
    heroDescription: 'Upload once and let AetherMed determine whether the file looks like a visible symptom, a medical document, or a scan before continuing the safest workflow.',
    helperTitle: 'Upload assistant',
    helperText: 'Best for demos where the user is unsure what they captured. The UI shows routing intelligence before the main analysis begins.',
    features: [
      { label: 'Auto-routing', text: 'The system identifies the input class before asking for minimal follow-up context.' },
      { label: 'Safety boundary', text: 'Uploads are guided into the right lane without pretending every image can be diagnosed.' },
      { label: 'Demo clarity', text: 'Judges can see multimodal capability immediately from the intake screen.' }
    ],
    loadingTitle: 'AetherMed is routing the upload safely',
    loadingDescription: 'The system is identifying the upload, checking risk cues, and packaging the right review path.',
    submitLabel: 'Continue with routed review',
    disabledMessage: 'Add an upload to begin the routing workflow.'
  },
  visual: {
    heroTitle: 'Visible symptom review with careful limitations and escalation guidance',
    heroDescription: 'AetherMed reviews photos of external symptoms, highlights visible findings cautiously, and turns them into safe next actions without claiming a diagnosis.',
    helperTitle: 'Image review',
    helperText: 'Best for rashes, swelling, wounds, skin changes, and other visible external findings. Internal imaging stays safety-limited.',
    features: [
      { label: 'Visible-only review', text: 'The system clearly separates what is visible from what cannot be confirmed.' },
      { label: 'Risk-aware output', text: 'Urgency and escalation signs are surfaced as structured sections.' },
      { label: 'Better uploads', text: 'The intake screen explains exactly what type of image works best.' }
    ],
    loadingTitle: 'AetherMed is reviewing the uploaded image',
    loadingDescription: 'The system is checking image clarity, visible findings, risk cues, and safe next-step language.',
    submitLabel: 'Analyze image safely',
    disabledMessage: 'Upload a clear image to enable visual review.'
  },
  document: {
    heroTitle: 'Medical document explanation that preserves the original source of truth',
    heroDescription: 'AetherMed explains reports in plain language, highlights important warnings, and keeps the original clinic document central to the experience.',
    helperTitle: 'Document explainer',
    helperText: 'Best for lab screenshots, discharge notes, prescriptions, and clinic summaries that need a plain-language explanation.',
    features: [
      { label: 'Readable summaries', text: 'Dense medical language is translated into clearly separated sections.' },
      { label: 'Warning surfacing', text: 'Urgent items and follow-up instructions are elevated visually.' },
      { label: 'Trustworthy framing', text: 'The UI reinforces that the document remains the authoritative source.' }
    ],
    loadingTitle: 'AetherMed is interpreting the medical document',
    loadingDescription: 'The system is reading the source material, extracting important findings, and drafting a safer plain-language explanation.',
    submitLabel: 'Explain document clearly',
    disabledMessage: 'Upload a document or paste text to continue.'
  }
};
const WORKFLOW_STEPS = {
  text: [
    { id: 'analyze', title: 'Analyzing symptoms', description: 'Normalizing the intake into clinically relevant symptom signals.' },
    { id: 'risk', title: 'Assessing risk', description: 'Checking severity, urgency, and immediate escalation markers.' },
    { id: 'insights', title: 'Gathering insights', description: 'Combining structured triage logic with supporting clinical context.' },
    { id: 'recommendations', title: 'Generating recommendations', description: 'Preparing safe guidance, monitoring advice, and care pathways.' },
    { id: 'next', title: 'Suggesting next steps', description: 'Packaging the response into structured cards for action.' }
  ],
  upload: [
    { id: 'analyze', title: 'Inspecting upload', description: 'Identifying whether the input is a symptom image, document, or scan.' },
    { id: 'risk', title: 'Assessing risk', description: 'Looking for urgent cues that should shape the safest route.' },
    { id: 'insights', title: 'Gathering insights', description: 'Aligning the upload with the right internal review workflow.' },
    { id: 'recommendations', title: 'Generating recommendations', description: 'Preparing the safest explanation and escalation language.' },
    { id: 'next', title: 'Suggesting next steps', description: 'Delivering the routed response in a structured format.' }
  ],
  visual: [
    { id: 'analyze', title: 'Analyzing image', description: 'Reviewing visible features and checking whether the image is usable.' },
    { id: 'risk', title: 'Assessing risk', description: 'Looking for patterns that may need prompt care or urgent escalation.' },
    { id: 'insights', title: 'Gathering insights', description: 'Separating visible observations from unsafe diagnostic assumptions.' },
    { id: 'recommendations', title: 'Generating recommendations', description: 'Drafting safe next steps and warning signs to watch for.' },
    { id: 'next', title: 'Suggesting next steps', description: 'Presenting the visual review as a decision-support summary.' }
  ],
  document: [
    { id: 'analyze', title: 'Reading document', description: 'Extracting readable text and key medical concepts from the source.' },
    { id: 'risk', title: 'Assessing risk', description: 'Elevating urgent findings, warnings, and time-sensitive instructions.' },
    { id: 'insights', title: 'Gathering insights', description: 'Turning complex terminology into clear plain-language meaning.' },
    { id: 'recommendations', title: 'Generating recommendations', description: 'Highlighting follow-up actions and safer explanation framing.' },
    { id: 'next', title: 'Suggesting next steps', description: 'Packaging the explanation into structured document cards.' }
  ]
};
let cachedHealthRequest = null;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected document.'));
    reader.readAsText(file);
  });
}

async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist');
  const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text) {
      pages.push(text);
    }
  }

  return pages.join('\n\n').trim();
}

function getScopedStorageKey(namespace, clientId) {
  return `${namespace}_${clientId}`;
}

function generateClientId() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureClientId() {
  if (typeof window === 'undefined') {
    return 'server-render';
  }

  try {
    const existingId = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existingId) {
      return existingId;
    }

    const createdId = generateClientId();
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, createdId);
    return createdId;
  } catch {
    return 'local-session';
  }
}

function readScopedJson(namespace, clientId, legacyKey, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  try {
    const scopedValue = window.localStorage.getItem(getScopedStorageKey(namespace, clientId));
    if (scopedValue) {
      return JSON.parse(scopedValue);
    }

    const legacyValue = window.localStorage.getItem(legacyKey);
    return legacyValue ? JSON.parse(legacyValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function getDefaultTheme() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

function buildDefaultUserSettings() {
  return {
    ...DEFAULT_USER_SETTINGS,
    theme: getDefaultTheme()
  };
}

function buildFallbackUploadAssistantProfile(sourceLabel = 'Uploaded image') {
  return {
    classification: {
      kind: 'visual',
      code: 'visible_body_image',
      label: 'Uploaded image',
      reason: 'Immediate inspection was unavailable, so the upload will be routed during the main analysis step.'
    },
    guidance: {
      detectedInputType: 'Uploaded image',
      routeCode: 'uploaded_image',
      disclaimer: 'AetherMed provides guidance and explanation, not a medical diagnosis.',
      supportiveIntro: 'I kept the capture. If instant inspection is unavailable, you can still continue and AetherMed will route the upload during analysis.',
      minimumContextLabel: 'What did you capture?',
      minimumContextPlaceholder: 'For example: rash on arm, clinic report screenshot, or ankle X-ray after injury.',
      supportNote: 'A short note is enough. The final analysis step will still route the upload to the safest workflow.'
    },
    autoContext: {
      summary: 'This looks like an uploaded image that still needs safe routing.',
      suggestedContext: 'This appears to be an uploaded image that I want AetherMed to review and route safely.',
      source: 'fallback'
    },
    sourceLabel
  };
}

function getScaledCaptureDimensions(width, height, maxEdge = MAX_CAMERA_CAPTURE_EDGE) {
  const safeWidth = Math.max(1, Math.round(Number(width) || 0));
  const safeHeight = Math.max(1, Math.round(Number(height) || 0));
  const largestEdge = Math.max(safeWidth, safeHeight);

  if (largestEdge <= maxEdge) {
    return { width: safeWidth, height: safeHeight };
  }

  const scale = maxEdge / largestEdge;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale))
  };
}

function getHealthStatus() {
  if (!cachedHealthRequest) {
    cachedHealthRequest = axios.get(`${API_BASE}/health`)
      .then((response) => response.data)
      .catch((error) => {
        cachedHealthRequest = null;
        throw error;
      });
  }

  return cachedHealthRequest;
}

function App() {
  const [clientId, setClientId] = useState(() => ensureClientId());
  const [userSettings, setUserSettings] = useState(() => {
    return readScopedJson(SETTINGS_STORAGE_NAMESPACE, clientId, LEGACY_SETTINGS_STORAGE_KEY, buildDefaultUserSettings());
  });
  const [assessmentMode, setAssessmentMode] = useState('text');
  const [symptoms, setSymptoms] = useState('');
  const [ageRange, setAgeRange] = useState(userSettings.defaultAgeRange || '18-35');
  const [urgency, setUrgency] = useState(3);
  const [notes, setNotes] = useState('');
  const [visualNotes, setVisualNotes] = useState('');
  const [visualImageDataUrl, setVisualImageDataUrl] = useState('');
  const [visualImageName, setVisualImageName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');
  const [documentImageDataUrl, setDocumentImageDataUrl] = useState('');
  const [documentImageName, setDocumentImageName] = useState('');
  const [uploadAssistantImageDataUrl, setUploadAssistantImageDataUrl] = useState('');
  const [uploadAssistantImageName, setUploadAssistantImageName] = useState('');
  const [uploadAssistantContext, setUploadAssistantContext] = useState('');
  const [uploadAssistantProfile, setUploadAssistantProfile] = useState(null);
  const [uploadAssistantDetecting, setUploadAssistantDetecting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [completedAgents, setCompletedAgents] = useState([]);
  const [report, setReport] = useState(null);
  const [visualResult, setVisualResult] = useState(null);
  const [documentResult, setDocumentResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [currentInsights, setCurrentInsights] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ state: 'checking', mode: 'checking' });

  const [view, setView] = useState('assessment');
  const [sessionHistory, setSessionHistory] = useState(() => {
    return readScopedJson(HISTORY_STORAGE_NAMESPACE, clientId, LEGACY_HISTORY_STORAGE_KEY, []);
  });
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Voice Interaction State
  const [listeningField, setListeningField] = useState(null); // 'symptoms' | 'notes' | null

  const agents = ['Translation', 'Triage', 'Research', 'Advice', 'Referral', 'Response'];
  const pageTitles = {
    assessment: {
      eyebrow: 'Multi-agent medical decision support',
      title: 'Structured triage, multimodal intake, and safer next-step guidance',
      description: 'Choose symptom intake, upload routing, image review, or document explanation and present the workflow as a credible clinical support system.'
    },
    history: {
      eyebrow: 'Past sessions',
      title: 'Review earlier assessments',
      description: 'Reload a previous report to compare what changed or continue from an earlier session.'
    },
    settings: {
      eyebrow: 'Local preferences',
      title: 'Tune the experience to your style',
      description: 'Each browser or device gets its own local client profile automatically, with shared-device controls available only when needed.'
    }
  };
  const currentPage = pageTitles[view];
  const engineLabel = systemStatus.state === 'ready'
    ? `AMA: ${systemStatus.mode === 'offline' ? 'Clinical Engine' : 'Agentic'}`
    : systemStatus.state === 'offline'
      ? 'Backend unavailable'
      : 'Checking backend';
  const urgencyPercent = ((Number(urgency) - 1) / 4) * 100;
  const currentModeConfig = ASSESSMENT_MODE_CONFIG[assessmentMode];
  const workflowSteps = WORKFLOW_STEPS[assessmentMode] || WORKFLOW_STEPS.text;
  const workflowCompletedCount = Math.min(completedAgents.length, workflowSteps.length);
  const workflowActiveIndex = loading ? Math.min(workflowCompletedCount, workflowSteps.length - 1) : -1;
  const activeWorkflowInsight = currentInsights[currentInsights.length - 1] || currentModeConfig.loadingDescription;
  const detectedInterfaceLanguage = typeof navigator !== 'undefined'
    ? formatDetectedLanguage(navigator.language)
    : 'English';
  const hasAssessmentResult = Boolean(report || visualResult || documentResult);
  const submitDisabledReason = assessmentMode === 'text'
    ? (!symptoms.trim() ? currentModeConfig.disabledMessage : '')
    : assessmentMode === 'upload'
      ? (!uploadAssistantImageDataUrl ? currentModeConfig.disabledMessage : uploadAssistantDetecting ? 'AetherMed is still classifying the upload before you continue.' : '')
      : assessmentMode === 'visual'
        ? (!visualImageDataUrl ? currentModeConfig.disabledMessage : '')
        : ((!documentImageDataUrl && !documentText.trim()) ? currentModeConfig.disabledMessage : '');

  useEffect(() => {
    try {
      const scopedSettingsKey = getScopedStorageKey(SETTINGS_STORAGE_NAMESPACE, clientId);
      const scopedHistoryKey = getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId);
      const legacySettings = window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
      const legacyHistory = window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);

      if (legacySettings && !window.localStorage.getItem(scopedSettingsKey)) {
        window.localStorage.setItem(scopedSettingsKey, legacySettings);
      }

      if (legacyHistory && !window.localStorage.getItem(scopedHistoryKey)) {
        window.localStorage.setItem(scopedHistoryKey, legacyHistory);
      }
    } catch {
      // Ignore storage migration issues and continue with current session state.
    }
  }, [clientId]);

  useEffect(() => {
    const nextSettings = readScopedJson(
      SETTINGS_STORAGE_NAMESPACE,
      clientId,
      LEGACY_SETTINGS_STORAGE_KEY,
      buildDefaultUserSettings()
    );
    const nextHistory = readScopedJson(HISTORY_STORAGE_NAMESPACE, clientId, LEGACY_HISTORY_STORAGE_KEY, []);

    setUserSettings(nextSettings);
    setAssessmentMode('text');
    setAgeRange(nextSettings.defaultAgeRange || '18-35');
    setSessionHistory(nextHistory);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setSymptoms('');
    setNotes('');
    setVisualNotes('');
    setVisualImageDataUrl('');
    setVisualImageName('');
    setDocumentText('');
    setDocumentNotes('');
    setDocumentImageDataUrl('');
    setDocumentImageName('');
    setUploadAssistantImageDataUrl('');
    setUploadAssistantImageName('');
    setUploadAssistantContext('');
    setUploadAssistantProfile(null);
    setUploadAssistantDetecting(false);
    setCameraOpen(false);
    setCameraError(null);
    setCameraReady(false);
    setCameraTarget('upload');
    setUrgency(3);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setActiveAgent(null);
    setLoading(false);
    setShowLogs(false);
  }, [clientId]);

  useEffect(() => {
    window.localStorage.setItem(
      getScopedStorageKey(SETTINGS_STORAGE_NAMESPACE, clientId),
      JSON.stringify(userSettings)
    );
  }, [clientId, userSettings]);

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = userSettings.theme;
  }, [userSettings.theme]);

  useEffect(() => {
    let ignore = false;

    async function fetchHealth() {
      try {
        const data = await getHealthStatus();
        if (!ignore) {
          setSystemStatus({
            state: 'ready',
            mode: data.agentMode,
            database: data.database,
          });
        }
      } catch {
        if (!ignore) {
          setSystemStatus({ state: 'offline', mode: 'unavailable', database: 'unavailable' });
        }
      }
    }

    fetchHealth();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen) {
      setCameraReady(false);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }

      return undefined;
    }

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser does not support direct camera capture. Please use the regular upload option instead.');
        setCameraReady(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }
          },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        setCameraError(null);
        setCameraReady(false);

        const videoElement = cameraVideoRef.current;
        if (videoElement) {
          const markReady = () => {
            if (!cancelled) {
              setCameraReady(true);
              setCameraError(null);
            }
          };

          videoElement.srcObject = stream;
          videoElement.addEventListener('loadeddata', markReady, { once: true });
          videoElement.addEventListener('canplay', markReady, { once: true });

          try {
            await videoElement.play();
          } catch {
            // Some browsers auto-play once enough media metadata is loaded.
          }

          if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            markReady();
          }
        }
      } catch {
        setCameraError('Camera access was unavailable. Please allow camera permission or use file upload instead.');
        setCameraReady(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [cameraOpen]);

  // Web Speech API Logic
  const startListening = (field, setter, currentText) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please try Chrome or Edge.");
      return;
    }

    // Stop currently listening process if requested again
    if (listeningField === field) {
        setListeningField(null);
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListeningField(field);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Append logic: add a space if there's already text
      const newText = currentText.trim() ? `${currentText} ${transcript}` : transcript;
      setter(newText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setListeningField(null);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.start();
  };

  const handleSwitchLocalProfile = () => {
    const nextClientId = generateClientId();

    try {
      window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, nextClientId);
    } catch {
      // Ignore storage write errors and continue with in-memory profile rotation.
    }

    setClientId(nextClientId);
  };

  const handleResetLocalProfile = () => {
    try {
      window.localStorage.removeItem(getScopedStorageKey(SETTINGS_STORAGE_NAMESPACE, clientId));
      window.localStorage.removeItem(getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId));
    } catch {
      // Ignore storage removal errors and still reset the visible session state.
    }

    const nextSettings = buildDefaultUserSettings();
    setUserSettings(nextSettings);
    setAssessmentMode('text');
    setAgeRange(nextSettings.defaultAgeRange);
    setSessionHistory([]);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setSymptoms('');
    setNotes('');
    setVisualNotes('');
    setVisualImageDataUrl('');
    setVisualImageName('');
    setDocumentText('');
    setDocumentNotes('');
    setDocumentImageDataUrl('');
    setDocumentImageName('');
    setUploadAssistantImageDataUrl('');
    setUploadAssistantImageName('');
    setUploadAssistantContext('');
    setUploadAssistantProfile(null);
    setUploadAssistantDetecting(false);
    setCameraOpen(false);
    setCameraError(null);
    setCameraReady(false);
    setCameraTarget('upload');
    setUrgency(3);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setActiveAgent(null);
    setLoading(false);
    setShowLogs(false);
    setView('assessment');
  };

  const handleDemoCaseSelect = (demoCase) => {
    setAssessmentMode('text');
    setSymptoms(demoCase.symptoms);
    setNotes(demoCase.notes);
    setUrgency(demoCase.urgency);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setView('assessment');
    setIsSidebarOpen(false);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setShowLogs(false);
    setIsSidebarOpen(false); // Close sidebar on mobile when starting analysis
    
    try {
      const response = await axios.post(`${API_BASE}/analyze`, { 
        symptoms, 
        ageRange, 
        urgency, 
        notes,
        clientId
      });
      
      const serverTrace = response.data.trace || [];
      
      for (const step of serverTrace) {
        setActiveAgent(step.agent);
        setCurrentInsights(prev => [...prev, step.insight]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCompletedAgents(prev => [...prev, step.agent]);
      }

      setActiveAgent(null);
      const reportData = response.data.data;
      setReport(reportData);

      const newHistoryItem = {
          id: response.data.sessionId,
          date: new Date().toLocaleString(),
          kind: 'text',
          summary: symptoms.substring(0, 100) + '...',
          symptoms: symptoms.substring(0, 100) + '...',
          clientId,
          report: reportData
      };
      setSessionHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          window.localStorage.setItem(
            getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId),
            JSON.stringify(updated)
          );
          return updated;
      });
    } catch (err) {
      setError(err.response?.data?.error || `Cannot reach the AetherMed backend at ${API_BASE}. Start it with "npm run backend" or run the full app from the project root with "npm run dev".`);
      console.error(err);
    } finally {
      setActiveAgent(null);
      setLoading(false);
    }
  };

  const handleVisualImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file for the visual symptom review.');
      return;
    }

    if (file.size > MAX_VISUAL_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Please choose an image smaller than ${MAX_VISUAL_IMAGE_SIZE_MB} MB.`);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const imageUnderstanding = await requestImageUnderstanding(dataUrl, file.name || 'Uploaded image');
      setVisualImageDataUrl(dataUrl);
      setVisualImageName(file.name || 'Captured image');
      setVisualNotes(imageUnderstanding?.autoContext?.suggestedContext || '');
      setVisualResult(null);
      setError(null);
    } catch (readError) {
      setError(readError.message || 'We could not read that image. Please try another photo.');
    } finally {
      event.target.value = '';
    }
  };

  const clearVisualImage = () => {
    setVisualImageDataUrl('');
    setVisualImageName('');
  };

  const handleVisualAnalyze = async (e) => {
    e.preventDefault();
    if (!visualImageDataUrl) return;

    setLoading(true);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setShowLogs(false);
    setIsSidebarOpen(false);

    try {
      const response = await axios.post(`${API_BASE}/analyze-visual`, {
        imageDataUrl: visualImageDataUrl,
        notes: visualNotes,
        languageHint: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
        clientId
      });

      const serverTrace = response.data.trace || [];

      for (const step of serverTrace) {
        setActiveAgent(step.agent);
        setCurrentInsights((prev) => [...prev, step.insight]);
        await new Promise((resolve) => setTimeout(resolve, 700));
        setCompletedAgents((prev) => [...prev, step.agent]);
      }

      setActiveAgent(null);
      const resultData = response.data.data;
      setVisualResult(resultData);

      const summaryText = visualNotes.trim()
        ? `${visualNotes.trim().substring(0, 100)}...`
        : (visualImageName || 'Visual symptom image');
      const newHistoryItem = {
        id: response.data.sessionId,
        date: new Date().toLocaleString(),
        kind: 'visual',
        summary: summaryText,
        clientId,
        result: resultData
      };

      setSessionHistory((prev) => {
        const updated = [newHistoryItem, ...prev];
        window.localStorage.setItem(
          getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId),
          JSON.stringify(updated)
        );
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.error || `Cannot reach the AetherMed backend at ${API_BASE}. Start it with "npm run backend" or run the full app from the project root with "npm run dev".`);
      console.error(err);
    } finally {
      setActiveAgent(null);
      setLoading(false);
    }
  };

  const requestImageUnderstanding = async (dataUrl, sourceLabel = '') => {
    try {
      const response = await axios.post(`${API_BASE}/upload-assistant`, {
        imageDataUrl: dataUrl,
        notes: sourceLabel || '',
        languageHint: typeof navigator !== 'undefined' ? navigator.language : 'en-US'
      });

      return response.data.data || buildFallbackUploadAssistantProfile(sourceLabel || 'Uploaded file');
    } catch (assistantError) {
      console.warn('Upload assistant preview fell back to local guidance.', assistantError.message);
      return buildFallbackUploadAssistantProfile(sourceLabel || 'Uploaded file');
    }
  };

  const inspectUploadAssistantImage = async (dataUrl, sourceLabel = '') => {
    setUploadAssistantImageDataUrl(dataUrl);
    setUploadAssistantImageName(sourceLabel || 'Uploaded file');
    setError(null);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);

    const understanding = await requestImageUnderstanding(dataUrl, sourceLabel);
    setUploadAssistantProfile(understanding);
    setUploadAssistantContext(understanding?.autoContext?.suggestedContext || '');

    return understanding;
  };

  const handleDocumentImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        if (file.size > MAX_DOCUMENT_IMAGE_SIZE_MB * 1024 * 1024) {
          setError(`Please choose a document image smaller than ${MAX_DOCUMENT_IMAGE_SIZE_MB} MB.`);
          return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        const imageUnderstanding = await requestImageUnderstanding(dataUrl, file.name || 'Medical document image');
        setDocumentImageDataUrl(dataUrl);
        setDocumentImageName(file.name || 'Medical document image');
        setDocumentNotes(imageUnderstanding?.autoContext?.suggestedContext || '');
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const extractedText = await extractPdfText(file);

        if (!extractedText) {
          setError('We could not extract readable text from that PDF. Try a clearer PDF or upload a screenshot instead.');
          return;
        }

        setDocumentText(extractedText);
        setDocumentImageDataUrl('');
        setDocumentImageName(file.name || 'Medical document PDF');
      } else if (
        file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        /\.(txt|md|json)$/i.test(file.name)
      ) {
        if (file.size > MAX_DOCUMENT_TEXT_FILE_SIZE_MB * 1024 * 1024) {
          setError(`Please choose a text document smaller than ${MAX_DOCUMENT_TEXT_FILE_SIZE_MB} MB.`);
          return;
        }

        const extractedText = await readFileAsText(file);
        setDocumentText(extractedText);
        setDocumentImageDataUrl('');
        setDocumentImageName(file.name || 'Medical document text file');
      } else {
        setError('Please select an image, PDF, or text-based medical document.');
        return;
      }

      setDocumentResult(null);
      setError(null);
    } catch (readError) {
      setError(readError.message || 'We could not read that medical document. Please try another file.');
    } finally {
      event.target.value = '';
    }
  };

  const clearDocumentImage = () => {
    setDocumentImageDataUrl('');
    setDocumentImageName('');
  };

  const handleUploadAssistantImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file so AetherMed can inspect and route it safely.');
      return;
    }

    if (file.size > MAX_UPLOAD_ASSISTANT_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Please choose an upload smaller than ${MAX_UPLOAD_ASSISTANT_IMAGE_SIZE_MB} MB.`);
      return;
    }

    setUploadAssistantDetecting(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      await inspectUploadAssistantImage(dataUrl, file.name || 'Uploaded file');
    } catch (readError) {
      setError(readError.message || 'We could not inspect that upload. Please try a clearer image.');
      setUploadAssistantProfile(null);
    } finally {
      setUploadAssistantDetecting(false);
      event.target.value = '';
    }
  };

  const clearUploadAssistantImage = () => {
    setUploadAssistantImageDataUrl('');
    setUploadAssistantImageName('');
    setUploadAssistantContext('');
    setUploadAssistantProfile(null);
    setUploadAssistantDetecting(false);
  };

  const openDirectCamera = (target = 'upload') => {
    setCameraTarget(target);
    setCameraOpen(true);
    setCameraError(null);
    setCameraReady(false);
    setError(null);
  };

  const closeDirectCamera = () => {
    setCameraOpen(false);
    setCameraReady(false);
    setCameraTarget('upload');
  };

  const captureFromCamera = async () => {
    if (!cameraVideoRef.current || !cameraCanvasRef.current) {
      setCameraError('Camera preview was not ready. Please try again.');
      return;
    }

    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!cameraReady || video.readyState < 2 || !width || !height) {
      setCameraError('The camera preview is still loading. Wait a moment, then capture again.');
      return;
    }

    const captureSize = getScaledCaptureDimensions(width, height);

    canvas.width = captureSize.width;
    canvas.height = captureSize.height;
    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('Camera capture was unavailable. Please use file upload instead.');
      return;
    }

    setUploadAssistantDetecting(true);
    setError(null);
    setCameraError(null);

    try {
      context.drawImage(video, 0, 0, captureSize.width, captureSize.height);
      const dataUrl = canvas.toDataURL('image/jpeg', CAMERA_CAPTURE_QUALITY);

      if (cameraTarget === 'visual') {
        const imageUnderstanding = await requestImageUnderstanding(dataUrl, 'Camera capture');
        setVisualImageDataUrl(dataUrl);
        setVisualImageName('Camera capture');
        setVisualNotes(imageUnderstanding?.autoContext?.suggestedContext || '');
        setVisualResult(null);
        setError(null);
      } else {
        await inspectUploadAssistantImage(dataUrl, 'Camera capture');
      }

      setCameraOpen(false);
    } catch (captureError) {
      const fallbackMessage = captureError.response?.data?.error || (
        cameraTarget === 'visual'
          ? 'We could not capture that image clearly. Try again with steadier framing and good lighting.'
          : 'We could not inspect that camera capture. Try again with steadier framing and good lighting.'
      );
      setError(fallbackMessage);
      setCameraError(fallbackMessage);
      if (cameraTarget === 'upload') {
        setUploadAssistantProfile(null);
      }
    } finally {
      setUploadAssistantDetecting(false);
    }
  };

  const handleUploadAssistantAnalyze = async (e) => {
    e.preventDefault();
    if (!uploadAssistantImageDataUrl) return;

    setLoading(true);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setShowLogs(false);
    setIsSidebarOpen(false);

    try {
      const combinedNotes = [uploadAssistantImageName, uploadAssistantContext]
        .filter((value) => typeof value === 'string' && value.trim())
        .join(' | ');

      const response = await axios.post(`${API_BASE}/analyze-input`, {
        imageDataUrl: uploadAssistantImageDataUrl,
        notes: combinedNotes,
        languageHint: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
        clientId
      });

      const serverTrace = response.data.trace || [];

      for (const step of serverTrace) {
        setActiveAgent(step.agent);
        setCurrentInsights((prev) => [...prev, step.insight]);
        await new Promise((resolve) => setTimeout(resolve, 700));
        setCompletedAgents((prev) => [...prev, step.agent]);
      }

      setActiveAgent(null);

      const resultData = response.data.data;
      const routedCode = response.data.meta?.routedInputCode;
      const historyKind = routedCode === 'medical_document' ? 'document' : routedCode === 'text_symptoms' ? 'text' : 'visual';

      if (historyKind === 'document') {
        setDocumentResult(resultData);
      } else if (historyKind === 'text') {
        setReport(resultData);
      } else {
        setVisualResult(resultData);
      }

      const summaryText = uploadAssistantContext.trim()
        ? `${uploadAssistantContext.trim().substring(0, 100)}...`
        : (uploadAssistantImageName || 'Upload assistant review');
      const newHistoryItem = {
        id: response.data.sessionId,
        date: new Date().toLocaleString(),
        kind: historyKind,
        summary: summaryText,
        clientId,
        result: historyKind === 'visual' || historyKind === 'document' ? resultData : undefined,
        report: historyKind === 'text' ? resultData : undefined
      };

      setSessionHistory((prev) => {
        const updated = [newHistoryItem, ...prev];
        window.localStorage.setItem(
          getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId),
          JSON.stringify(updated)
        );
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.error || `Cannot reach the AetherMed backend at ${API_BASE}. Start it with "npm run backend" or run the full app from the project root with "npm run dev".`);
      console.error(err);
    } finally {
      setActiveAgent(null);
      setLoading(false);
    }
  };

  const handleDocumentAnalyze = async (e) => {
    e.preventDefault();
    if (!documentImageDataUrl && !documentText.trim()) return;

    setLoading(true);
    setReport(null);
    setVisualResult(null);
    setDocumentResult(null);
    setError(null);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setShowLogs(false);
    setIsSidebarOpen(false);

    try {
      const response = await axios.post(`${API_BASE}/analyze-document`, {
        imageDataUrl: documentImageDataUrl,
        documentText,
        notes: documentNotes,
        languageHint: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
        clientId
      });

      const serverTrace = response.data.trace || [];

      for (const step of serverTrace) {
        setActiveAgent(step.agent);
        setCurrentInsights((prev) => [...prev, step.insight]);
        await new Promise((resolve) => setTimeout(resolve, 700));
        setCompletedAgents((prev) => [...prev, step.agent]);
      }

      setActiveAgent(null);
      const resultData = response.data.data;
      setDocumentResult(resultData);

      const summaryText = documentText.trim()
        ? `${documentText.trim().substring(0, 100)}...`
        : documentNotes.trim()
          ? `${documentNotes.trim().substring(0, 100)}...`
          : (documentImageName || 'Medical document review');
      const newHistoryItem = {
        id: response.data.sessionId,
        date: new Date().toLocaleString(),
        kind: 'document',
        summary: summaryText,
        clientId,
        result: resultData
      };

      setSessionHistory((prev) => {
        const updated = [newHistoryItem, ...prev];
        window.localStorage.setItem(
          getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId),
          JSON.stringify(updated)
        );
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.error || `Cannot reach the AetherMed backend at ${API_BASE}. Start it with "npm run backend" or run the full app from the project root with "npm run dev".`);
      console.error(err);
    } finally {
      setActiveAgent(null);
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-navbar glass">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-navbar-copy">
          <div className="logo-icon">
            <img src="/logo.png" alt={APP_NAME} style={{ width: '100%', height: '100%', transform: 'scale(1.35)', transition: 'transform 0.4s ease', objectFit: 'cover' }} />
          </div>
          <span className={`engine-pill compact ${systemStatus.state}`}>{engineLabel}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div className="logo-icon">
            <img src="/logo.png" alt={APP_NAME} style={{ width: '100%', height: '100%', transform: 'scale(1.35)', transition: 'transform 0.4s ease', objectFit: 'cover' }} />
          </div>
          <span className="brand-text">AetherMed <span className="brand-accent">Agentic</span></span>
        </div>
        <nav>
          <button className={`nav-item ${view === 'assessment' ? 'active' : ''}`} onClick={() => { setView('assessment'); setReport(null); setVisualResult(null); setDocumentResult(null); setIsSidebarOpen(false); }}>
            <Plus size={18} /> New Session
          </button>
          <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); setIsSidebarOpen(false); }}>
            <History size={18} /> History
          </button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setIsSidebarOpen(false); }}>
            <Settings size={18} /> Settings
          </button>
        </nav>
        <div className="user-profile">
          <User size={18} /> Local profile
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <MotionDiv 
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-copy">
            <div className="breadcrumb">{currentPage.eyebrow}</div>
            <div className="page-title">{currentPage.title}</div>
          </div>
          <div className="header-actions">
            <span className={`engine-pill ${systemStatus.state}`}>{engineLabel}</span>
            <Clock size={16} /> <span id="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        <section className="consultation-area">
          <div className="page-intro">
            <span className="section-kicker">{currentPage.eyebrow}</span>
            <h1>{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>

          {view === 'history' && (
             <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="history-view glass" style={{ padding: '32px', width: '100%', maxWidth: '800px', marginTop: '20px', textAlign: 'left' }}>
                <h2>Session History</h2>
                {sessionHistory.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>No saved assessments yet. Run a text, visual, or document review to build history.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        {sessionHistory.map(session => (
                            <div key={session.id} style={{ background: 'var(--surface-muted)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{session.date}</div>
                                <div style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '10px' }}>
                                  {session.kind === 'visual' ? 'Visual review' : session.kind === 'document' ? 'Document explainer' : 'Text assessment'}
                                </div>
                                <div style={{ fontWeight: '500', margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px' }}>"{session.summary || session.symptoms}"</div>
                                <button
                                  className="reset-btn"
                                  style={{ padding: '8px 16px', fontSize: '13px' }}
                                  onClick={() => {
                                    const isVisualSession = session.kind === 'visual';
                                    const isDocumentSession = session.kind === 'document';
                                    setAssessmentMode(isVisualSession ? 'visual' : isDocumentSession ? 'document' : 'text');
                                    setReport(isVisualSession || isDocumentSession ? null : (session.report || session.data));
                                    setVisualResult(isVisualSession ? (session.result || session.report || session.data) : null);
                                    setDocumentResult(isDocumentSession ? (session.result || session.report || session.data) : null);
                                    setView('assessment');
                                  }}
                                >
                                   {session.kind === 'visual' ? 'Load Visual Review' : session.kind === 'document' ? 'Load Document View' : 'Load Assessment View'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </MotionDiv>
          )}

          {view === 'settings' && (
             <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="settings-view glass" style={{ padding: '32px', width: '100%', maxWidth: '800px', marginTop: '20px', textAlign: 'left' }}>
                <h2>Local Settings</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>A unique local client ID is created automatically for each browser or device. Switching is only needed if multiple people share the same browser profile.</p>
                <div className="profile-chip">
                  <strong>Local client ID</strong>
                  <span>{clientId}</span>
                </div>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-action-btn"
                    onClick={handleSwitchLocalProfile}
                  >
                    Switch local profile
                  </button>
                  <button
                    type="button"
                    className="profile-action-btn danger"
                    onClick={handleResetLocalProfile}
                  >
                    Reset this profile
                  </button>
                </div>
                <div className="input-group" style={{ marginTop: '32px', background: 'transparent', boxShadow: 'none' }}>
                    <div className="form-field">
                        <label>Default Visual Theme</label>
                        <select value={userSettings.theme} onChange={(e) => setUserSettings({...userSettings, theme: e.target.value})}>
                            <option value="dark">Calm Night</option>
                            <option value="light">Clinical Light</option>
                        </select>
                    </div>
                    <div className="form-field" style={{ marginTop: '16px' }}>
                        <label>Default Base Profile (Age)</label>
                        <select value={userSettings.defaultAgeRange} onChange={(e) => {
                            const val = e.target.value;
                            setUserSettings({...userSettings, defaultAgeRange: val});
                            setAgeRange(val);
                        }}>
                            <option value="0-18">0-18 Years</option>
                            <option value="18-35">18-35 Years</option>
                            <option value="36-50">36-50 Years</option>
                            <option value="51-65">51-65 Years</option>
                            <option value="65+">65+ Years</option>
                        </select>
                    </div>
                </div>
             </MotionDiv>
          )}

          {view === 'assessment' && !hasAssessmentResult && !loading && (
            <MotionDiv 
              className="welcome-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="assessment-mode-toggle glass">
                <button
                  type="button"
                  className={`mode-toggle-btn ${assessmentMode === 'text' ? 'active' : ''}`}
                  onClick={() => {
                    setAssessmentMode('text');
                    setReport(null);
                    setVisualResult(null);
                    setDocumentResult(null);
                    setError(null);
                  }}
                >
                  Text symptoms
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${assessmentMode === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setAssessmentMode('upload');
                    setReport(null);
                    setVisualResult(null);
                    setDocumentResult(null);
                    setError(null);
                  }}
                >
                  Upload assistant
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${assessmentMode === 'visual' ? 'active' : ''}`}
                  onClick={() => {
                    setAssessmentMode('visual');
                    setReport(null);
                    setVisualResult(null);
                    setDocumentResult(null);
                    setError(null);
                  }}
                >
                  Image review
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${assessmentMode === 'document' ? 'active' : ''}`}
                  onClick={() => {
                    setAssessmentMode('document');
                    setReport(null);
                    setVisualResult(null);
                    setDocumentResult(null);
                    setError(null);
                  }}
                >
                  Document explainer
                </button>
              </div>

              <div className="hero-panel">
                <div className="hero-copy">
                  <span className="section-kicker">Clinical intake</span>
                  <h2 className="hero-title">
                    {assessmentMode === 'upload'
                      ? 'Upload once and let AetherMed route it safely'
                      : assessmentMode === 'visual'
                        ? 'Submit a clear photo for visible symptom review'
                        : assessmentMode === 'document'
                          ? 'Upload a document for plain-language explanation'
                          : 'Describe symptoms to begin the assessment'}
                  </h2>
                  <p className="hero-text">{currentModeConfig.helperText}</p>
                </div>

                <div className="trust-strip">
                  <div className="trust-card">
                    <Shield size={18} />
                    <div>
                      <strong>Safety-first</strong>
                      <span>{assessmentMode === 'upload' ? 'Built to guide and route uploads safely, not diagnose from a file alone.' : assessmentMode === 'visual' ? 'Built to describe visible findings cautiously, not diagnose from a photo.' : assessmentMode === 'document' ? 'Built to explain the report in plain language, not replace the doctor’s note.' : 'Built to escalate red flags, not guess diagnoses.'}</span>
                    </div>
                  </div>
                  <div className="trust-card">
                    <Activity size={18} />
                    <div>
                      <strong>Visible workflow</strong>
                      <span>The UI shows symptom analysis, risk review, insight gathering, recommendations, and next steps as separate stages.</span>
                    </div>
                  </div>
                  <div className="trust-card">
                    <FileText size={18} />
                    <div>
                      <strong>Structured output</strong>
                      <span>Results are organized into clinical cards for risk, findings, safe guidance, and recommended next steps.</span>
                    </div>
                  </div>
                </div>

                {assessmentMode === 'text' ? (
                  <div className="example-prompts">
                    {DEMO_CASES.map((demoCase) => (
                      <button
                        key={demoCase.label}
                        type="button"
                        className="example-chip"
                        onClick={() => handleDemoCaseSelect(demoCase)}
                      >
                        <strong>{demoCase.label}</strong>
                        <span>Load sample case</span>
                      </button>
                    ))}
                  </div>
                ) : assessmentMode === 'upload' ? (
                  <div className="visual-tips">
                    <strong>Upload tips</strong>
                    <span>Use one clear image or screenshot. If it is a scan or report, keep the main content readable and crop out anything unrelated.</span>
                  </div>
                ) : assessmentMode === 'visual' ? (
                  <div className="visual-tips">
                    <strong>Photo tips</strong>
                    <span>Use bright natural light, keep the area in focus, and include the full visible problem in frame.</span>
                  </div>
                ) : (
                  <div className="visual-tips">
                    <strong>Document tips</strong>
                    <span>Use a straight, well-lit screenshot or photo, or paste the exact report text if you have it. Crop out unrelated content when possible.</span>
                  </div>
                )}

                <div className="hero-workflow-preview">
                  <WorkflowTimeline
                    preview
                    title="AetherMed clinical review pipeline"
                    description="The interface exposes the internal review logic before any response is generated, so the product feels like a real decision-support system."
                    steps={workflowSteps}
                    activeInsight="The staged workflow gives judges a clear sense of intelligence, orchestration, and safety boundaries."
                    agents={agents}
                    completedAgents={[]}
                  />
                </div>
              </div>

              <SafetyBanner
                title="AetherMed provides decision support and triage guidance, not a medical diagnosis"
                message="If symptoms are severe, rapidly worsening, or life-threatening, seek emergency care immediately instead of waiting for an AI response."
                tone="warning"
              />

              {assessmentMode === 'text' ? (
                <form onSubmit={handleAnalyze} className="input-group glass">
                  <div className="form-row">
                    <div className="form-field">
                      <label>Age Range</label>
                      <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                        <option value="0-18">0-18</option>
                        <option value="18-35">18-35</option>
                        <option value="36-50">36-50</option>
                        <option value="51-65">51-65</option>
                        <option value="65+">65+</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Urgency (1-5)</label>
                      <input 
                        type="range" 
                        min="1"
                        max="5"
                        step="1"
                        value={urgency} 
                        onChange={(e) => setUrgency(Number(e.target.value))}
                        style={{
                          background: `linear-gradient(90deg, var(--success) 0%, #facc15 ${Math.max(urgencyPercent, 10)}%, var(--surface-muted) ${Math.max(urgencyPercent, 10)}%, var(--surface-muted) 100%)`
                        }}
                      />
                      <div className="urgency-scale" aria-hidden="true">
                        {URGENCY_MARKS.map((mark) => (
                          <div
                            key={mark.value}
                            className={`urgency-mark ${Number(urgency) === mark.value ? 'active' : ''}`}
                          >
                            <span>{mark.label}</span>
                            <small>{mark.hint}</small>
                          </div>
                        ))}
                      </div>
                      <div className="urgency-value">Selected: {urgency} of 5</div>
                    </div>
                  </div>

                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Primary Symptoms</label>
                      <button 
                        type="button" 
                        className={`mic-btn ${listeningField === 'symptoms' ? 'recording' : ''}`}
                        onClick={() => startListening('symptoms', setSymptoms, symptoms)}
                        title="Dictate symptoms"
                      >
                        {listeningField === 'symptoms' ? <Mic size={16} /> : <MicOff size={16} />}
                      </button>
                    </div>
                    <textarea 
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g., Intense chest pain with shortness of breath for the last 20 minutes..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Optional Notes (Medical History)</label>
                      <button 
                        type="button" 
                        className={`mic-btn ${listeningField === 'notes' ? 'recording' : ''}`}
                        onClick={() => startListening('notes', setNotes, notes)}
                        title="Dictate notes"
                      >
                        {listeningField === 'notes' ? <Mic size={16} /> : <MicOff size={16} />}
                      </button>
                    </div>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., History of hypertension..."
                      rows={2}
                    />
                  </div>

                  <button type="submit" disabled={!symptoms.trim() || loading} className="primary-submit">
                    {loading ? 'Reviewing symptoms...' : <><Send size={18} /> {currentModeConfig.submitLabel}</>}
                  </button>
                  <div className="support-note">
                    {submitDisabledReason || 'If symptoms feel life-threatening, skip this tool and call local emergency services immediately.'}
                  </div>
                </form>
              ) : assessmentMode === 'upload' ? (
                <form onSubmit={handleUploadAssistantAnalyze} className="input-group glass">
                  <div className="form-field">
                    <label>Upload a file or image</label>
                    <UploadDropzone
                      icon="upload"
                      accept="image/*"
                      capture="environment"
                      onChange={handleUploadAssistantImageChange}
                      title="Choose a photo, screenshot, or camera capture"
                      description={`Use this when you are not sure whether the upload is a symptom image, medical report, or scan. JPG, PNG, or HEIC up to ${MAX_UPLOAD_ASSISTANT_IMAGE_SIZE_MB} MB.`}
                      helperItems={['Auto-detect input type', 'One follow-up question', 'Safety-first routing']}
                    />
                    <div className="profile-actions" style={{ marginTop: '10px' }}>
                      <button type="button" className="profile-action-btn" onClick={() => openDirectCamera('upload')}>
                        <Camera size={16} /> Scan with camera
                      </button>
                    </div>
                    <div className="form-note">
                      AetherMed will first identify the upload type, then ask for only the minimum extra context needed. It provides guidance, not diagnosis.
                    </div>
                  </div>

                  {uploadAssistantImageDataUrl && (
                    <div className="image-preview-wrap">
                      <img className="image-preview" src={uploadAssistantImageDataUrl} alt="Selected upload preview" />
                      <div className="image-preview-meta">
                        <strong>{uploadAssistantImageName || 'Uploaded file'}</strong>
                        <span>One clear upload is enough. The assistant will route it to the right workflow before analysis.</span>
                        <button type="button" className="reset-btn inline-reset" onClick={clearUploadAssistantImage}>
                          Remove upload
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadAssistantDetecting && (
                    <div className="visual-loading-card">
                      <strong>Upload assistant</strong>
                      <p>Checking whether this looks like a symptom image, medical report, or scan so we can ask only one small follow-up question.</p>
                    </div>
                  )}

                  {uploadAssistantProfile && !uploadAssistantDetecting && (
                    <div className="visual-loading-card">
                      <strong>{uploadAssistantProfile.guidance?.detectedInputType || 'Uploaded image detected'}</strong>
                      <p>{uploadAssistantProfile.guidance?.supportiveIntro || 'I can help route this upload safely.'}</p>
                      <p style={{ marginTop: '8px' }}>{uploadAssistantProfile.guidance?.disclaimer || 'AetherMed provides guidance, not diagnosis.'}</p>
                    </div>
                  )}

                  {uploadAssistantProfile && (
                    <div className="form-field">
                      <label>{uploadAssistantProfile.guidance?.minimumContextLabel || 'Optional context'}</label>
                      <textarea
                        value={uploadAssistantContext}
                        onChange={(e) => setUploadAssistantContext(e.target.value)}
                        placeholder={uploadAssistantProfile.guidance?.minimumContextPlaceholder || 'Add only what feels necessary.'}
                        rows={3}
                      />
                      <div className="form-note">
                        {uploadAssistantProfile.autoContext?.suggestedContext ? 'Drafted automatically from the uploaded image. Edit it however you like. ' : ''}
                        {uploadAssistantProfile.guidance?.supportNote || 'A short note is enough.'}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={!uploadAssistantImageDataUrl || uploadAssistantDetecting || loading} className="primary-submit">
                    {loading ? 'Routing upload...' : <><Send size={18} /> {currentModeConfig.submitLabel}</>}
                  </button>
                  <div className="support-note">
                    {submitDisabledReason || 'If the upload relates to severe chest pain, breathing trouble, heavy bleeding, stroke symptoms, or rapidly worsening illness, seek urgent medical care immediately.'}
                  </div>
                </form>
              ) : assessmentMode === 'visual' ? (
                <form onSubmit={handleVisualAnalyze} className="input-group glass">
                  <div className="form-field">
                    <label>Upload or capture an image</label>
                    <UploadDropzone
                      icon="image"
                      accept="image/*"
                      capture="environment"
                      onChange={handleVisualImageChange}
                      title="Choose a photo or use your camera"
                      description={`JPG, PNG, or HEIC up to ${MAX_VISUAL_IMAGE_SIZE_MB} MB. Best for rashes, swelling, wounds, and visible skin changes.`}
                      helperItems={['Bright light', 'Full affected area', 'Avoid blurry photos']}
                    />
                    <div className="profile-actions" style={{ marginTop: '10px' }}>
                      <button type="button" className="profile-action-btn" onClick={() => openDirectCamera('visual')}>
                        <Camera size={16} /> Scan directly with camera
                      </button>
                    </div>
                  <div className="form-note">
                      This review works best for visible external body issues. If you upload an X-ray, CT, MRI, ultrasound, or other scan, AetherMed will not diagnose it and will redirect you to professional review.
                  </div>
                  </div>

                  {visualImageDataUrl && (
                    <div className="image-preview-wrap">
                      <img className="image-preview" src={visualImageDataUrl} alt="Selected symptom preview" />
                      <div className="image-preview-meta">
                        <strong>{visualImageName || 'Uploaded image'}</strong>
                        <span>Clear, well-lit images work best. Include the full affected area in frame.</span>
                        <button type="button" className="reset-btn inline-reset" onClick={clearVisualImage}>
                          Remove image
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-field">
                    <label>Optional context</label>
                    <textarea
                      value={visualNotes}
                      onChange={(e) => setVisualNotes(e.target.value)}
                      placeholder="e.g., itchy for 2 days, warm to touch, swelling started yesterday..."
                      rows={3}
                    />
                    {visualImageDataUrl && visualNotes && (
                      <div className="form-note">
                        This draft was auto-filled from the uploaded image. Edit it if you want to add or correct details.
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={!visualImageDataUrl || loading} className="primary-submit">
                    {loading ? 'Reviewing image...' : <><Send size={18} /> {currentModeConfig.submitLabel}</>}
                  </button>
                  <div className="support-note">
                    {submitDisabledReason || 'If there is trouble breathing, severe pain, rapidly spreading swelling, heavy bleeding, or facial involvement, seek urgent medical care immediately.'}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleDocumentAnalyze} className="input-group glass">
                  <div className="form-field">
                    <label>Upload a document screenshot or photo</label>
                    <UploadDropzone
                      icon="document"
                      accept="image/*,.pdf,.txt,.md,.json,application/pdf,text/plain,application/json"
                      onChange={handleDocumentImageChange}
                      title="Choose a screenshot, PDF, or text-based report"
                      description={`Images up to ${MAX_DOCUMENT_IMAGE_SIZE_MB} MB, text files up to ${MAX_DOCUMENT_TEXT_FILE_SIZE_MB} MB, plus PDF reports with extractable text.`}
                      helperItems={['Lab reports', 'Discharge notes', 'Prescription instructions']}
                    />
                    <div className="form-note">
                      This mode explains medical documents in simpler language. It does not replace the original report or give a new diagnosis.
                    </div>
                  </div>

                  {documentImageDataUrl && (
                    <div className="image-preview-wrap">
                      <img className="image-preview" src={documentImageDataUrl} alt="Selected medical document preview" />
                      <div className="image-preview-meta">
                        <strong>{documentImageName || 'Uploaded medical document'}</strong>
                        <span>Keep the page straight, avoid glare, and make sure the main text is readable.</span>
                        <button type="button" className="reset-btn inline-reset" onClick={clearDocumentImage}>
                          Remove image
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-field">
                    <label>Or paste the document text</label>
                    <textarea
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                      placeholder="Paste a diagnosis note, lab summary, prescription instructions, or clinic report text here..."
                      rows={5}
                    />
                  </div>

                  <div className="form-field">
                    <label>Optional context</label>
                    <textarea
                      value={documentNotes}
                      onChange={(e) => setDocumentNotes(e.target.value)}
                      placeholder="e.g., This was given after an emergency visit, I do not understand the highlighted terms, or this is a lab screenshot..."
                      rows={3}
                    />
                    {documentImageDataUrl && documentNotes && (
                      <div className="form-note">
                        This draft was auto-filled from the uploaded image. Edit it if you want to add or correct details.
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={(!documentImageDataUrl && !documentText.trim()) || loading} className="primary-submit">
                    {loading ? 'Explaining document...' : <><Send size={18} /> {currentModeConfig.submitLabel}</>}
                  </button>
                  <div className="support-note">
                    {submitDisabledReason || 'If the document says emergency, critical, urgent referral, or severe abnormal findings, contact the issuing clinic or seek medical care promptly.'}
                  </div>
                </form>
              )}
            </MotionDiv>
          )}

          {view === 'assessment' && loading && (
            <div className="orchestrator-view glass">
              <div className="view-header">
                <h3>{currentModeConfig.loadingTitle}</h3>
                <div className="status-badge pulse-active">In progress</div>
              </div>
              <p className="loading-copy">{currentModeConfig.loadingDescription}</p>

              <div className="loading-intelligence-panel">
                <div className="loading-hero-summary">
                  <span className="section-kicker">Judge-ready clinical UX</span>
                  <h4>{currentModeConfig.heroTitle}</h4>
                  <p>{currentModeConfig.heroDescription}</p>
                </div>

                <div className="hero-signal-row loading-visible">
                  <span className={`engine-pill ${systemStatus.state}`}>{engineLabel}</span>
                  <span className="hero-signal-chip"><Languages size={14} /> Detected language: {detectedInterfaceLanguage}</span>
                  <span className="hero-signal-chip"><HeartPulse size={14} /> Multimodal review ready</span>
                </div>

                <div className="trust-strip loading-visible">
                  <div className="trust-card">
                    <Shield size={18} />
                    <div>
                      <strong>Safety-first</strong>
                      <span>Built to escalate red flags, not guess diagnoses.</span>
                    </div>
                  </div>
                  <div className="trust-card">
                    <Activity size={18} />
                    <div>
                      <strong>Visible workflow</strong>
                      <span>The UI shows symptom analysis, risk review, insight gathering, recommendations, and next steps as separate stages.</span>
                    </div>
                  </div>
                  <div className="trust-card">
                    <FileText size={18} />
                    <div>
                      <strong>Structured output</strong>
                      <span>Results are organized into clinical cards for risk, findings, safe guidance, and recommended next steps.</span>
                    </div>
                  </div>
                </div>
              </div>

              <WorkflowTimeline
                title={currentModeConfig.loadingTitle}
                description={currentModeConfig.loadingDescription}
                steps={workflowSteps}
                activeIndex={workflowActiveIndex}
                completedCount={workflowCompletedCount}
                activeAgent={activeAgent}
                activeInsight={activeWorkflowInsight}
                agents={agents}
                completedAgents={completedAgents}
              />

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <button className="reset-btn" style={{ fontSize: '12px' }} onClick={() => setShowLogs(!showLogs)}>
                      {showLogs ? 'Hide Workflow Trace' : 'Inspect Agent Trace'}
                  </button>
              </div>

              <AnimatePresence>
                {showLogs && (
                    <MotionDiv 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="trace-log"
                        style={{ marginTop: '16px', overflow: 'hidden' }}
                    >
                        {currentInsights.map((insight, idx) => (
                            <div key={idx} style={{ marginBottom: '8px', borderLeft: '2px solid var(--primary)', paddingLeft: '12px' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>&gt; </span>
                                {insight}
                            </div>
                        ))}
                    </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          )}

          {error && (
            <div className="error-box glass">
              <AlertCircle size={24} color="var(--danger)" />
              <div className="error-box-copy">
                <strong>We could not complete the review</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {view === 'assessment' && hasAssessmentResult && (
            <div className="results-container">
              {report ? <ReportCard data={report} /> : visualResult ? <VisualReportCard data={visualResult} /> : <DocumentReportCard data={documentResult} />}
              <button className="reset-btn" onClick={() => { setReport(null); setVisualResult(null); setDocumentResult(null); }}>
                <Plus size={18} /> New Assessment
              </button>
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {cameraOpen && (
          <MotionDiv
            className="camera-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MotionDiv
              className="camera-modal glass"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="view-header" style={{ marginBottom: '16px' }}>
                <h3>{cameraTarget === 'visual' ? 'Capture image for direct review' : 'Scan with camera'}</h3>
                <button type="button" className="reset-btn" style={{ marginTop: 0 }} onClick={closeDirectCamera}>
                  <X size={16} /> Close
                </button>
              </div>
              <p className="loading-copy">
                {cameraTarget === 'visual'
                  ? 'Point the camera at the visible skin or body issue. AetherMed will place the capture straight into image review so you can add context and analyze it safely.'
                  : 'Point the camera at the skin issue, medical report, or scan. AetherMed will route it to the right workflow and still provide guidance, not diagnosis.'}
              </p>
              <div className="camera-preview-shell">
                {cameraError ? (
                  <div className="error-box glass" style={{ maxWidth: '100%' }}>
                    <AlertCircle size={24} color="var(--danger)" />
                    <p>{cameraError}</p>
                  </div>
                ) : (
                  <video
                    ref={cameraVideoRef}
                    className="camera-preview"
                    autoPlay
                    playsInline
                    muted
                  />
                )}
              </div>
              <p className="camera-status-note">
                {cameraReady
                  ? `Camera ready. The ${cameraTarget === 'visual' ? 'image review capture' : 'upload assistant capture'} will be automatically resized for a reliable upload.`
                  : 'Preparing the live camera preview for capture...'}
              </p>
              <div className="profile-actions">
                <button type="button" className="profile-action-btn" onClick={captureFromCamera} disabled={Boolean(cameraError) || !cameraReady || uploadAssistantDetecting}>
                  <Camera size={16} /> {uploadAssistantDetecting ? (cameraTarget === 'visual' ? 'Saving capture...' : 'Inspecting capture...') : cameraReady ? (cameraTarget === 'visual' ? 'Capture for image review' : 'Capture and route') : 'Preparing camera...'}
                </button>
                <button type="button" className="profile-action-btn" onClick={closeDirectCamera}>
                  {cameraTarget === 'visual' ? 'Use regular image upload' : 'Use regular upload'}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />

      <style>{`
        .layout { display: flex; min-height: 100vh; width: 100%; position: relative; overflow: hidden; color: var(--text-primary); }

        .mobile-navbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          min-height: 72px;
          padding: 12px 18px;
          z-index: 100;
          align-items: center;
          gap: 12px;
          border-radius: 0;
          border-bottom: 1px solid var(--border-color);
          background: color-mix(in srgb, var(--bg-card) 90%, transparent);
        }

        .menu-toggle { background: transparent; border: 0; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; }
        .mobile-navbar-copy { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .logo-compact { display: flex; align-items: center; gap: 8px; }
        .logo-compact span { font-weight: 700; font-size: 16px; color: var(--text-primary); }

        .sidebar {
          width: var(--sidebar-width);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 28px 24px;
          border-right: 1px solid var(--border-color);
          z-index: 110;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: color-mix(in srgb, var(--bg-card) 94%, transparent);
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.48);
          backdrop-filter: blur(4px);
          z-index: 105;
          display: none;
        }

        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
        .logo-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 32px var(--primary-glow);
          overflow: hidden;
          background: #09111f;
          border: 2px solid var(--primary-glow);
        }
        .logo .brand-text {
          font-weight: 800;
          font-size: 26px;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo .brand-accent {
          display: block;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--primary);
          -webkit-text-fill-color: var(--primary);
          margin-top: -4px;
        }

        nav { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .nav-item {
          background: transparent;
          border: 0;
          color: var(--text-secondary);
          padding: 12px 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .nav-item:hover { background: var(--surface-muted); color: var(--text-primary); }
        .nav-item.active { background: var(--surface-soft); color: var(--primary); }
        .user-profile {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.05), transparent 38%);
        }

        .main-header {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          background: color-mix(in srgb, var(--bg-card) 90%, transparent);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-copy { display: flex; flex-direction: column; gap: 4px; }
        .breadcrumb, .section-kicker {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.4px;
        }
        .page-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .header-actions { color: var(--text-muted); font-size: 13px; display: flex; align-items: center; gap: 10px; }
        .engine-pill {
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          background: var(--surface-strong);
          white-space: nowrap;
        }
        .engine-pill.ready { color: var(--success); background: var(--success-soft); }
        .engine-pill.offline { color: var(--danger); background: var(--danger-soft); }
        .engine-pill.compact {
          font-size: 11px;
          padding: 5px 10px;
          max-width: min(68vw, 280px);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .consultation-area {
          flex: 1;
          padding: 48px 40px 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-intro {
          width: 100%;
          max-width: 960px;
          margin-bottom: 28px;
          text-align: left;
        }

        .page-intro h1 {
          font-size: clamp(2.3rem, 5vw, 3.6rem);
          line-height: 1.02;
          margin: 10px 0 14px;
          font-weight: 800;
          letter-spacing: -1.4px;
          max-width: 12ch;
          text-wrap: balance;
        }

        .page-intro p {
          color: var(--text-secondary);
          font-size: clamp(1rem, 1.8vw, 1.1rem);
          margin: 0;
          max-width: 62ch;
          line-height: 1.7;
        }

        .welcome-box { max-width: 960px; width: 100%; display: flex; flex-direction: column; gap: 24px; margin-top: 0; }
        .assessment-mode-toggle {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          padding: 8px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: color-mix(in srgb, var(--bg-card) 94%, transparent);
          width: 100%;
          max-width: 960px;
        }
        .mode-toggle-btn {
          background: transparent;
          border: 0;
          color: var(--text-secondary);
          padding: 13px 18px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }
        .mode-toggle-btn.active {
          background: var(--surface-soft);
          color: var(--text-primary);
          box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--primary) 35%, var(--border-color)),
            0 10px 22px rgba(2, 6, 23, 0.14);
        }
        .hero-panel {
          position: relative;
          overflow: hidden;
          background: linear-gradient(155deg, color-mix(in srgb, var(--bg-card) 96%, transparent), color-mix(in srgb, var(--surface-strong) 72%, transparent));
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: clamp(22px, 4vw, 32px);
          box-shadow: var(--glass-shadow);
        }
        .hero-panel::after {
          content: "";
          position: absolute;
          inset: auto -8% -38% 48%;
          height: 220px;
          background: radial-gradient(circle, color-mix(in srgb, var(--primary) 28%, transparent) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-copy { max-width: 64ch; }
        .hero-signal-row {
          display: none;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .hero-signal-row.loading-visible {
          display: flex;
        }
        .hero-signal-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
        }
        .hero-title {
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          line-height: 1.1;
          margin: 12px 0;
          color: var(--text-primary);
          letter-spacing: -0.8px;
        }
        .hero-text {
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.75;
          font-size: 1rem;
        }
        .trust-strip {
          display: none;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }
        .trust-strip.loading-visible {
          display: grid;
          margin-top: 0;
        }
        .trust-card {
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          color: var(--text-secondary);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .trust-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--primary) 28%, var(--border-color));
          background: color-mix(in srgb, var(--surface-soft) 50%, var(--surface-muted));
        }
        .trust-card strong {
          display: block;
          color: var(--text-primary);
          margin-bottom: 4px;
          font-size: 14px;
        }
        .trust-card span {
          font-size: 13px;
          line-height: 1.5;
        }
        .example-prompts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 22px;
        }
        .visual-tips {
          margin-top: 22px;
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .visual-tips strong {
          color: var(--text-primary);
          font-size: 14px;
        }
        .example-chip {
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          color: var(--text-secondary);
          padding: 14px;
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .example-chip:hover {
          background: var(--surface-soft);
          color: var(--text-primary);
          border-color: color-mix(in srgb, var(--primary) 35%, var(--border-color));
        }
        .example-chip strong {
          color: var(--text-primary);
          font-size: 14px;
        }
        .example-chip span {
          font-size: 12px;
          line-height: 1.55;
          color: var(--text-secondary);
        }
        .hero-workflow-preview {
          display: none;
        }
        .loading-intelligence-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 20px;
        }
        .loading-hero-summary {
          padding: 18px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
          background: linear-gradient(160deg, color-mix(in srgb, var(--surface-soft) 72%, transparent), var(--surface-muted));
        }
        .loading-hero-summary h4 {
          margin: 0 0 8px;
          color: var(--text-primary);
          font-size: 1.15rem;
          line-height: 1.3;
        }
        .loading-hero-summary p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .input-group {
          padding: clamp(22px, 4vw, 32px);
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
          background: color-mix(in srgb, var(--bg-card) 94%, transparent);
          box-shadow: var(--glass-shadow);
          border-radius: 24px;
        }

        .form-row { display: flex; gap: 20px; }
        .form-field { display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .form-field label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.9px;
        }
        .image-upload-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 18px;
          border-radius: 18px;
          border: 1px dashed color-mix(in srgb, var(--primary) 38%, var(--border-color));
          background: var(--surface-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .image-upload-box:hover {
          background: var(--surface-soft);
          border-color: color-mix(in srgb, var(--primary) 55%, var(--border-color));
        }
        .image-upload-box input {
          display: none;
        }
        .image-upload-box strong {
          color: var(--text-primary);
          font-size: 15px;
        }
        .image-upload-box span,
        .form-note {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 14px;
        }
        .image-preview-wrap {
          display: grid;
          grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
          gap: 18px;
          padding: 18px;
          border: 1px solid var(--border-color);
          border-radius: 18px;
          background: var(--surface-muted);
        }
        .image-preview {
          width: 100%;
          max-height: 260px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          background: var(--surface-strong);
        }
        .image-preview-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
        }
        .image-preview-meta strong {
          color: var(--text-primary);
        }
        .image-preview-meta span {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        select, textarea {
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 16px;
          color: var(--text-primary);
          width: 100%;
        }
        select:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
        input[type="range"] {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          height: 10px;
          border-radius: 999px;
          border: 0;
          padding: 0;
          cursor: pointer;
          background: linear-gradient(90deg, var(--success) 0%, #facc15 50%, var(--surface-muted) 50%, var(--surface-muted) 100%);
        }
        input[type="range"]:focus {
          outline: none;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 10px;
          border-radius: 999px;
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          height: 10px;
          border-radius: 999px;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          margin-top: -6px;
          border: 3px solid white;
          background: var(--primary-strong);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
        }
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid white;
          background: var(--primary-strong);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
        }
        .urgency-scale {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }
        .urgency-mark {
          text-align: center;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.2;
        }
        .urgency-mark span {
          display: block;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .urgency-mark small {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .urgency-mark.active span,
        .urgency-mark.active small {
          color: var(--primary);
        }
        .urgency-value {
          font-size: 12px;
          color: var(--primary);
          text-align: right;
          margin-top: 2px;
          font-weight: 700;
        }

        textarea {
          font-size: 15px;
          resize: vertical;
          min-height: 110px;
          line-height: 1.6;
        }

        .mic-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mic-btn:hover { background: var(--surface-muted); color: var(--text-primary); }
        .mic-btn.recording { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); animation: pulse-record 1.5s infinite; }

        @keyframes pulse-record {
            0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.35); }
            70% { box-shadow: 0 0 0 6px rgba(248, 113, 113, 0); }
            100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
        }

        button[type="submit"] {
          background: linear-gradient(135deg, var(--primary-strong), var(--secondary));
          color: white;
          border: 0;
          padding: 16px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          box-shadow: 0 16px 34px var(--primary-glow);
        }
        button[type="submit"]:hover:not(:disabled) { transform: translateY(-2px); }
        button[type="submit"]:disabled { opacity: 0.7; cursor: not-allowed; }
        .support-note {
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.6;
          text-align: center;
        }
        .inline-reset {
          width: fit-content;
          margin-top: 4px;
        }
        .profile-chip {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px solid var(--border-color);
          border-radius: 14px;
          background: var(--surface-muted);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-chip strong {
          color: var(--text-primary);
          font-size: 13px;
        }
        .profile-chip span {
          color: var(--text-secondary);
          font-size: 12px;
          word-break: break-all;
        }
        .profile-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 14px;
        }
        .profile-action-btn {
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .profile-action-btn:hover {
          background: var(--surface-soft);
        }
        .profile-action-btn:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
        .profile-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .profile-action-btn.danger {
          color: var(--danger);
          border-color: color-mix(in srgb, var(--danger) 30%, var(--border-color));
          background: var(--danger-soft);
        }

        .orchestrator-view {
          max-width: 960px;
          width: 100%;
          padding: clamp(20px, 5vw, 32px);
          border-top: 3px solid var(--primary);
          margin-top: 20px;
        }
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; }
        .view-header h3 {
          margin: 0;
          font-size: 14px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .status-badge {
          border-radius: 999px;
          padding: 6px 12px;
          background: var(--surface-soft);
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
        }
        .loading-copy {
          color: var(--text-secondary);
          margin: 0 0 20px;
          line-height: 1.6;
        }
        .agent-stack { display: flex; flex-direction: column; gap: 12px; }
        .visual-loading-card {
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px;
          background: var(--surface-muted);
        }
        .visual-loading-card strong {
          display: block;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .visual-loading-card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .visual-loading-card.ready-state {
          border-color: color-mix(in srgb, var(--success) 28%, var(--border-color));
          background: color-mix(in srgb, var(--success-soft) 42%, var(--surface-muted));
        }
        .inline-support-copy {
          margin-top: 8px !important;
        }

        .results-container { width: 100%; display: flex; flex-direction: column; align-items: center; padding-bottom: 40px; }
        .error-box {
          width: 100%;
          max-width: 720px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 18px 20px;
          border-left: 4px solid var(--danger);
          color: var(--text-secondary);
          background: var(--danger-soft);
        }
        .error-box-copy strong {
          display: block;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .error-box p {
          margin: 0;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.6;
        }
        .reset-btn {
          margin-top: 24px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 10px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .reset-btn:hover {
          background: var(--surface-muted);
          color: var(--text-primary);
        }

        .camera-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 200;
        }

        .camera-modal {
          width: min(92vw, 720px);
          padding: 22px;
          max-height: min(90vh, 900px);
          overflow: auto;
        }

        .camera-preview-shell {
          border-radius: 18px;
          overflow: hidden;
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .camera-preview {
          width: 100%;
          max-height: 70vh;
          object-fit: cover;
          background: #000;
        }

        .camera-status-note {
          margin: 12px 0 0;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .trust-strip { grid-template-columns: 1fr; }
          .example-prompts { grid-template-columns: 1fr; }
        }

        @media (max-width: 1024px) {
          .sidebar { width: 240px; }
          .main-header, .consultation-area { padding-left: 24px; padding-right: 24px; }
        }

        @media (max-width: 768px) {
          .mobile-navbar { display: flex; }
          .main-header { display: none; }
          .sidebar {
            position: fixed;
            left: 0; top: 0; bottom: 0;
            transform: translateX(-100%);
            border-radius: 0;
            width: 82%;
            max-width: 320px;
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-backdrop { display: block; }
          .main-content { padding-top: 78px; }
          .consultation-area { padding: 28px 20px 40px; }
          .page-intro { margin-bottom: 20px; }
          .page-intro h1 { max-width: 14ch; }
          .welcome-box { gap: 18px; }
        }

        @media (max-width: 600px) {
          .form-row { flex-direction: column; gap: 16px; }
          .example-prompts { gap: 8px; }
          .example-chip { width: 100%; text-align: left; }
          .assessment-mode-toggle { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .image-preview-wrap { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .orchestrator-view { padding: 20px; }
          .input-group { padding: 16px; }
          .nav-item { padding: 10px; font-size: 14px; }
          .hero-panel { border-radius: 18px; }
          .trust-card { padding: 14px; }
        }
      `}</style>
    </div>
  );
}

export default App;
