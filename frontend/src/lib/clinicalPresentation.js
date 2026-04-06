const RISK_THEME = {
  LOW: {
    key: 'LOW',
    label: 'Low',
    accent: '#16a34a',
    soft: 'rgba(22, 163, 74, 0.12)',
    border: 'rgba(22, 163, 74, 0.28)'
  },
  MODERATE: {
    key: 'MODERATE',
    label: 'Moderate',
    accent: '#d97706',
    soft: 'rgba(217, 119, 6, 0.14)',
    border: 'rgba(217, 119, 6, 0.28)'
  },
  HIGH: {
    key: 'HIGH',
    label: 'High',
    accent: '#dc2626',
    soft: 'rgba(220, 38, 38, 0.14)',
    border: 'rgba(220, 38, 38, 0.28)'
  },
  EMERGENCY: {
    key: 'EMERGENCY',
    label: 'Emergency',
    accent: '#7f1d1d',
    soft: 'rgba(127, 29, 29, 0.22)',
    border: 'rgba(127, 29, 29, 0.36)'
  }
};

const RISK_ALIASES = {
  LOW: 'LOW',
  STABLE: 'LOW',
  MILD: 'LOW',
  MODERATE: 'MODERATE',
  MEDIUM: 'MODERATE',
  HIGH: 'HIGH',
  SEVERE: 'HIGH',
  CRITICAL: 'EMERGENCY',
  URGENT: 'EMERGENCY',
  EMERGENCY: 'EMERGENCY'
};

export function normalizeRiskLevel(value, fallback = 'MODERATE') {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  return RISK_ALIASES[normalized] || fallback;
}

export function getRiskTheme(value, fallback = 'MODERATE') {
  const key = normalizeRiskLevel(value, fallback);
  return RISK_THEME[key] || RISK_THEME.MODERATE;
}

export function formatDetectedLanguage(value) {
  if (!value) {
    return 'English';
  }

  const raw = String(value).trim();
  if (!raw) {
    return 'English';
  }

  const compact = raw.replace(/_/g, '-');
  const baseLanguage = compact.split('-')[0];

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    const resolved = displayNames.of(baseLanguage);

    if (resolved && resolved.toLowerCase() !== baseLanguage.toLowerCase()) {
      return compact.length <= 5 ? `${resolved} (${compact})` : resolved;
    }
  } catch {
    // Fallback to raw language value below.
  }

  if (compact.length <= 5) {
    return compact.toUpperCase();
  }

  return raw;
}
