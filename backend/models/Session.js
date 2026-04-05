const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    symptoms: {
        type: String,
        required: true
    },
    data: {
        type: Object, // The strict FHIR R4 Bundle
        required: true
    },
    trace: {
        type: Array, // The detailed A2A agent logic trace
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Session', SessionSchema);
