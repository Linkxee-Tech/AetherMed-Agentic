/**
 * AetherMed Tools Layer
 * Simulated external functions representing an MCP-style architecture.
 */

// 1. parse_symptoms(text) → list
function parse_symptoms(text) {
    if (!text) return [];
    // A simple mock parser that splits by common delimiters and keywords
    const lowerText = text.toLowerCase();
    const commonSymptoms = [
        'chest pain', 'shortness of breath', 'difficulty breathing', 
        'headache', 'fever', 'nausea', 'vomiting', 'dizziness', 
        'fatigue', 'cough', 'bleeding', 'pain'
    ];
    
    return commonSymptoms.filter(symptom => lowerText.includes(symptom));
}

// 2. knowledge_lookup(symptom) → text
function knowledge_lookup(symptoms) {
    const database = {
        'chest pain': 'High risk of myocardial infarction or angina. Immediate evaluation required.',
        'difficulty breathing': 'Potential respiratory distress, asthma exacerbation, or cardiovascular issue.',
        'headache': 'Ranges from benign tension headache to critical neurological events like stroke.',
        'fever': 'Indicates potential infection. Monitor temperature and hydration.',
        'bleeding': 'Requires assessment of volume loss and wound severity.'
    };

    let findings = [];
    symptoms.forEach(s => {
        if (database[s]) {
            findings.push(`[${s.toUpperCase()}]: ${database[s]}`);
        }
    });

    return findings.length > 0 ? findings.join(' ') : 'General symptom presentation. Monitor closely.';
}

// 3. risk_score(severity, age, urgency) → score
function risk_score(severity, ageRange, urgency) {
    let score = 10; // base score

    // Urgency parsing (1-5)
    const urgencyScore = parseInt(urgency) || 1;
    score += (urgencyScore * 5); // Max +25

    // Age risk factor
    if (ageRange) {
        if (ageRange.includes('60') || ageRange.includes('70') || ageRange.includes('80+')) {
            score += 20;
        } else if (ageRange.includes('infant') || ageRange.includes('0-2')) {
            score += 25;
        }
    }

    // Severity mapping from Triage Agent
    const severityMap = {
        'CRITICAL': 50,
        'HIGH': 30,
        'MEDIUM': 15,
        'LOW': 5
    };
    
    if (severityMap[severity]) {
        score += severityMap[severity];
    }

    return Math.min(score, 100); // Cap at 100
}

// 4. referral_lookup(severity, location) → text
function referral_lookup(severity, location = "Local") {
    switch(severity) {
        case 'CRITICAL':
            return { type: 'Emergency Room', location: `Nearest Level 1 Trauma Center (${location})` };
        case 'HIGH':
            return { type: 'Urgent Care', location: `24/7 Urgent Care Clinic (${location})` };
        case 'MEDIUM':
            return { type: 'Primary Care', location: `Primary Care Physician (${location})` };
        default:
            return { type: 'Home Care', location: 'Self-monitoring at home' };
    }
}

// 5. format_response(agent_outputs) → strict FHIR R4 JSON Bundle
function format_response(context) {
    // Expected context: { input, triage, research, advice, referral }
    
    // Map existing custom JSON into strict FHIR standard schemas
    const bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": []
    };

    // 1. Observation (Symptoms)
    const symptoms = context.research?.extractedSymptoms || ["Unknown"];
    bundle.entry.push({
        "fullUrl": "urn:uuid:obs-1",
        "resource": {
            "resourceType": "Observation",
            "status": "final",
            "code": {
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "display": "Patient reported symptoms"
                }]
            },
            "valueString": symptoms.join(", ")
        }
    });

    // 2. ClinicalImpression (Triage & Findings)
    bundle.entry.push({
        "fullUrl": "urn:uuid:imp-1",
        "resource": {
            "resourceType": "ClinicalImpression",
            "status": "completed",
            "description": context.triage?.reason || "Initial triage assessment",
            "summary": context.research?.knowledge || "No findings available.",
            "protocol": [context.triage?.urgency || "UNKNOWN"],
            "investigation": [{
                "code": { "text": "Clinical Risk Score" },
                "item": [{ "display": `Calculated Score: ${context.advice?.riskScore || 0}/100` }]
            }]
        }
    });

    // 3. CarePlan (Advice & Referral)
    const instructions = context.advice?.recommendations || [];
    const referral = context.referral?.referral;
    
    const activities = instructions.map(rec => ({
        "detail": {
            "kind": "ServiceRequest",
            "description": `${rec.urgency}: ${rec.title} - ${rec.action}`
        }
    }));
    
    if (referral) {
        activities.push({
            "detail": {
                "kind": "Appointment",
                "description": `Referral to ${referral.type} at ${referral.location}. Action: ${referral.action}`
            }
        });
    }

    bundle.entry.push({
        "fullUrl": "urn:uuid:cp-1",
        "resource": {
            "resourceType": "CarePlan",
            "status": "active",
            "intent": "proposal",
            "activity": activities,
            "note": [{
                "text": "DISCLAIMER: AetherMed is a simulated system for demonstration purposes only. It is NOT a medical device."
            }]
        }
    });

    return bundle;
}

module.exports = {
    parse_symptoms,
    knowledge_lookup,
    risk_score,
    referral_lookup,
    format_response
};
