/* AI-Powered Business Decision Support System - Application Script */

// --- Global Application State ---
const state = {
    // Active Navigation
    activeTab: 'dashboard',
    
    // Gemini API Configuration
    geminiKey: localStorage.getItem('gemini_api_key') || '',
    isGeminiConnected: false,
    
    // 1. Scenario Planner State
    scenario: {
        price: 150,
        volume: 250,
        unitCost: 60,
        marketing: 5000,
        overhead: 8000,
        charts: {
            breakEven: null,
            projections: null
        }
    },
    
    // 2. MCDA Decider State
    mcda: {
        options: [
            { id: 'opt-1', name: 'Expand Online Store' },
            { id: 'opt-2', name: 'Open Retail Franchise' },
            { id: 'opt-3', name: 'B2B Strategic Partnership' }
        ],
        criteria: [
            { id: 'crit-1', name: 'Revenue Growth', weight: 8 },
            { id: 'crit-2', name: 'Implementation Speed', weight: 5 },
            { id: 'crit-3', name: 'Upfront Capital Cost', weight: 6 }, // Lower cost is rated higher in score
            { id: 'crit-4', name: 'Risk Mitigation', weight: 7 }
        ],
        ratings: {
            // format: 'optId_critId': score (1-10)
            'opt-1_crit-1': 8, 'opt-1_crit-2': 9, 'opt-1_crit-3': 7, 'opt-1_crit-4': 6,
            'opt-2_crit-1': 9, 'opt-2_crit-2': 4, 'opt-2_crit-3': 3, 'opt-2_crit-4': 4,
            'opt-3_crit-1': 6, 'opt-3_crit-2': 7, 'opt-3_crit-3': 8, 'opt-3_crit-4': 8
        },
        chart: null
    },
    
    // 3. SWOT & PESTEL State
    strategy: {
        companyName: 'Apex Solars',
        industry: 'saas',
        scale: 'startup',
        goal: 'SaaS Expansion into Europe',
        competitor: 'Sollux Inc.',
        reportGenerated: false,
        swot: null,
        pestel: null,
        recommendations: []
    },
    
    // 4. Risk Heatmap State
    risks: [
        { id: 'risk-1', name: 'Competitor price undercut', probability: 4, impact: 3, mitigation: 'Introduce a tiered pricing structure, offer premium service add-ons, and run long-term lock-in customer contracts.' },
        { id: 'risk-2', name: 'Regulatory compliance delays', probability: 2, impact: 5, mitigation: 'Consult with legal experts early, build compliance buffers into the timeline, and maintain open channels with regional authorities.' },
        { id: 'risk-3', name: 'Customer acquisition cost spike', probability: 3, impact: 4, mitigation: 'Optimize organic marketing funnels, build referral partnerships, and focus on customer retention metrics (LTV).' }
    ],
    selectedRiskId: null,
    
    // 5. Chat Advisor History
    chatHistory: [
        { role: 'system', message: 'Hello! I am your AI Business Advisor. I can analyze simulated scenarios, check decision matrices, examine SWOT outputs, and answer custom business strategy queries.\n\n*Notice: Connecting a Gemini API Key enables unbounded natural language reasoning. Click the status button in the top right header to connect a key.*' }
    ]
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialise Lucide icons
    lucide.createIcons();
    
    // Initialise Navigation Router
    initRouter();
    
    // Initialise API Settings Modal
    initAPIModal();
    
    // Initialize Dashboard Aggregations
    updateDashboardAggregations();
    
    // 1. Setup Scenario Planner
    initScenarioPlanner();
    
    // 2. Setup MCDA Matrix
    initMCDA();
    
    // 3. Setup SWOT Strategy
    initSWOT();
    
    // 4. Setup Risk Heatmap
    initRiskHeatmap();
    
    // 5. Setup AI Chat Advisor
    initAIAdvisor();
    
    // Setup Global Export Button
    document.getElementById('btn-export-all').addEventListener('click', exportFullDecisionReport);
});

// --- Routing & Tab Management ---
function initRouter() {
    // Check initial hash
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'scenario', 'mcda', 'swot', 'risk', 'advisor'].includes(hash)) {
        showTab(hash);
    } else {
        showTab('dashboard');
    }
    
    // Navigation item click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            window.location.hash = tab;
            showTab(tab);
        });
    });
    
    // Mobile Sidebar controls
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn && closeBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
}

function showTab(tabId) {
    state.activeTab = tabId;
    
    // Update active nav links
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update active panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        if (panel.id === `panel-${tabId}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
    
    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    
    // Update Header Title
    const pageTitles = {
        'dashboard': 'Dashboard Overview',
        'scenario': 'Scenario Simulator & Forecaster',
        'mcda': 'Multi-Criteria Decision Matrix (MCDA)',
        'swot': 'SWOT & PESTEL Strategy Builder',
        'risk': 'Risk Assessment Heatmap Matrix',
        'advisor': 'AI Business Consultant Chatbot'
    };
    
    document.getElementById('active-panel-title').innerText = pageTitles[tabId] || 'Dashboard';
    
    // Trigger module-specific redraws/resizes
    if (tabId === 'scenario') {
        setTimeout(renderScenarioCharts, 100);
    } else if (tabId === 'mcda') {
        setTimeout(renderMCDAChart, 100);
    } else if (tabId === 'risk') {
        setTimeout(renderRiskMatrixGrid, 100);
    }
    
    // Update general dashboard summaries on visit dashboard
    if (tabId === 'dashboard') {
        updateDashboardAggregations();
    }
}

// --- Gemini API Connections & Settings ---
function initAPIModal() {
    const modal = document.getElementById('api-modal');
    const trigger = document.getElementById('api-modal-trigger');
    const triggerLink = document.getElementById('btn-trigger-settings-link');
    const closeBtn = document.getElementById('api-modal-close');
    const saveBtn = document.getElementById('btn-save-key');
    const clearBtn = document.getElementById('btn-clear-key');
    const keyInput = document.getElementById('input-gemini-key');
    
    // Show modal
    const openModal = () => {
        keyInput.value = state.geminiKey;
        document.getElementById('key-test-result').classList.add('hidden');
        modal.classList.remove('hidden');
    };
    
    trigger.addEventListener('click', openModal);
    if (triggerLink) triggerLink.addEventListener('click', openModal);
    
    // Hide modal
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Close on click outside box
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
    
    // Save API Key
    saveBtn.addEventListener('click', async () => {
        const key = keyInput.value.trim();
        const alertBox = document.getElementById('key-test-result');
        alertBox.className = 'modal-status-alert';
        alertBox.innerHTML = '<span class="typing-bubble-wrap"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span> Validating Key...';
        alertBox.classList.remove('hidden');
        
        if (!key) {
            alertBox.classList.add('error');
            alertBox.innerText = 'Please enter a valid key.';
            return;
        }
        
        // Test connection
        try {
            const isConnected = await testGeminiConnection(key);
            if (isConnected) {
                state.geminiKey = key;
                localStorage.setItem('gemini_api_key', key);
                state.isGeminiConnected = true;
                updateAPIStatusUI(true);
                alertBox.classList.add('success');
                alertBox.innerText = 'Connection Established Successfully! Key saved.';
                setTimeout(() => modal.classList.add('hidden'), 1500);
            } else {
                throw new Error('Key validation failed.');
            }
        } catch (err) {
            alertBox.classList.add('error');
            alertBox.innerText = 'Could not establish connection. Please check API Key correctness and network status.';
        }
    });
    
    // Clear API Key
    clearBtn.addEventListener('click', () => {
        state.geminiKey = '';
        localStorage.removeItem('gemini_api_key');
        state.isGeminiConnected = false;
        keyInput.value = '';
        updateAPIStatusUI(false);
        const alertBox = document.getElementById('key-test-result');
        alertBox.className = 'modal-status-alert success';
        alertBox.innerText = 'Key removed from browser memory.';
        alertBox.classList.remove('hidden');
        setTimeout(() => modal.classList.add('hidden'), 1000);
    });
    
    // Auto-check on load if key exists
    if (state.geminiKey) {
        testGeminiConnection(state.geminiKey).then(connected => {
            state.isGeminiConnected = connected;
            updateAPIStatusUI(connected);
        });
    }
}

async function testGeminiConnection(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            return data && data.name ? true : false;
        }
        return false;
    } catch (e) {
        console.error('API Test Error:', e);
        return false;
    }
}

function updateAPIStatusUI(isConnected) {
    const dot = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    const notice = document.getElementById('gemini-notice');
    
    if (isConnected) {
        dot.className = 'status-indicator-dot green';
        text.innerText = 'Gemini AI Connected';
        if (notice) notice.classList.add('hidden');
    } else {
        dot.className = 'status-indicator-dot red';
        text.innerText = 'Gemini AI Offline';
        if (notice) notice.classList.remove('hidden');
    }
    updateDashboardAggregations();
}

// --- 1. Scenario Simulator & Forecaster Engine ---
function initScenarioPlanner() {
    const sliders = ['price', 'volume', 'unit-cost', 'marketing', 'overhead'];
    
    sliders.forEach(s => {
        const sliderInput = document.getElementById(`slider-${s}`);
        const displayVal = document.getElementById(`val-${s}`);
        
        // Input Listener
        sliderInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            
            // Format Displays
            if (s === 'volume') {
                displayVal.innerText = `${val.toLocaleString()} units`;
            } else if (s === 'marketing' || s === 'overhead') {
                displayVal.innerText = `$${val.toLocaleString()}`;
            } else {
                displayVal.innerText = `$${val}`;
            }
            
            // Save state
            const stateProp = s === 'unit-cost' ? 'unitCost' : s;
            state.scenario[stateProp] = val;
            
            // Run Calculations
            runScenarioCalculations();
        });
    });
    
    // Initial Calc
    runScenarioCalculations();
}

function runScenarioCalculations() {
    const s = state.scenario;
    
    // Basic metrics
    const monthlyRevenue = s.price * s.volume;
    const variableCosts = s.unitCost * s.volume;
    const totalCosts = variableCosts + s.overhead + s.marketing;
    const netProfit = monthlyRevenue - totalCosts;
    
    // Margin details
    const contributionMarginPerUnit = s.price - s.unitCost;
    const contributionMarginRatio = s.price > 0 ? (contributionMarginPerUnit / s.price) : 0;
    
    // Break-even
    let breakEvenVolume = 0;
    if (contributionMarginPerUnit > 0) {
        breakEvenVolume = Math.ceil((s.overhead + s.marketing) / contributionMarginPerUnit);
    }
    const breakEvenRevenue = breakEvenVolume * s.price;
    
    // Margin of safety
    let marginOfSafetyPct = 0;
    if (s.volume > breakEvenVolume && s.volume > 0) {
        marginOfSafetyPct = ((s.volume - breakEvenVolume) / s.volume) * 100;
    }
    
    // Marketing ROMS (Return on Marketing Spend)
    // Formula: (Revenue - Marketing) / Marketing (if Marketing > 0)
    let marketingRoms = 0;
    if (s.marketing > 0) {
        marketingRoms = ((monthlyRevenue - variableCosts) / s.marketing) * 100;
    }
    
    // Profit margin percentage
    const profitMarginPct = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;
    
    // Render outputs to DOM
    document.getElementById('calc-revenue').innerText = `$${Math.round(monthlyRevenue).toLocaleString()}`;
    const profitEl = document.getElementById('calc-profit');
    profitEl.innerText = `${netProfit >= 0 ? '' : '-'}$${Math.abs(Math.round(netProfit)).toLocaleString()}`;
    profitEl.className = `sub-metric-val ${netProfit >= 0 ? 'emerald-text' : 'error-text'}`;
    
    document.getElementById('calc-margin-ratio').innerText = `${Math.round(contributionMarginRatio * 100)}%`;
    document.getElementById('calc-breakeven').innerText = `${breakEvenVolume.toLocaleString()} units ($${Math.round(breakEvenRevenue).toLocaleString()})`;
    
    // Render charts
    renderScenarioCharts();
}

function renderScenarioCharts() {
    if (state.activeTab !== 'scenario') return;
    
    const s = state.scenario;
    
    // Plot variables
    const maxVolumePlot = s.volume * 2;
    const breakEvenVolume = s.price > s.unitCost ? Math.ceil((s.overhead + s.marketing) / (s.price - s.unitCost)) : 0;
    
    // CHART 1: Break-even Analysis Chart
    const ctxBE = document.getElementById('break-even-chart').getContext('2d');
    
    // Generate scale values
    const volumePoints = [];
    const revenuePoints = [];
    const costPoints = [];
    
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
        const v = Math.round((maxVolumePlot / steps) * i);
        volumePoints.push(v);
        revenuePoints.push(v * s.price);
        costPoints.push((v * s.unitCost) + s.overhead + s.marketing);
    }
    
    if (s.charts.breakEven) {
        s.charts.breakEven.destroy();
    }
    
    s.charts.breakEven = new Chart(ctxBE, {
        type: 'line',
        data: {
            labels: volumePoints,
            datasets: [
                {
                    label: 'Total Revenue ($)',
                    data: revenuePoints,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'Total Costs ($)',
                    data: costPoints,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 2,
                    pointRadius: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#d1d5db' } }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Volume (Units)', color: '#6b7280' },
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: 'Amount ($)', color: '#6b7280' },
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
    
    // CHART 2: 12-Month Accumulation Chart
    const ctxProj = document.getElementById('projections-chart').getContext('2d');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRev = s.price * s.volume;
    const monthlyCost = (s.unitCost * s.volume) + s.overhead + s.marketing;
    const monthlyNet = monthlyRev - monthlyCost;
    
    const cumulativeProfits = [];
    let currentCumulative = 0;
    
    for (let m = 0; m < 12; m++) {
        currentCumulative += monthlyNet;
        cumulativeProfits.push(currentCumulative);
    }
    
    if (s.charts.projections) {
        s.charts.projections.destroy();
    }
    
    s.charts.projections = new Chart(ctxProj, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Cumulative Profit/Loss ($)',
                    type: 'line',
                    data: cumulativeProfits,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Monthly Net Margin ($)',
                    data: Array(12).fill(monthlyNet),
                    backgroundColor: monthlyNet >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#d1d5db' } }
            },
            scales: {
                x: {
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: 'Amount ($)', color: '#6b7280' },
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

// --- 2. Multi-Criteria Decision Matrix (MCDA) Engine ---
function initMCDA() {
    // Add event listeners for options and criteria add buttons
    document.getElementById('btn-add-option').addEventListener('click', addMCDAOption);
    document.getElementById('btn-add-criteria').addEventListener('click', addMCDACriteria);
    
    renderMCDASettings();
    calculateMCDAMatrix();
}

function renderMCDASettings() {
    const optionsContainer = document.getElementById('mcda-options-list');
    const criteriaContainer = document.getElementById('mcda-criteria-list');
    
    // Render Options
    optionsContainer.innerHTML = '';
    state.mcda.options.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.className = 'mcda-row-item';
        row.innerHTML = `
            <input type="text" class="form-control" value="${opt.name}" data-opt-id="${opt.id}">
            <button class="btn-remove-row" data-opt-id="${opt.id}" aria-label="Remove option">
                <i data-lucide="trash-2" class="icon-sm"></i>
            </button>
        `;
        
        // Listeners for text input
        row.querySelector('input').addEventListener('change', (e) => {
            opt.name = e.target.value.trim() || `Option ${idx + 1}`;
            calculateMCDAMatrix();
        });
        
        // Listener for remove button
        row.querySelector('.btn-remove-row').addEventListener('click', () => {
            if (state.mcda.options.length <= 2) {
                alert('You must have at least 2 options to compare.');
                return;
            }
            state.mcda.options = state.mcda.options.filter(o => o.id !== opt.id);
            renderMCDASettings();
            calculateMCDAMatrix();
        });
        
        optionsContainer.appendChild(row);
    });
    
    // Render Criteria
    criteriaContainer.innerHTML = '';
    state.mcda.criteria.forEach((crit, idx) => {
        const row = document.createElement('div');
        row.className = 'mcda-row-item';
        row.innerHTML = `
            <input type="text" class="form-control" value="${crit.name}" data-crit-id="${crit.id}">
            <div class="criteria-weight-subrow">
                <input type="range" min="1" max="10" value="${crit.weight}" class="custom-slider" data-crit-id="${crit.id}">
                <span class="criteria-weight-val">${crit.weight}</span>
            </div>
            <button class="btn-remove-row" data-crit-id="${crit.id}" aria-label="Remove criteria">
                <i data-lucide="trash-2" class="icon-sm"></i>
            </button>
        `;
        
        // Text changes
        row.querySelector('input[type="text"]').addEventListener('change', (e) => {
            crit.name = e.target.value.trim() || `Criterion ${idx + 1}`;
            calculateMCDAMatrix();
        });
        
        // Weight changes
        const weightSlider = row.querySelector('input[type="range"]');
        const weightVal = row.querySelector('.criteria-weight-val');
        weightSlider.addEventListener('input', (e) => {
            const w = parseInt(e.target.value);
            crit.weight = w;
            weightVal.innerText = w;
            calculateMCDAMatrix();
        });
        
        // Remove Criteria
        row.querySelector('.btn-remove-row').addEventListener('click', () => {
            if (state.mcda.criteria.length <= 2) {
                alert('You must have at least 2 criteria to run matrix calculations.');
                return;
            }
            state.mcda.criteria = state.mcda.criteria.filter(c => c.id !== crit.id);
            renderMCDASettings();
            calculateMCDAMatrix();
        });
        
        criteriaContainer.appendChild(row);
    });
    
    lucide.createIcons();
}

function addMCDAOption() {
    const nextId = `opt-${Date.now()}`;
    state.mcda.options.push({
        id: nextId,
        name: `New Option Option ${state.mcda.options.length + 1}`
    });
    
    // Add default scores for the new option
    state.mcda.criteria.forEach(crit => {
        state.mcda.ratings[`${nextId}_${crit.id}`] = 5; // default score
    });
    
    renderMCDASettings();
    calculateMCDAMatrix();
}

function addMCDACriteria() {
    const nextId = `crit-${Date.now()}`;
    state.mcda.criteria.push({
        id: nextId,
        name: `New Criteria ${state.mcda.criteria.length + 1}`,
        weight: 5
    });
    
    // Add default scores
    state.mcda.options.forEach(opt => {
        state.mcda.ratings[`${opt.id}_${nextId}`] = 5;
    });
    
    renderMCDASettings();
    calculateMCDAMatrix();
}

function calculateMCDAMatrix() {
    const o = state.mcda.options;
    const c = state.mcda.criteria;
    const r = state.mcda.ratings;
    
    // RENDER MATRIX TABLE INPUTS
    const table = document.getElementById('mcda-matrix-table');
    table.innerHTML = '';
    
    // 1. Generate Headers
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Strategic Option</th>';
    c.forEach(crit => {
        headerRow.innerHTML += `<th>${crit.name} <span class="purple-text">(w: ${crit.weight})</span></th>`;
    });
    table.appendChild(headerRow);
    
    // 2. Generate Rows for Options
    o.forEach(opt => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><strong>${opt.name}</strong></td>`;
        
        c.forEach(crit => {
            const ratingKey = `${opt.id}_${crit.id}`;
            const ratingVal = r[ratingKey] !== undefined ? r[ratingKey] : 5;
            
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="number" min="1" max="10" value="${ratingVal}" class="matrix-score-input" data-rating-key="${ratingKey}">`;
            
            // Listen to score rating updates
            cell.querySelector('input').addEventListener('change', (e) => {
                let v = parseInt(e.target.value);
                if (isNaN(v)) v = 5;
                if (v < 1) v = 1;
                if (v > 10) v = 10;
                e.target.value = v;
                
                state.mcda.ratings[ratingKey] = v;
                runMCDAWiseMath();
            });
            
            row.appendChild(cell);
        });
        table.appendChild(row);
    });
    
    runMCDAWiseMath();
}

function runMCDAWiseMath() {
    const o = state.mcda.options;
    const c = state.mcda.criteria;
    const r = state.mcda.ratings;
    
    // Calculate total weights
    const totalWeights = c.reduce((sum, item) => sum + item.weight, 0);
    
    // Calculate scores for each option
    const results = o.map(opt => {
        let weightedSum = 0;
        c.forEach(crit => {
            const rating = r[`${opt.id}_${crit.id}`] !== undefined ? r[`${opt.id}_${crit.id}`] : 5;
            weightedSum += rating * crit.weight;
        });
        
        // Normalize out of 100
        const finalScore = totalWeights > 0 ? ((weightedSum / (totalWeights * 10)) * 100) : 0;
        
        return {
            id: opt.id,
            name: opt.name,
            score: Math.round(finalScore * 10) / 10
        };
    });
    
    // Sort Rankings
    const ranked = [...results].sort((a, b) => b.score - a.score);
    
    // Render Recommended option
    const winnerBox = document.getElementById('mcda-winner-box');
    const winnerNameEl = document.getElementById('mcda-winner-name');
    const winnerDescEl = document.getElementById('mcda-winner-desc');
    
    if (ranked.length > 0) {
        const winner = ranked[0];
        winnerNameEl.innerText = winner.name;
        winnerDescEl.innerText = `Scored highest with a total weighted index of ${winner.score}%. This recommendation is calculated by evaluating all user input ratings adjusted for specific strategic weights.`;
    } else {
        winnerNameEl.innerText = 'N/A';
        winnerDescEl.innerText = 'Add options and criteria ratings to evaluate scores.';
    }
    
    // Render Rankings List
    const rankingsList = document.getElementById('mcda-rankings-list');
    rankingsList.innerHTML = '';
    
    ranked.forEach((item, idx) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'rank-item';
        itemRow.innerHTML = `
            <span class="rank-badge">#${idx + 1}</span>
            <span class="rank-name">${item.name}</span>
            <span class="rank-score">${item.score}%</span>
        `;
        rankingsList.appendChild(itemRow);
    });
    
    // Refresh comparison chart
    renderMCDAChart(results);
    
    // Sync to state to expose to dashboard
    state.mcda.winnerName = ranked[0] ? ranked[0].name : 'N/A';
    state.mcda.winnerScore = ranked[0] ? `${ranked[0].score}%` : 'N/A';
}

function renderMCDAChart(resultsData = null) {
    if (state.activeTab !== 'mcda') return;
    
    // Get results if not provided
    let results = resultsData;
    if (!results) {
        const o = state.mcda.options;
        const c = state.mcda.criteria;
        const r = state.mcda.ratings;
        const totalWeights = c.reduce((sum, item) => sum + item.weight, 0);
        
        results = o.map(opt => {
            let weightedSum = 0;
            c.forEach(crit => {
                const rating = r[`${opt.id}_${crit.id}`] !== undefined ? r[`${opt.id}_${crit.id}`] : 5;
                weightedSum += rating * crit.weight;
            });
            const finalScore = totalWeights > 0 ? ((weightedSum / (totalWeights * 10)) * 100) : 0;
            return {
                id: opt.id,
                name: opt.name,
                score: Math.round(finalScore * 10) / 10
            };
        });
    }
    
    const ctx = document.getElementById('mcda-chart').getContext('2d');
    
    if (state.mcda.chart) {
        state.mcda.chart.destroy();
    }
    
    state.mcda.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.map(item => item.name),
            datasets: [{
                label: 'Weighted Score (%)',
                data: results.map(item => item.score),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(6, 182, 212, 0.6)'
                ],
                borderColor: [
                    '#6366f1',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#06b6d4'
                ],
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { color: '#d1d5db' },
                    grid: { display: false }
                }
            }
        }
    });
}

// --- 3. SWOT & PESTEL Strategy Engine ---
function initSWOT() {
    // Form trigger
    document.getElementById('btn-generate-swot').addEventListener('click', runStrategicReportGenerator);
    
    // Copy trigger
    document.getElementById('btn-export-swot').addEventListener('click', copyStrategicReportToClipboard);
    
    // Tabs Navigation Inside SWOT Panel
    document.querySelectorAll('.swot-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.swot-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.swot-tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const contentId = btn.getAttribute('data-swot-tab');
            document.getElementById(contentId).classList.add('active');
        });
    });
}

async function runStrategicReportGenerator() {
    // Load metadata
    const name = document.getElementById('swot-company-name').value.trim() || 'Apex Solars';
    const industry = document.getElementById('swot-industry').value;
    const scale = document.getElementById('swot-scale').value;
    const goal = document.getElementById('swot-focus').value.trim() || 'European Expansion';
    const competitor = document.getElementById('swot-competitor').value.trim() || 'Sollux Inc.';
    
    // Update local state
    state.strategy.companyName = name;
    state.strategy.industry = industry;
    state.strategy.scale = scale;
    state.strategy.goal = goal;
    state.strategy.competitor = competitor;
    
    // Visual button states
    const btn = document.getElementById('btn-generate-swot');
    const btnText = document.getElementById('generate-swot-btn-text');
    
    btn.disabled = true;
    btnText.innerText = 'Running AI Core...';
    
    if (state.isGeminiConnected && state.geminiKey) {
        // Run Real Gemini API
        try {
            await generateAIStrategicReport(name, industry, scale, goal, competitor);
        } catch (e) {
            console.error('Gemini SWOT Error, falling back to local heuristics:', e);
            generateLocalStrategicReport(name, industry, scale, goal, competitor);
        }
    } else {
        // Run Local Rule Engine
        await new Promise(resolve => setTimeout(resolve, 800)); // mock loading latency
        generateLocalStrategicReport(name, industry, scale, goal, competitor);
    }
    
    // Render to DOM
    renderStrategicReportDOM();
    
    // Re-enable buttons
    btn.disabled = false;
    btnText.innerText = 'Generate Strategic Report';
    document.getElementById('btn-export-swot').disabled = false;
    state.strategy.reportGenerated = true;
}

function generateLocalStrategicReport(name, industry, scale, goal, competitor) {
    // Advanced heuristic dictionary mapping industry to strategic matrices
    const database = {
        saas: {
            strengths: [
                'Predictable Monthly Recurring Revenue (MRR) structures.',
                'High gross margins (80%+) and zero incremental manufacturing costs.',
                'Instant worldwide updates and scalable cloud infrastructure.'
            ],
            weaknesses: [
                'High initial Customer Acquisition Costs (CAC) spikes.',
                'Direct dependence on digital server availability & security.',
                'High subscriber churn sensitivity.'
            ],
            opportunities: [
                'Enterprise API integration offerings to secure enterprise contracts.',
                'AI features premium upselling to existing subscribers.',
                'Expand to new geographic regions with localized billing structures.'
            ],
            threats: [
                'Intense competition from low-cost alternative copycats.',
                'GDPR, HIPAA, and international data privacy regulations shifts.',
                `Pricing pressure from direct competitor ${competitor}.`
            ],
            political: `SaaS operations planning ${goal} are highly impacted by data sovereignty laws. Political tension regarding privacy policies between US, EU and Asian nations could force regional storage configurations.`,
            economic: `High inflation pressures could shrink discretionary software spend. The corporate focus shifts from massive software expansion budgets to strict cost consolidation.`,
            social: `High social trust in cloud-based collaborative solutions drives adoption. Remote operations workflows have normalized software-as-a-service models globally.`,
            technological: `Fast-moving developments in LLMs and AI services require continuous updates. Standard SaaS architectures without AI cores face rapid obsolescence.`,
            environmental: `Cloud data centers produce carbon emissions. Companies focusing on carbon neutrality are demanding carbon footprints declarations from tech vendors.`,
            legal: `Severe regulatory checks (e.g. EU GDPR violations) carry penalties of up to 4% of global turnover. Data residency regulations require localized storage pipelines.`
        },
        ecommerce: {
            strengths: [
                'Low overhead costs compared to brick-and-mortar operations.',
                'Direct customer relationship data tracking.',
                'Dynamic pricing adjustment strategies.'
            ],
            weaknesses: [
                'High logistics, sorting, and fulfillment overheads.',
                'Zero real face-to-face community interaction touchpoints.',
                'High return rates on apparel/retail purchases.'
            ],
            opportunities: [
                'Omnichannel integration with local partner pickup zones.',
                'Hyper-targeted loyalty reward programmes.',
                'Social commerce integrations (TikTok Shop, Instagram).'
            ],
            threats: [
                'Supply chain shipment interruptions at ports.',
                'Ad spending cost increases reducing digital margins.',
                `Customer price comparisons pushing traffic to ${competitor}.`
            ],
            political: `Trade tariffs and customs rules directly impact supply chain sourcing costs. Customs backlogs represent political bottlenecks for global supply lines.`,
            economic: `Consumer discretionary income volatility impacts product demand. Supply chain fuel prices increase logistics overheads.`,
            social: `Social push for instant next-day delivery convenience. Higher expectations for ethical sourcing and package recycling options.`,
            technological: `Personalized recommendation algorithms and visual AI search increase conversion metrics. Mobile application optimization remains the primary growth driver.`,
            environmental: `Packaging materials waste is a growing concern. Carbon emissions from courier operations are forcing fleet electrification investments.`,
            legal: `Consumer protection laws dictate transparent return policies and refund systems. Tax reporting rules on e-commerce sales continue to tighten globally.`
        },
        hardware: {
            strengths: [
                'Hard intellectual property (patented mechanical/digital structures).',
                'Tangible product value proposition for industrial use cases.',
                'Custom firmware locking in client software contracts.'
            ],
            weaknesses: [
                'High upfront tooling, silicon, and manufacturing capital capital.',
                'Complex inventory storage and stock forecasting models.',
                'Hardware bugs cannot be instantly hotfixed in the field.'
            ],
            opportunities: [
                'Shift to Hardware-as-a-Service (HaaS) models with recurring fees.',
                'Industrial IoT expansions in automated warehousing.',
                'Strategic components sourcing localization.'
            ],
            threats: [
                'Global silicon and semiconductor shortage delays.',
                'Patent infringements in regions with weak IP laws.',
                `Alternative hardware components released by ${competitor}.`
            ],
            political: `Chip embargoes and strategic tech export blocks (e.g. between US and China) can instantly halt manufacturing partnerships or component sourcing.`,
            economic: `Fluctuating raw material prices (copper, lithium, rare earth metals) squeeze prototype unit margins. Capital funding cycles impact hardware tooling investments.`,
            social: `Growing social consciousness regarding electronic waste (e-waste). Shift towards repairability over complete product disposal.`,
            technological: `Advanced microcontrollers enable edge-computing capabilities. Slower silicon advances are offset by smart onboard firmware optimizations.`,
            environmental: `Mining of heavy metals for batteries is under strict environmental audit. Hardware manufacturers must establish recycling take-back pipelines.`,
            legal: `Rigid electrical certifications (CE, FCC, RoHS) are mandatory for public distribution. Product liability rules are very strict for battery safety.`
        },
        healthcare: {
            strengths: [
                'High switching costs for clinic software systems.',
                'Inelastic demand; healthcare spend remains a top public priority.',
                'Mission-critical nature prevents easy termination of service.'
            ],
            weaknesses: [
                'Extremely long enterprise sales cycles (6 to 18 months).',
                'Legacy integration requirements with ancient hospital networks.',
                'Liability risk in case of software calculation errors.'
            ],
            opportunities: [
                'AI diagnostic assist modules integrated into doctor terminals.',
                'Telehealth outreach in remote regional markets.',
                'Integrate wearable consumer data pipelines.'
            ],
            threats: [
                'High-profile data breaches exposing sensitive health information.',
                'Complex state-level public healthcare system billing changes.',
                `New diagnostic software approvals by ${competitor}.`
            ],
            political: `Government funding allocations determine hospital software budgets. Political elections can reshape national health insurance frameworks overnight.`,
            economic: `Rising operational expenses in hospitals restrict capital purchases. Medical labor shortages place software focus on efficiency-enabling tools.`,
            social: `An aging global population increases chronic care management needs. Rising trust in remote healthcare access options.`,
            technological: `Predictive models for early disease detection and electronic record automated indexing save thousands of administrative hours.`,
            environmental: `Medical waste disposal audits. Carbon footprints of physical hospital complexes force digital diagnostic solutions.`,
            legal: `HIPAA, HITECH, and medical regulations carry millions in statutory fines for patient data exposure. Compliance is the primary barrier to entry.`
        },
        manufacturing: {
            strengths: [
                'High production capacity barriers preventing simple copycats.',
                'Long-term client supply chain lock-ins.',
                'High operational efficiency via industrial automation.'
            ],
            weaknesses: [
                'Extremely high capital asset depreciation rates.',
                'Operational bottleneck risks (one machine breakdown halts plant).',
                'High energy consumption overhead dependency.'
            ],
            opportunities: [
                'Shift to smart factories (Industry 4.0 IoT telemetry).',
                'Custom, low-volume additive manufacturing client services.',
                'Green energy storage transition to reduce grid reliance.'
            ],
            threats: [
                'Power grid cost inflation squeezing production margins.',
                'Labor union disputes or skilled machinist talent shortage.',
                `Global supply competition and price wars driven by ${competitor}.`
            ],
            political: `Domestic subsidies for localized manufacturing push companies away from offshore sites. Trade tariff adjustments impact global pricing structures.`,
            economic: `Global supply chain shipping freight rate fluctuations directly impact raw material costs. Capital interest rates impact factory expansion borrowing.`,
            social: `Industrial safety audits and labor protection standards. Social pressure on factory emissions and community impact reports.`,
            technological: `Collaborative robots (cobots), predictive maintenance sensors, and automated optical inspection systems maximize plant efficiency.`,
            environmental: `Strict carbon emission cap regulations, wastewater management restrictions, and green energy sourcing demands.`,
            legal: `OSHA safety requirements carry heavy penalties for factory hazards. Strict pollution liability rules define industrial operating scopes.`
        }
    };
    
    const industryData = database[industry] || database.saas;
    
    // Actions Builder based on SWOT matching
    const recommendations = [
        {
            title: `Maximize Strengths to Achieve ${goal}`,
            text: `Leverage your primary strength: "${industryData.strengths[0]}" to buffer against market entry friction. Deploy this core advantage directly in your marketing collateral to counter ${competitor}.`
        },
        {
            title: `Neutralize Weaknesses in Operations`,
            text: `Acknowledge that "${industryData.weaknesses[0]}" presents your primary operating bottleneck. Establish risk netting reserves (such as legal buffers or CAC reduction loops) before scaling.`
        },
        {
            title: `Capture Emerging Market Opportunities`,
            text: `Formulate a project plan targeting: "${industryData.opportunities[0]}". This serves as a high-potential vector to realize your goal of ${goal}.`
        }
    ];
    
    state.strategy.swot = {
        strengths: industryData.strengths,
        weaknesses: industryData.weaknesses,
        opportunities: industryData.opportunities,
        threats: industryData.threats
    };
    
    state.strategy.pestel = {
        political: industryData.political,
        economic: industryData.economic,
        social: industryData.social,
        technological: industryData.technological,
        environmental: industryData.environmental,
        legal: industryData.legal
    };
    
    state.strategy.recommendations = recommendations;
}

async function generateAIStrategicReport(name, industry, scale, goal, competitor) {
    const prompt = `You are an elite enterprise strategy consultant. Please build a SWOT Matrix, a PESTEL Analysis, and an Actionable Strategic Plan for a company with the following characteristics:
    - Company Name: ${name}
    - Industry Segment: ${industry} (Scale: ${scale})
    - Core Strategic Goal: ${goal}
    - Key Competitor/Threat: ${competitor}
    
    Please respond ONLY with a valid JSON object matching the following structure. Do not wrap in markdown blocks, do not add explanation text:
    {
      "swot": {
        "strengths": ["string1", "string2", "string3"],
        "weaknesses": ["string1", "string2", "string3"],
        "opportunities": ["string1", "string2", "string3"],
        "threats": ["string1", "string2", "string3"]
      },
      "pestel": {
        "political": "sentence summary",
        "economic": "sentence summary",
        "social": "sentence summary",
        "technological": "sentence summary",
        "environmental": "sentence summary",
        "legal": "sentence summary"
      },
      "recommendations": [
        { "title": "Recommendation 1 Title", "text": "Detailed recommendation details..." },
        { "title": "Recommendation 2 Title", "text": "Detailed recommendation details..." },
        { "title": "Recommendation 3 Title", "text": "Detailed recommendation details..." }
      ]
    }`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        })
    });
    
    if (!response.ok) throw new Error('API request failed');
    
    const resData = await response.json();
    const cleanText = resData.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(cleanText);
    
    state.strategy.swot = parsedData.swot;
    state.strategy.pestel = parsedData.pestel;
    state.strategy.recommendations = parsedData.recommendations;
}

function renderStrategicReportDOM() {
    const s = state.strategy;
    if (!s.swot) return;
    
    // Strengths
    const strengthsContainer = document.getElementById('swot-strengths-list');
    strengthsContainer.innerHTML = '';
    s.swot.strengths.forEach(str => {
        strengthsContainer.innerHTML += `<li>${str}</li>`;
    });
    
    // Weaknesses
    const weaknessesContainer = document.getElementById('swot-weaknesses-list');
    weaknessesContainer.innerHTML = '';
    s.swot.weaknesses.forEach(wk => {
        weaknessesContainer.innerHTML += `<li>${wk}</li>`;
    });
    
    // Opportunities
    const opportunitiesContainer = document.getElementById('swot-opportunities-list');
    opportunitiesContainer.innerHTML = '';
    s.swot.opportunities.forEach(op => {
        opportunitiesContainer.innerHTML += `<li>${op}</li>`;
    });
    
    // Threats
    const threatsContainer = document.getElementById('swot-threats-list');
    threatsContainer.innerHTML = '';
    s.swot.threats.forEach(th => {
        threatsContainer.innerHTML += `<li>${th}</li>`;
    });
    
    // PESTEL details
    document.getElementById('pestel-political').innerText = s.pestel.political;
    document.getElementById('pestel-economic').innerText = s.pestel.economic;
    document.getElementById('pestel-social').innerText = s.pestel.social;
    document.getElementById('pestel-technological').innerText = s.pestel.technological;
    document.getElementById('pestel-environmental').innerText = s.pestel.environmental;
    document.getElementById('pestel-legal').innerText = s.pestel.legal;
    
    // Action Plan strategies
    const recsContainer = document.getElementById('action-plan-strategies');
    recsContainer.innerHTML = '';
    s.recommendations.forEach(rec => {
        const block = document.createElement('div');
        block.className = 'strategy-block';
        block.innerHTML = `
            <h5>${rec.title}</h5>
            <p>${rec.text}</p>
        `;
        recsContainer.appendChild(block);
    });
}

function copyStrategicReportToClipboard() {
    const s = state.strategy;
    if (!s.swot) return;
    
    let text = `STRATEGIC BUSINESS ANALYSIS REPORT: ${s.companyName.toUpperCase()}\n`;
    text += `Target Goal: ${s.goal}\n`;
    text += `Primary Competitor: ${s.competitor}\n\n`;
    text += `=== SWOT MATRIX ===\n`;
    text += `STRENGTHS:\n${s.swot.strengths.map(st => `* ${st}`).join('\n')}\n\n`;
    text += `WEAKNESSES:\n${s.swot.weaknesses.map(wk => `* ${wk}`).join('\n')}\n\n`;
    text += `OPPORTUNITIES:\n${s.swot.opportunities.map(op => `* ${op}`).join('\n')}\n\n`;
    text += `THREATS:\n${s.swot.threats.map(th => `* ${th}`).join('\n')}\n\n`;
    
    text += `=== PESTEL ANALYSIS ===\n`;
    text += `Political: ${s.pestel.political}\n`;
    text += `Economic: ${s.pestel.economic}\n`;
    text += `Social: ${s.pestel.social}\n`;
    text += `Technological: ${s.pestel.technological}\n`;
    text += `Environmental: ${s.pestel.environmental}\n`;
    text += `Legal: ${s.pestel.legal}\n\n`;
    
    text += `=== REFERRED STRATEGIES ===\n`;
    text += s.recommendations.map(r => `${r.title.toUpperCase()}\n${r.text}`).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Strategic report copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text:', err);
    });
}

// --- 4. Risk Heatmap Engine ---
function initRiskHeatmap() {
    // Form Submit Plotter
    const form = document.getElementById('risk-entry-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('risk-name').value.trim();
        const probability = parseInt(document.getElementById('risk-probability').value);
        const impact = parseInt(document.getElementById('risk-impact').value);
        const mitigation = document.getElementById('risk-mitigation').value.trim();
        
        if (!name || !mitigation) return;
        
        // Add risk to state
        state.risks.push({
            id: `risk-${Date.now()}`,
            name,
            probability,
            impact,
            mitigation
        });
        
        // Reset form inputs
        form.reset();
        
        // Update components
        renderRiskMatrixGrid();
        updateDashboardAggregations();
    });
    
    // Delete action button
    document.getElementById('btn-delete-active-risk').addEventListener('click', () => {
        if (!state.selectedRiskId) return;
        state.risks = state.risks.filter(r => r.id !== state.selectedRiskId);
        state.selectedRiskId = null;
        
        // Hide details block, return placeholder
        document.getElementById('risk-selected-content').classList.add('hidden');
        document.getElementById('no-risk-selected-msg').classList.remove('hidden');
        
        // Update components
        renderRiskMatrixGrid();
        updateDashboardAggregations();
    });
    
    renderRiskMatrixGrid();
}

function renderRiskMatrixGrid() {
    // Render 5x5 cells in DOM
    const cellsContainer = document.getElementById('heatmap-cells');
    cellsContainer.innerHTML = '';
    
    // Grid cells order: Row 5 down to 1, Col 1 up to 5
    // Row Index r = 0..4 (prob = 5..1)
    // Col Index c = 0..4 (impact = 1..5)
    for (let r = 0; r < 5; r++) {
        const prob = 5 - r;
        for (let c = 0; c < 5; c++) {
            const imp = c + 1;
            const score = prob * imp;
            
            // Calculate severity class
            let sevClass = 'cell-score-low';
            if (score >= 4 && score <= 8) sevClass = 'cell-score-med';
            else if (score >= 9 && score <= 15) sevClass = 'cell-score-high';
            else if (score >= 16) sevClass = 'cell-score-crit';
            
            const cell = document.createElement('div');
            cell.className = `heatmap-cell ${sevClass}`;
            cell.setAttribute('data-probability', prob);
            cell.setAttribute('data-impact', imp);
            cellsContainer.appendChild(cell);
        }
    }
    
    // Render risk inventory listing
    const inventory = document.getElementById('risk-list-items');
    inventory.innerHTML = '';
    
    state.risks.forEach((risk, idx) => {
        const score = risk.probability * risk.impact;
        let pillSevClass = 'severity-low';
        let badgeText = 'Low';
        
        if (score >= 4 && score <= 8) { pillSevClass = 'severity-med'; badgeText = 'Medium'; }
        else if (score >= 9 && score <= 15) { pillSevClass = 'severity-high'; badgeText = 'High'; }
        else if (score >= 16) { pillSevClass = 'severity-critical'; badgeText = 'Critical'; }
        
        const pill = document.createElement('div');
        pill.className = `risk-item-pill`;
        pill.innerHTML = `
            <span class="risk-pill-name">${idx + 1}. ${risk.name}</span>
            <span class="risk-pill-score ${pillSevClass}">${badgeText} (${score})</span>
        `;
        
        pill.addEventListener('click', () => {
            selectRiskNode(risk.id);
        });
        inventory.appendChild(pill);
        
        // Plot node indicator on corresponding cells in matrix
        plotRiskPointOnMatrix(risk, idx + 1);
    });
}

function plotRiskPointOnMatrix(risk, numericId) {
    const cellsContainer = document.getElementById('heatmap-cells');
    
    // Find matching cell
    // Grid coordinate row index: 5 - probability. col index: impact - 1.
    const cellIdx = ((5 - risk.probability) * 5) + (risk.impact - 1);
    const cell = cellsContainer.children[cellIdx];
    
    if (cell) {
        const node = document.createElement('div');
        node.className = `risk-node ${state.selectedRiskId === risk.id ? 'active-selected' : ''}`;
        node.innerText = numericId;
        
        // Prevent stacking overlap offsets if multiple nodes hit same cell
        const existingNodes = cell.querySelectorAll('.risk-node').length;
        if (existingNodes > 0) {
            node.style.transform = `translate(${existingNodes * 4}px, ${existingNodes * 4}px)`;
        }
        
        node.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent background cell click trigger
            selectRiskNode(risk.id);
        });
        
        cell.appendChild(node);
    }
}

function selectRiskNode(riskId) {
    state.selectedRiskId = riskId;
    const risk = state.risks.find(r => r.id === riskId);
    
    if (!risk) return;
    
    // Toggle displays
    document.getElementById('no-risk-selected-msg').classList.add('hidden');
    const content = document.getElementById('risk-selected-content');
    content.classList.remove('hidden');
    
    // Populate details
    document.getElementById('risk-detail-title').innerText = risk.name;
    document.getElementById('risk-detail-prob').innerText = `${risk.probability}/5`;
    document.getElementById('risk-detail-impact').innerText = `${risk.impact}/5`;
    
    const score = risk.probability * risk.impact;
    document.getElementById('risk-detail-value').innerText = `${score}/25`;
    
    const badge = document.getElementById('risk-detail-severity-badge');
    if (score <= 3) { badge.className = 'badge badge-emerald'; badge.innerText = 'Low Risk'; }
    else if (score >= 4 && score <= 8) { badge.className = 'badge badge-warning'; badge.innerText = 'Medium Risk'; }
    else if (score >= 9 && score <= 15) { badge.className = 'badge badge-purple'; badge.innerText = 'High Risk'; }
    else { badge.className = 'badge badge-danger'; badge.innerText = 'Critical Risk'; }
    
    document.getElementById('risk-detail-mitigation').innerText = risk.mitigation;
    
    // Refresh visual highlights in matrix
    document.querySelectorAll('.risk-node').forEach(node => {
        node.classList.remove('active-selected');
    });
    
    // Re-render to show selector highlights
    renderRiskMatrixGrid();
}

// --- 5. AI Business Consultant Chatbot Core ---
function initAIAdvisor() {
    // Message submit trigger
    document.getElementById('btn-send-message').addEventListener('click', handleUserChatMessage);
    
    // Textarea Enter key trigger
    document.getElementById('chat-input-textarea').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserChatMessage();
        }
    });
    
    // Pre-configured Prompt Loader buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const promptText = btn.getAttribute('data-prompt');
            document.getElementById('chat-input-textarea').value = promptText;
            handleUserChatMessage();
        });
    });
    
    renderChatFeed();
}

function renderChatFeed() {
    const feed = document.getElementById('chat-conversation-feed');
    // Clear feed (skip initial welcome system message)
    feed.innerHTML = '';
    
    state.chatHistory.forEach(msg => {
        const item = document.createElement('div');
        item.className = `chat-message ${msg.role === 'user' ? 'user' : 'system'}`;
        
        const avatarIcon = msg.role === 'user' ? 'user' : 'bot';
        
        // Simple HTML markdown renderer replacement for bullet points and headers
        let formattedMessage = msg.message
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/\* (.*?)(?=<br>|$)/g, '<li>$1</li>')
            .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
            .replace(/<\/ul><br><ul>/g, '') // collapse consecutive lists
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
        item.innerHTML = `
            <div class="msg-avatar"><i data-lucide="${avatarIcon}"></i></div>
            <div class="msg-bubble">${formattedMessage}</div>
        `;
        
        feed.appendChild(item);
    });
    
    lucide.createIcons();
    
    // Auto Scroll to bottom
    feed.scrollTop = feed.scrollHeight;
}

async function handleUserChatMessage() {
    const inputEl = document.getElementById('chat-input-textarea');
    const query = inputEl.value.trim();
    
    if (!query) return;
    
    // Save query to state
    state.chatHistory.push({ role: 'user', message: query });
    inputEl.value = '';
    
    // Redraw feed
    renderChatFeed();
    
    // RENDER LOADING INDICATOR
    const feed = document.getElementById('chat-conversation-feed');
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chat-message system';
    loadingMessage.id = 'chat-loading-indicator';
    loadingMessage.innerHTML = `
        <div class="msg-avatar"><i data-lucide="bot"></i></div>
        <div class="msg-bubble">
            <div class="typing-bubble-wrap">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    feed.appendChild(loadingMessage);
    lucide.createIcons();
    feed.scrollTop = feed.scrollHeight;
    
    let answerText = '';
    
    if (state.isGeminiConnected && state.geminiKey) {
        try {
            answerText = await queryGeminiModel(query);
        } catch (e) {
            console.error('Gemini query error, falling back to local consult templates:', e);
            answerText = runLocalAdvisorEngine(query);
        }
    } else {
        // Run Rule Heuristics Engine with small mock network delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        answerText = runLocalAdvisorEngine(query);
    }
    
    // Remove loading indicator
    const loader = document.getElementById('chat-loading-indicator');
    if (loader) loader.remove();
    
    // Append answer to state
    state.chatHistory.push({ role: 'bot', message: answerText });
    
    // Render and scroll
    renderChatFeed();
}

async function queryGeminiModel(userQuery) {
    const focusDomain = document.getElementById('chat-focus-domain').value;
    
    // Embed current dashboard variables into context prompt to make the AI extremely smart and context-aware
    const contextPrompt = `
    You are an expert Executive Advisor. You are consulting a user on their strategic decision-making dashboard.
    Here is the current quantitative state of the workspace dashboard:
    1. FINANCIAL SCENARIO SIMULATIONS:
       - Selected Selling Price: $${state.scenario.price}
       - Expected Volume: ${state.scenario.volume} units
       - Unit variable cost: $${state.scenario.unitCost}
       - Monthly Marketing Budget: $${state.scenario.marketing}
       - Fixed overhead: $${state.scenario.overhead}
       - Monthly Revenue: $${state.scenario.price * state.scenario.volume}
       - Monthly Cost: ${(state.scenario.unitCost * state.scenario.volume) + state.scenario.overhead + state.scenario.marketing}
       - Net Profit/Loss: ${(state.scenario.price * state.scenario.volume) - ((state.scenario.unitCost * state.scenario.volume) + state.scenario.overhead + state.scenario.marketing)}
    2. STRATEGIC DECISION MATRIX COMPARISONS:
       - Best Ranked Choice: "${state.mcda.winnerName || 'N/A'}" (Weighted Score: ${state.mcda.winnerScore || 'N/A'})
    3. CURRENT PLOTTED OPERATIONAL RISKS:
       - Plotted Hazards: [${state.risks.map(r => `Risk: ${r.name} (Likelihood: ${r.probability}/5, Impact: ${r.impact}/5)`).join('; ')}]
    
    The user is asking a question in the focus domain of: "${focusDomain}".
    User's query: "${userQuery}"
    
    Please provide a concise, structured, professional executive answer. Give practical formulas or action steps that integrate their scenario profit, decision scores, and risks where relevant. Use bullet points and bold formatting. Keep it under 250 words.
    `;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }]
        })
    });
    
    if (!response.ok) throw new Error('API Request failure');
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function runLocalAdvisorEngine(userQuery) {
    const q = userQuery.toLowerCase();
    
    // Standard advisor advice template lists
    if (q.includes('price') || q.includes('cogs') || q.includes('cost')) {
        return `### Variable Pricing & Cost Optimization Advisory

Based on your current Scenario Forecaster setup ($${state.scenario.price} Unit Price vs $${state.scenario.unitCost} Unit Cost), your Contribution Margin Ratio is **${Math.round(((state.scenario.price - state.scenario.unitCost) / state.scenario.price) * 100)}%**. Here are key optimizations to pursue:

* **Squeeze Variable COGS**: Review materials sourcing contracts. Shifting from spot-rate sourcing to bulk logistics agreements typically lowers unit cost by 8-15%.
* **Evaluate Price Elasticity**: If you increase your price by 10%, your breakeven volume requirement drops. Check if your brand positioning supports premium pricing.
* **Overhead Auditing**: Your fixed overhead of $${state.scenario.overhead.toLocaleString()} is your structural risk burden. Leverage automated pipelines or outsourced systems to turn fixed costs into variable ones.`;
    }
    
    if (q.includes('market') || q.includes('expansion') || q.includes('competitor') || q.includes('gtm')) {
        return `### Market Expansion & Competitor Shielding

For your strategic goal related to expansion, you listed competitor threat as: **${state.strategy.competitor || 'Sollux Inc.'}**. Consider this roadmap:

* **Identify a Niche Wedge**: Do not match competitors head-on on broad products. Deploy a highly specialized feature or service targeting underserved customer segments.
* **Capital Protection**: Market entries require upfront cash buffers. Buffer your marketing investment ($${state.scenario.marketing.toLocaleString()} current monthly spend) by securing customer pre-registrations before full operational rollout.
* **IP Defense**: Ensure all local trademarks, patent certifications, and data regulations are audited prior to launch.`;
    }
    
    if (q.includes('risk') || q.includes('heatmap') || q.includes('mitigat')) {
        const riskCount = state.risks.length;
        return `### Risk Framework and Mitigation Advisory

You have **${riskCount} operational risks** plotted on your Heatmap Matrix. To optimize your risk exposure profile:

* **Action Critical Cells**: Prioritize mitigations for cells scoring high. Any coordinate exceeding a score of 12 (probability * impact) requires a weekly executive review.
* **Diversify Sourcing**: Build redundancy. If a primary risk cell relates to supply chain bottlenecks, validate secondary vendors.
* **Legal Shielding**: Review statutory compliance frameworks to build regulatory insurance policies.`;
    }
    
    if (q.includes('hire') || q.includes('team') || q.includes('talent') || q.includes('engineer')) {
        return `### Talent Acquisition & Org Chart Scaling

For scaling operations, strategic hiring sequencing is critical:

* **Hire Revenue Generators First**: Prioritize hiring that directly scales sales channels (BDMs, Sales reps) or streamlines production (Engineers) to shorten payback cycles.
* **Link Compensation to Metrics**: Implement performance-based commissions or equity allocations to align team motivation with business metrics.
* **Outsource Non-Core Work**: Retain high-level management inside, while outsourcing routine IT maintenance and admin duties to reduce structural fixed overhead.`;
    }

    // Default consulting response
    return `### Strategic Business Advisory response

Thank you for your query. Based on your active dashboard state, here are three strategic insights:

* **Execute Recommended MCDA Strategy**: Focus resources on executing your top-ranked option: **${state.mcda.winnerName}**. It has scored highest under your custom criteria weighting.
* **Optimize Unit Economies**: Your current simulator calculations show a Net Monthly Margin of **$${Math.round((state.scenario.price * state.scenario.volume) - ((state.scenario.unitCost * state.scenario.volume) + state.scenario.overhead + state.scenario.marketing)).toLocaleString()}**. Maintain a Margin of Safety exceeding 25%.
* **Build AI Context Capabilities**: Connect a **Google Gemini API Key** via the Settings button at the top header to activate live, customized strategic reasoning tailored for your company details.`;
}

// --- 6. Dashboard Panel Aggregation Sync ---
function updateDashboardAggregations() {
    // 1. Profit Margin Calc
    const s = state.scenario;
    const rev = s.price * s.volume;
    const costs = (s.unitCost * s.volume) + s.overhead + s.marketing;
    const profit = rev - costs;
    const marginPct = rev > 0 ? Math.round((profit / rev) * 100) : 0;
    
    const profitEl = document.getElementById('dash-profit-margin');
    profitEl.innerText = `${marginPct}%`;
    profitEl.className = `m-card-val ${profit >= 0 ? 'emerald-text' : 'error-text'}`;
    
    document.getElementById('dash-profit-growth').innerText = `Net Profit: ${profit >= 0 ? '+' : '-'}$${Math.abs(Math.round(profit)).toLocaleString()}/mo`;
    
    // 2. MCDA Winner
    const winnerEl = document.getElementById('dash-mcda-winner');
    winnerEl.innerText = state.mcda.winnerName || 'N/A';
    document.getElementById('dash-mcda-score').innerText = `Weighted Index: ${state.mcda.winnerScore || '0%'}`;
    
    // 3. Risks Count
    const riskCount = state.risks.length;
    document.getElementById('dash-risk-count').innerText = riskCount;
    
    const criticalCount = state.risks.filter(r => (r.probability * r.impact) >= 15).length;
    document.getElementById('dash-critical-risk').innerText = `${criticalCount} critical risks plotted`;
    
    // Calculate general decision index
    // A heuristic indicator: Profit margin % + (winning mcda score / 2) - (critical risk count * 10)
    let decisionIndex = 50 + (marginPct / 2);
    if (state.mcda.winnerScore) {
        decisionIndex += parseFloat(state.mcda.winnerScore) / 4;
    }
    decisionIndex -= (criticalCount * 12);
    decisionIndex = Math.max(10, Math.min(99, Math.round(decisionIndex)));
    
    document.getElementById('header-decision-index').innerText = `${decisionIndex}%`;
}

// --- 7. Full Decision Report Markdown Export ---
function exportFullDecisionReport() {
    const s = state.scenario;
    const m = state.mcda;
    const r = state.risks;
    const st = state.strategy;
    
    // Math Aggregates
    const rev = s.price * s.volume;
    const variableCosts = s.unitCost * s.volume;
    const totalCosts = variableCosts + s.overhead + s.marketing;
    const netProfit = rev - totalCosts;
    const marginPct = rev > 0 ? Math.round((netProfit / rev) * 100) : 0;
    const BEVolume = s.price > s.unitCost ? Math.ceil((s.overhead + s.marketing) / (s.price - s.unitCost)) : 0;
    
    let report = `# EXECUTIVE STRATEGIC DECISION REPORT\n`;
    report += `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    report += `Company: ${st.companyName || 'Apex Solars'} (Industry Segment: ${st.industry.toUpperCase()})\n`;
    report += `Strategic Target: ${st.goal || 'General Operations Optimization'}\n`;
    report += `========================================================================\n\n`;
    
    report += `## 1. FINANCIAL SIMULATION SUMMARY\n`;
    report += `- Unit Selling Price: $${s.price}\n`;
    report += `- Unit variable cost: $${s.unitCost}\n`;
    report += `- Contribution Margin Ratio: ${Math.round(((s.price - s.unitCost)/s.price)*100)}%\n`;
    report += `- Expected Monthly Sales: ${s.volume} units\n`;
    report += `- Monthly Revenue Forecast: $${rev.toLocaleString()}\n`;
    report += `- Monthly Net profit: $${netProfit.toLocaleString()} (Margin: ${marginPct}%)\n`;
    report += `- Break-Even Threshold: ${BEVolume.toLocaleString()} units ($${(BEVolume * s.price).toLocaleString()})\n\n`;
    
    report += `## 2. MULTI-CRITERIA DECISION SELECTION (MCDA)\n`;
    report += `Recommended Strategy: **${m.winnerName || 'N/A'}** (${m.winnerScore || 'N/A'} weighted index score)\n\n`;
    report += `Options Evaluated:\n`;
    m.options.forEach((opt, idx) => {
        report += `${idx + 1}. ${opt.name}\n`;
    });
    report += `\n`;
    
    report += `## 3. IDENTIFIED OPERATIONAL RISKS\n`;
    report += `Total Plotted Risks: ${r.length}\n\n`;
    r.forEach((risk, idx) => {
        report += `### RISK #${idx + 1}: ${risk.name}\n`;
        report += `- Coordinate Location: Prob ${risk.probability}/5, Impact ${risk.impact}/5 (Severity Score: ${risk.probability * risk.impact}/25)\n`;
        report += `- Mitigation Protocol: ${risk.mitigation}\n\n`;
    });
    
    if (st.swot) {
        report += `## 4. SWOT STRATEGIC MATRIX\n`;
        report += `### Strengths:\n${st.swot.strengths.map(i => `* ${i}`).join('\n')}\n\n`;
        report += `### Weaknesses:\n${st.swot.weaknesses.map(i => `* ${i}`).join('\n')}\n\n`;
        report += `### Opportunities:\n${st.swot.opportunities.map(i => `* ${i}`).join('\n')}\n\n`;
        report += `### Threats:\n${st.swot.threats.map(i => `* ${i}`).join('\n')}\n\n`;
    }
    
    // File download trigger
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Executive_Decision_Report_${st.companyName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
