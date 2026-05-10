# FHIR Mapping Evidence Pack

This document maps AetherMed Agentic outputs to FHIR R4-aligned resources as interoperability evidence for hackathon judging.

Scope:
- This is an evidence artifact.
- It does not change runtime behavior.
- It reflects the current output patterns in the backend response pipeline.

## 1) Text Symptom Orchestration Output -> FHIR Bundle

Primary runtime source:
- `backend/tools/tools.js` (`format_response`)
- `backend/agents/responseAgent.js` (adds presentation layer)

Current top-level shape:
- `resourceType: "Bundle"`
- `type: "collection"`
- `identifier`
- `meta`
- `entry[]`

### Mapping Table

| AetherMed Output Field | FHIR Target | Notes |
| --- | --- | --- |
| `bundle.identifier.value` | `Bundle.identifier.value` | Session identifier |
| `bundle.meta.lastUpdated` | `Bundle.meta.lastUpdated` | Processing timestamp |
| `entry[Observation].resource.valueString` | `Observation.valueString` | Patient-reported symptom list |
| `entry[ClinicalImpression].resource.description` | `ClinicalImpression.description` | Triage reason |
| `entry[ClinicalImpression].resource.protocol` | `ClinicalImpression.protocol` | Urgency/risk protocol marker |
| `entry[CarePlan].resource.activity[].detail.description` | `CarePlan.activity.detail.description` | Safety guidance and practical next steps |
| `entry[CarePlan].resource.note[].text` | `CarePlan.note.text` | Safety/disclaimer notes |
| Referral text in CarePlan activity | `ServiceRequest` intent represented inside `CarePlan.activity.detail.kind` | Current implementation uses activity detail with kind hints |
| Optional medication suggestions | `MedicationRequest` entries | Added as separate bundle entries when present |

## 2) Presentation Layer -> Communication-Style Interop

The frontend-facing presentation object currently includes:
- `mainConcernSummary`
- `safeGuidance[]`
- `referralAdvice`
- `finalUserResponse`

FHIR-aligned representation for exchange:
- `Communication` (message-like human-readable guidance)
- Optional `CarePlan.activity` text duplication for downstream systems

This evidence pack includes example JSON showing how this is represented without changing backend routes.

## 3) Visual and Document Flows -> FHIR-Aligned Exchange Examples

Visual and document agent outputs are currently custom structured JSON objects.
For interoperability evidence, this pack includes FHIR-aligned examples:
- `visual_review_summary.example.json`
- `document_explainer_summary.example.json`

These examples use:
- `Bundle`
- `Observation`
- `ClinicalImpression`
- `CarePlan`
- `Communication`

## 4) Why This Strengthens Submission

- Makes standards intent explicit for judges.
- Shows consistent mapping from multi-agent outputs to healthcare exchange artifacts.
- Provides machine-checkable example payloads via `backend/scripts/validateFhirExamples.js`.
