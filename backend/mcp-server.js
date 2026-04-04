const express = require('express');
const cors = require('cors');
const { knowledge_lookup, risk_score } = require('./tools/tools');

const app = express();
const PORT = process.env.MCP_PORT || 5001;

app.use(cors());
app.use(express.json());

/**
 * AetherMed MCP Server (Model Context Protocol)
 * This server exposes our internal clinical logic as "Superpowers" 
 * to the Prompt Opinion Agent Registry.
 */

app.post('/mcp/v1/invoke', (req, res) => {
    const { toolName, parameters } = req.body;

    if (!toolName) {
        return res.status(400).json({ error: "toolName is required." });
    }

    try {
        let result;
        
        switch(toolName) {
            case 'knowledge_lookup':
                if (!parameters.symptoms || !Array.isArray(parameters.symptoms)) {
                    return res.status(400).json({ error: "tool 'knowledge_lookup' requires an array of 'symptoms'." });
                }
                result = knowledge_lookup(parameters.symptoms);
                break;
                
            case 'risk_score':
                if (!parameters.severity || !parameters.urgency) {
                    return res.status(400).json({ error: "tool 'risk_score' requires 'severity' and 'urgency'." });
                }
                result = risk_score(parameters.severity, parameters.ageRange || "unknown", parameters.urgency);
                break;
                
            default:
                return res.status(404).json({ error: `Tool ${toolName} not found mapped in MCP server.` });
        }

        return res.json({
            success: true,
            tool: toolName,
            result: result
        });

    } catch (err) {
        console.error("MCP Tool Execution Error:", err);
        return res.status(500).json({ error: "Internal execution failure." });
    }
});

// Future endpoint for Prompt Opinion tool discovery protocol
app.get('/mcp/v1/tools', (req, res) => {
    res.json({
        tools: [
            {
                name: "knowledge_lookup",
                description: "Retrieves known risks and standard protocols for a list of symptoms.",
                parameters: {
                    type: "object",
                    properties: {
                        symptoms: { type: "array", items: { type: "string" } }
                    },
                    required: ["symptoms"]
                }
            },
            {
                name: "risk_score",
                description: "Calculates clinical priority score combining multiple risk factors.",
                parameters: {
                    type: "object",
                    properties: {
                        severity: { type: "string" },
                        ageRange: { type: "string" },
                        urgency: { type: "number" }
                    },
                    required: ["severity", "urgency"]
                }
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`[AetherMed MCP] Superpower API running on port ${PORT}`);
});
