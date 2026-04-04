/**
 * medicalLookup - Simulates a clinical knowledge retriever
 * @param {string} query
 */
async function medicalLookup(query) {
    const database = {
        'chest pain': {
            symptoms: ['pressure', 'tightness', 'radiation to arm'],
            risks: ['Myocardial Infarction', 'Angina', 'Aortic Dissection'],
            protocol: 'High urgency'
        },
        'headache': {
            symptoms: ['throbbing', 'sensitivity to light', 'nausea'],
            risks: ['Migraine', 'Tension Headache', 'Cluster Headache'],
            protocol: 'Moderate urgency'
        }
    };

    const result = database[query.toLowerCase()] || {
        symptoms: ['Generalized symptoms'],
        risks: ['Undetermined'],
        protocol: 'Low urgency'
    };

    return result;
}

module.exports = { medicalLookup };
