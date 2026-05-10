const fs = require('fs');
const path = require('path');

function fail(message) {
    throw new Error(message);
}

function readJson(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

function assertBundleShape(payload, label) {
    if (!payload || typeof payload !== 'object') {
        fail(`${label}: payload must be an object.`);
    }

    if (payload.resourceType !== 'Bundle') {
        fail(`${label}: resourceType must be "Bundle".`);
    }

    if (!Array.isArray(payload.entry) || payload.entry.length === 0) {
        fail(`${label}: entry must be a non-empty array.`);
    }
}

function assertHasResource(payload, resourceType, label) {
    const found = payload.entry.some((item) => item && item.resource && item.resource.resourceType === resourceType);
    if (!found) {
        fail(`${label}: missing required resourceType "${resourceType}" in entry.`);
    }
}

function validateTextExample(payload) {
    const label = 'text_symptom_bundle.example.json';
    assertBundleShape(payload, label);
    assertHasResource(payload, 'Observation', label);
    assertHasResource(payload, 'ClinicalImpression', label);
    assertHasResource(payload, 'CarePlan', label);
}

function validateVisualExample(payload) {
    const label = 'visual_review_summary.example.json';
    assertBundleShape(payload, label);
    assertHasResource(payload, 'Observation', label);
    assertHasResource(payload, 'ClinicalImpression', label);
    assertHasResource(payload, 'CarePlan', label);
    assertHasResource(payload, 'Communication', label);
}

function validateDocumentExample(payload) {
    const label = 'document_explainer_summary.example.json';
    assertBundleShape(payload, label);
    assertHasResource(payload, 'Observation', label);
    assertHasResource(payload, 'ClinicalImpression', label);
    assertHasResource(payload, 'CarePlan', label);
    assertHasResource(payload, 'Communication', label);
}

function main() {
    const baseDir = path.join(__dirname, '..', 'examples', 'fhir');
    const textPath = path.join(baseDir, 'text_symptom_bundle.example.json');
    const visualPath = path.join(baseDir, 'visual_review_summary.example.json');
    const documentPath = path.join(baseDir, 'document_explainer_summary.example.json');

    validateTextExample(readJson(textPath));
    validateVisualExample(readJson(visualPath));
    validateDocumentExample(readJson(documentPath));

    console.log('FHIR evidence validation passed for all example payloads.');
}

try {
    main();
} catch (error) {
    console.error('FHIR evidence validation failed.');
    console.error(error.message);
    process.exit(1);
}
