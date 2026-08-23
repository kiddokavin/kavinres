/* ==========================================================================
   AI-POWERED BUSINESS DECISION SUPPORT SYSTEM - GEMINI API CLIENT & MOCK ENGINE
   ========================================================================== */

const API_KEY_STORAGE_KEY = 'dss_gemini_api_key';
const DEMO_MODE_STORAGE_KEY = 'dss_demo_mode_active';
const DEFAULT_API_KEY = '';

// --- Share Live AI With All Users ---
// Paste your real Gemini API Key here so every visitor automatically uses live AI
const GEMINI_API_KEY = '';

const GeminiAPI = {
  // --- Configuration Helpers ---
  getApiKey() {
    return GEMINI_API_KEY || localStorage.getItem(API_KEY_STORAGE_KEY) || DEFAULT_API_KEY;
  },

  setApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  },

  isDemoMode() {
    const val = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (val === null) {
      // Default to live online mode
      return false;
    }
    return val === 'true';
  },

  setDemoMode(active) {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, active ? 'true' : 'false');
  },

  // --- Network Client Interface ---
  async _callGemini(prompt, systemInstruction = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured. Please add one in Settings.");
    }

    // Try multiple model paths and API versions in order of recommendation
    const endpoints = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent"
    ];

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    let lastError = null;

    for (const baseUrl of endpoints) {
      const url = `${baseUrl}?key=${apiKey}`;
      const modelName = baseUrl.split('/')[5] || 'model';
      const apiVer = baseUrl.split('/')[3] || 'version';
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`Successfully connected to live Gemini API via ${apiVer}/${modelName}`);
            return text;
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || response.statusText;
          lastError = new Error(`Gemini API Error (${apiVer}/${modelName}): ${errMsg}`);
          console.warn(`Endpoint failed: ${apiVer}/${modelName}`, errMsg);
        }
      } catch (err) {
        lastError = err;
        console.warn(`Fetch error for endpoint: ${apiVer}/${modelName}`, err);
      }
    }

    throw lastError || new Error("All live Gemini API endpoints failed to resolve. Check key permissions.");
  },

  // --- High-Level AI Functions ---

  /**
   * Generates a list of suggested criteria for a decision context.
   */
  async getCriteriaSuggestions(decisionTitle, decisionDescription = "") {
    const systemInstruction = "You are a professional business analyst. Output ONLY a valid JSON array of strings containing 4-5 key evaluation criteria names for the given decision context. Keep the criteria brief (1-3 words). Do not include formatting outside of the JSON array.";
    const prompt = `Decision Title: "${decisionTitle}"\nDescription: "${decisionDescription}"\n\nGenerate evaluation criteria. Return as JSON array of strings. Example: ["Criteria A", "Criteria B", "Criteria C"]`;

    const responseText = await this._callGemini(prompt, systemInstruction);
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  },

  /**
   * Generates SWOT and PESTLE analysis for the current decision model state.
   */
  async getSwotPestleAnalysis(decisionState) {
    const stateSummary = JSON.stringify({
      title: decisionState.title,
      description: decisionState.description,
      alternatives: decisionState.alternatives,
      criteria: decisionState.criteria
    });

    const systemInstruction = `You are a Senior Strategic Consultant. Generate a comprehensive SWOT and PESTLE analysis for the decision. 
You must output a valid JSON object matching this exact structure:
{
  "swot": {
    "strengths": ["Item 1", "Item 2"],
    "weaknesses": ["Item 1", "Item 2"],
    "opportunities": ["Item 1", "Item 2"],
    "threats": ["Item 1", "Item 2"]
  },
  "pestle": {
    "political": ["Item 1"],
    "economic": ["Item 1"],
    "social": ["Item 1"],
    "technological": ["Item 1"],
    "legal": ["Item 1"],
    "environmental": ["Item 1"]
  }
}
Output only the JSON. Do not include markdown code fences or explanatory text.`;

    const prompt = `Analyze this decision model state:\n${stateSummary}`;

    const responseText = await this._callGemini(prompt, systemInstruction);
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  },

  /**
   * Simulates decision impacts under specific scenarios and assesses risks.
   */
  async getScenarioAnalysis(decisionState, scenarioName) {
    const stateSummary = JSON.stringify({
      title: decisionState.title,
      alternatives: decisionState.alternatives,
      criteria: decisionState.criteria,
      scores: decisionState.scores,
      weights: decisionState.weights
    });

    const systemInstruction = `You are a risk management consultant. Analyze the alternatives under the scenario "${scenarioName}".
Output a valid JSON object matching this structure:
{
  "scenarioDescription": "A summary of what this scenario means for the decision",
  "alternatives": [
    {
      "name": "Alternative Name",
      "riskLevel": "Low" | "Medium" | "High",
      "impact": "Description of how this alternative is affected by the scenario",
      "mitigation": "Recommended action to mitigate the risk"
    }
  ]
}
Output only the JSON. Do not include markdown code fences or explanatory text.`;

    const prompt = `Decision model state:\n${stateSummary}`;

    const responseText = await this._callGemini(prompt, systemInstruction);
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  },

  /**
   * Collates a conversation thread with the AI Advisor Chat.
   */
  async sendConsultantMessage(decisionState, chatHistory, userMessage) {
    const formattedState = `
DECISION DETAILS:
- Title: ${decisionState.title}
- Description: ${decisionState.description || 'No description provided'}
- Alternatives: ${decisionState.alternatives.join(', ')}
- Criteria Weights: ${JSON.stringify(decisionState.weights)}
- Scores (Alternative -> Criteria -> Score 1-10): ${JSON.stringify(decisionState.scores)}
    `.trim();

    const systemInstruction = `You are a world-class McKinsey & Company Management Consultant acting as a strategic AI Advisor.
Your job is to challenge assumptions, point out biases, critique criteria weights, and guide the user in selecting the best option.
Reference the current state of their decision model. Suggest new alternatives or criteria if you spot gaps.
Keep responses concise, clear, and professional (using bullet points where appropriate). Output in clean markdown.`;

    let contextPrompt = `${formattedState}\n\n`;
    chatHistory.forEach(msg => {
      const role = msg.sender === 'user' ? 'User' : 'Consultant';
      contextPrompt += `${role}: ${msg.text}\n`;
    });
    contextPrompt += `User: ${userMessage}\nConsultant: `;

    return await this._callGemini(contextPrompt, systemInstruction);
  },


  // ==========================================================================
  // --- OFFLINE DEMO MODE MOCK ENGINE (HIGH-FIDELITY IMPLEMENTATIONS) ---
  // ==========================================================================

  _mockCriteriaSuggestions(title) {
    const t = title ? title.toLowerCase() : '';
    if (t.includes('location') || t.includes('headquarter') || t.includes('office')) {
      return ["Tax Incentives", "Talent Availability", "Operating Cost", "Quality of Life", "Infrastructure"];
    } else if (t.includes('database') || t.includes('tech') || t.includes('cloud')) {
      return ["Performance", "Cost Efficiency", "Team Familiarity", "Scalability", "Security & Compliance"];
    } else if (t.includes('hire') || t.includes('candidate') || t.includes('talent')) {
      return ["Technical Skills", "Cultural Fit", "Salary Expectations", "Leadership Potential", "Relevant Experience"];
    } else if (t.includes('market') || t.includes('expand')) {
      return ["Market Size", "Competition Density", "Regulatory Barriers", "Customer Acquisition Cost", "Local Fit"];
    } else {
      return ["Financial Return", "Execution Speed", "Operational Risk", "Customer Impact", "Strategic Alignment"];
    }
  },

  _mockSwotPestle(title) {
    const isHqDecision = title.toLowerCase().includes('location') || title.toLowerCase().includes('headquarter');

    if (isHqDecision) {
      return {
        "swot": {
          "strengths": [
            "Diverse choice of global hubs allows optimization of different dimensions (tax vs. talent).",
            "Clear criteria alignment helps eliminate subjective biases of stakeholders.",
            "Strong executive consensus on objectives (growth vs. cost reduction)."
          ],
          "weaknesses": [
            "Moving or opening a headquarters is highly capital intensive with long break-even times.",
            "Potential friction in relocating core staff members.",
            "High dependency on local regional talent pools."
          ],
          "opportunities": [
            "Relocating offers access to lucrative state-level tax packages and R&D credits.",
            "Builds a stronger, more recognizable employer brand in premium technology centers.",
            "Proximity to key investment groups or major strategic customers."
          ],
          "threats": [
            "Fluctuating commercial real estate rates and inflation trends.",
            "Regulatory policy changes in target regions (e.g., changes to immigration or tax codes).",
            "Talent attrition during the transitional period."
          ]
        },
        "pestle": {
          "political": [
            "Political stability of candidate jurisdictions (e.g., US local politics vs. EU regulations).",
            "Governmental grants, subsidies, and geopolitical trade agreements."
          ],
          "economic": [
            "Regional cost of living indices influencing payroll structures.",
            "Currency exchange rate volatility for international locations like Singapore or Dublin."
          ],
          "social": [
            "Local cultural openness and overall quality of life affecting staff recruitment.",
            "Commute convenience and general lifestyle preferences of modern knowledge workers."
          ],
          "technological": [
            "Availability of reliable high-speed network and data infrastructure.",
            "State of the local technology ecosystem and collaborative research centers."
          ],
          "legal": [
            "Compliance with local labor laws, employment contracts, and termination clauses.",
            "Intellectual property protections and regional data protection acts (e.g., GDPR in Europe)."
          ],
          "environmental": [
            "Carbon offset opportunities and green building compliance standards (LEED certification).",
            "Climate risk vulnerability (e.g., rising sea levels, heatwaves, or severe weather occurrences)."
          ]
        }
      };
    } else {
      // General Fallback Mock
      return {
        "swot": {
          "strengths": [
            "Well-structured objectives alignment.",
            "Strong team backing and clarity of purpose."
          ],
          "weaknesses": [
            "Resource constraints (both financial budget and bandwidth).",
            "Execution complexity."
          ],
          "opportunities": [
            "First-mover advantage in modernizing processes.",
            "Enhanced scalability and operational resilience."
          ],
          "threats": [
            "Market shifts or competitor response during rollout.",
            "Adoption friction from end users."
          ]
        },
        "pestle": {
          "political": ["Potential government compliance shifts."],
          "economic": ["Cost considerations in a high-interest rate economy."],
          "social": ["User sentiment and accessibility considerations."],
          "technological": ["Rapid advancements rendering the choice outdated."],
          "legal": ["Contractual bindings and service level agreements."],
          "environmental": ["Energy efficiency and carbon footprint standards."]
        }
      };
    }
  },

  _mockScenarioRisks(title, scenarioName) {
    const sName = scenarioName.toLowerCase();
    
    let description = `Evaluating alternatives under the "${scenarioName}" scenario, which shifts economic parameters and strategic priorities.`;
    let items = [];

    if (sName.includes('growth') || sName.includes('bull')) {
      description = "A strong market expansion scenario characterized by low interest rates, high capital availability, and intense demand for talent. Priority shifts from saving costs to capturing market share quickly.";
      items = [
        {
          name: "Austin, TX",
          riskLevel: "Medium",
          impact: "Excellent recruitment ground but salaries will inflate rapidly due to high tech demand. Real estate options will tighten.",
          mitigation: "Secure multi-year leases and lock in compensation bands early."
        },
        {
          name: "Singapore",
          riskLevel: "Low",
          impact: "Ideal springboard for massive Asian expansion. Highly efficient business setup permits rapid growth.",
          mitigation: "Partner with local accelerators to bypass administrative bottlenecks."
        },
        {
          name: "Dublin, Ireland",
          riskLevel: "Low",
          impact: "Acts as a stable, highly connected gateway to the EU market. Excellent talent pipelines from global firms.",
          mitigation: "Establish university relations for graduate recruiting."
        }
      ];
    } else if (sName.includes('recession') || sName.includes('bear') || sName.includes('downturn')) {
      description = "An economic contraction scenario. Corporate spending is restricted, funding is tight, and capital must be preserved. Priority shifts heavily towards cost reduction and operational longevity.";
      items = [
        {
          name: "Austin, TX",
          riskLevel: "High",
          impact: "High operating costs and salaries become a major burden. Real estate costs remain elevated.",
          mitigation: "Adopt a hybrid-remote structure to reduce physical footprint needs."
        },
        {
          name: "Singapore",
          riskLevel: "Medium",
          impact: "Strong economic foundation, but general operating costs are extremely high in a recession.",
          mitigation: "Utilize governmental co-investment and wage support schemes."
        },
        {
          name: "Dublin, Ireland",
          riskLevel: "Low",
          impact: "Low corporate tax rate (12.5%) helps shield profits. Broad support from IDA Ireland helps buffer down cycles.",
          mitigation: "Leverage EU funding schemes and tax write-offs for operational cost optimization."
        }
      ];
    } else {
      // Default general scenario
      items = [
        {
          name: "Alternative A",
          riskLevel: "Medium",
          impact: "Subject to moderate supply chain friction and operational tuning issues.",
          mitigation: "Add buffer capacity to timelines and budget."
        },
        {
          name: "Alternative B",
          riskLevel: "Low",
          impact: "High resilience, though initial setup remains slower.",
          mitigation: "Initiate pilot programs to speed up learning curves."
        }
      ];
    }

    return {
      scenarioDescription: description,
      alternatives: items
    };
  },

  _mockConsultantResponse(decisionState, message) {
    const msg = message ? message.toLowerCase() : '';
    let reply = '';
    
    const projectTitle = (decisionState && decisionState.title) ? decisionState.title : 'your business project';
    const alternativesText = (decisionState && decisionState.alternatives && decisionState.alternatives.length > 0)
      ? decisionState.alternatives.map(a => `**${a}**`).join(', ')
      : 'your alternatives';

    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      reply = `### Hello! I am your Strategic AI Advisor.
      
I have analyzed your active project: **"${projectTitle}"**.

Based on your current alternatives (${alternativesText}), I am ready to help you:
* **Critique your weights** to highlight potential evaluation bias.
* **Suggest new criteria** based on industry frameworks.
* **Analyze implementation risks** under growth or recession vectors.

What area of your decision model shall we look at first?`;
    } else if (msg.includes('weight') || msg.includes('critique') || msg.includes('score')) {
      reply = `### Strategic Weights Critique - "${projectTitle}"

Looking at your criteria weights:
* **Focus Check**: High-weight criteria drive your rankings. Ensure your quantitative factors (like costs) do not completely override qualitative goals (like quality of life or scalability).
* **Evaluation Bias**: Heavy skewing towards a single criterion can mask risks. Try running a sensitivity analysis by adjusting your top weight down by 15% to see if the rankings remain stable.
* **Alternative Scores**: Ensure your alternatives' scores are backed by empirical metrics rather than baseline assumptions.`;
    } else if (msg.includes('risk') || msg.includes('scenario') || msg.includes('downturn') || msg.includes('growth')) {
      reply = `### Macro Risk & Stress-Testing - "${projectTitle}"

Evaluating risks for your options (${alternativesText}):
* **Operational Friction**: Launching new business solutions (like databases or office headquarters) always carries setup lags. Buffer your timelines by 10-15%.
* **Regulatory Compliance**: Ensure your overseas or external options are verified against compliance and tax changes.
* **Mitigation Strategy**: Formulate clear mitigation buffers for your top-ranking alternative to protect implementation speed during recession cycles.`;
    } else if (msg.includes('option') || msg.includes('alternative') || msg.includes('suggest')) {
      reply = `### Alternative Sourcing - "${projectTitle}"

Reviewing your options (${alternativesText}):
* **Gap Analysis**: Are there secondary options (like regional partners, hybrid databases, or secondary locations) that could serve as fallbacks?
* **Diversification**: For high-risk decisions, consider splitting operations across two of your alternatives to mitigate regional macro shocks.`;
    } else {
      reply = `### Strategic Advisory - "${projectTitle}"

That is a critical strategic vector. For this decision model, I recommend focusing on:
1. **Data Validation**: Cross-verify alternative scores under each criterion to ensure analytical rigour.
2. **Regime Resilience**: Stress-test your top alternatives under hyper-growth and bear market conditions in the **Scenario Planner**.
3. **Weight Calibration**: Fine-tune your weights to make sure they represent actual executive priorities.`;
    }

    return reply;
  }
};
