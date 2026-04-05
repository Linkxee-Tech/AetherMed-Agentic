const fs = require('fs');
const path = require('path');

process.env.AETHERMED_AGENT_MODE = 'offline';

const { orchestrate } = require('../orchestrator');

function parseReport(report) {
    const impression = report.entry.find((item) => item.resource.resourceType === 'ClinicalImpression')?.resource;
    const carePlan = report.entry.find((item) => item.resource.resourceType === 'CarePlan')?.resource;
    const referralDescription = carePlan?.activity?.find((item) => item.detail.kind === 'Appointment')?.detail?.description || '';
    const riskMatch = impression?.investigation?.[0]?.item?.[0]?.display?.match(/(\d+)/);
    const referralMatch = referralDescription.match(/Referral to (.*?) at/);
    const presentation = report.presentation || {};

    return {
        urgency: impression?.protocol?.[0] || 'UNKNOWN',
        riskScore: riskMatch ? Number(riskMatch[1]) : 0,
        referralType: referralMatch?.[1] || 'UNKNOWN',
        detectedLanguageCode: presentation.detectedLanguageCode || 'UNKNOWN',
        hasStructuredPresentation: Boolean(
            presentation.detectedLanguage &&
            presentation.riskLevel &&
            presentation.mainConcernSummary &&
            presentation.referralAdvice &&
            presentation.finalUserResponse
        )
    };
}

async function run() {
    const evalFile = path.join(__dirname, '..', 'evals', 'syntheticCases.json');
    const cases = JSON.parse(fs.readFileSync(evalFile, 'utf8'));
    const failures = [];

    console.log('AetherMed synthetic evaluation');
    console.log('Agent mode: offline');

    for (const testCase of cases) {
        const result = await orchestrate({
            ...testCase.input,
            sessionId: `eval-${testCase.id}`
        });

        const summary = parseReport(result.data);
        const pass =
            summary.urgency === testCase.expectations.urgency &&
            summary.referralType === testCase.expectations.referralType &&
            summary.riskScore >= testCase.expectations.minRiskScore &&
            (!testCase.expectations.detectedLanguageCode || summary.detectedLanguageCode === testCase.expectations.detectedLanguageCode) &&
            summary.hasStructuredPresentation;

        if (!pass) {
            failures.push({
                id: testCase.id,
                expected: testCase.expectations,
                actual: summary
            });
        }

        console.log(
            `${pass ? 'PASS' : 'FAIL'} ${testCase.id} | urgency=${summary.urgency} | referral=${summary.referralType} | risk=${summary.riskScore}`
        );
    }

    if (failures.length) {
        console.error('\nSynthetic evaluation failed for the following cases:');
        failures.forEach((failure) => {
            console.error(JSON.stringify(failure, null, 2));
        });
        process.exit(1);
    }

    console.log(`\nAll ${cases.length} synthetic cases passed.`);
}

run().catch((error) => {
    console.error('Synthetic evaluation crashed:', error);
    process.exit(1);
});
