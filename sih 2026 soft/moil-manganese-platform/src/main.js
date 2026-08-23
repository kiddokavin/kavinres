// MOIL-MEPO App Controller
import { MINES, BOREHOLES, RESERVE_POLYGONS, HISTORICAL_SHORTFALLS } from './data.js';

// Application State
let activeMine = MINES.find(m => m.id === "MN-02") || MINES[0]; // Dongri Buzurg by default (shows high risk)
let map = null;
let mapMarkers = {};
let mapPolygons = [];
let charts = {};
let activeTab = 'historical';
let optimizationApplied = false;

// 1. Digital clock setup
function initClock() {
  const clockEl = document.getElementById('moil-clock');
  setInterval(() => {
    const now = new Date();
    now.setFullYear(2026); // Set simulated time to 2026
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    };
    clockEl.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${now.toLocaleString('en-IN', options).replace(/\//g, '-')}`;
  }, 1000);
}

// 2. Leaflet map setup
function initMap() {
  if (typeof L === 'undefined') return;

  // Center on Balaghat-Nagpur belt
  map = L.map('moil-map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([21.60, 79.85], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Draw initial reserve susceptibility zones
  drawReservesOverlays();

  // Draw borehole drill markers
  drawBoreholeMarkers();

  // Button binders
  document.getElementById('btn-recenter').addEventListener('click', () => {
    map.setView([21.60, 79.85], 8);
  });

  // Layer switches
  const btnReserves = document.getElementById('btn-layer-reserves');
  const btnNdvi = document.getElementById('btn-layer-ndvi');
  const btnSoil = document.getElementById('btn-layer-soil');

  btnReserves.addEventListener('click', () => {
    toggleMapLayer(btnReserves, 'reserves');
  });
  btnNdvi.addEventListener('click', () => {
    toggleMapLayer(btnNdvi, 'ndvi');
  });
  btnSoil.addEventListener('click', () => {
    toggleMapLayer(btnSoil, 'soil');
  });
}

function drawReservesOverlays() {
  // Clear old polygons
  mapPolygons.forEach(p => map.removeLayer(p));
  mapPolygons = [];

  RESERVE_POLYGONS.forEach(zone => {
    const poly = L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.25,
      weight: 2,
      dashArray: '3, 3'
    }).addTo(map);

    poly.bindPopup(`
      <div style="font-family:'Inter',sans-serif; color:#ffffff;">
        <strong style="font-family:'Outfit',sans-serif; color:var(--primary-blue);">${zone.name}</strong><br>
        Tonnage: <strong>${zone.estimated_tonnage}</strong><br>
        Grade: <strong>${zone.grade_class}</strong><br>
        Probability: <span style="color:${zone.color}; font-weight:bold;">${zone.probability}</span>
      </div>
    `);

    mapPolygons.push(poly);
  });
}

function drawBoreholeMarkers() {
  BOREHOLES.forEach(bh => {
    // Custom circle marker
    const marker = L.circleMarker(bh.coords, {
      radius: 8,
      fillColor: '#a855f7', // purple
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.8
    }).addTo(map);

    marker.bindPopup(`<strong>${bh.name}</strong><br>Total Depth: ${bh.total_depth}m<br>Avg Grade: ${bh.avg_grade}% Mn`);
    
    marker.on('click', () => {
      selectBorehole(bh.id);
    });

    mapMarkers[bh.id] = marker;
  });
}

function selectBorehole(bhId) {
  const bh = BOREHOLES.find(b => b.id === bhId);
  if (!bh) return;

  // Highlight marker
  Object.values(mapMarkers).forEach(m => m.setStyle({ color: '#ffffff', weight: 2 }));
  mapMarkers[bhId].setStyle({ color: '#00bfff', weight: 4 });

  // Update Borehole Metadata Panel
  document.getElementById('dh-name').innerText = bh.name;
  document.getElementById('dh-depth').innerText = `${bh.total_depth} m`;
  document.getElementById('dh-grade').innerText = `${bh.avg_grade} % Mn`;
  document.getElementById('dh-recovery').innerText = `${bh.recovery_rate} %`;

  // Draw stratigraphy table
  const tbody = document.getElementById('drill-table-body');
  tbody.innerHTML = '';
  
  bh.layers.forEach(layer => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${layer.depth_range}</td>
      <td style="font-weight:600; color:#ffffff;">${layer.lithology}</td>
      <td style="color:${layer.grade > 30 ? '#00bfff' : layer.grade > 0 ? '#fbbf24' : '#94a3b8'}; font-weight:700;">
        ${layer.grade > 0 ? layer.grade + '% Mn' : '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Render vertical stratigraphic visual bar
  renderStratigraphyBar(bh.layers);
}

function renderStratigraphyBar(layers) {
  const bar = document.getElementById('borehole-core-bar');
  bar.innerHTML = '';

  const colors = {
    "Alluvium / Overburden": "#854d0e", // brown
    "Weathered Mansar Schist": "#6b7280", // grey
    "High-Grade Gondite Orebody": "#475569", // dark grey steel
    "Basal Lohangi Marble": "#e2e8f0", // white
    "Overburden clay": "#78350f",
    "Medium-Grade Braided Gondite": "#3f495a",
    "Pegmatite intrusions": "#f87171",
    "Soil & weathered gravel": "#7c2d12",
    "Supergene enriched Battery Ore": "#1e293b",
    "Quartzite bedrock": "#cbd5e1"
  };

  layers.forEach((layer, index) => {
    const div = document.createElement('div');
    div.className = 'core-strata-layer';
    div.style.backgroundColor = colors[layer.lithology] || '#4b5563';
    div.style.flexGrow = index === 0 ? '1' : index === 1 ? '3' : '5'; // mock proportional sizing
    div.style.minHeight = '24px';
    div.innerText = layer.lithology.split(" ")[0];
    div.title = `${layer.lithology} (${layer.depth_range})`;
    bar.appendChild(div);
  });
}

function toggleMapLayer(button, layerName) {
  // Clear active classes
  button.classList.toggle('active');
  const isActive = button.classList.contains('active');

  if (layerName === 'reserves') {
    if (isActive) drawReservesOverlays();
    else mapPolygons.forEach(p => map.removeLayer(p));
  } else if (layerName === 'ndvi') {
    // Mock space overlay using a large green rectangle over the zone
    if (isActive) {
      if (charts.ndviLayer) map.removeLayer(charts.ndviLayer);
      charts.ndviLayer = L.rectangle([[21.3, 79.2], [21.9, 80.3]], {
        color: "#10b981", weight: 1, fillOpacity: 0.15
      }).addTo(map);
      charts.ndviLayer.bindPopup("NDVI Vegetation Index Sentinel-2 Overlay");
    } else if (charts.ndviLayer) {
      map.removeLayer(charts.ndviLayer);
      charts.ndviLayer = null;
    }
  } else if (layerName === 'soil') {
    // Mock soil moisture overlay
    if (isActive) {
      if (charts.soilLayer) map.removeLayer(charts.soilLayer);
      charts.soilLayer = L.rectangle([[21.3, 79.2], [21.9, 80.3]], {
        color: "#3b82f6", weight: 1, fillOpacity: 0.18
      }).addTo(map);
      charts.soilLayer.bindPopup("SAR Soil Moisture Saturation Overlay");
    } else if (charts.soilLayer) {
      map.removeLayer(charts.soilLayer);
      charts.soilLayer = null;
    }
  }
}

// 3. Select Mine & Telemetries
function selectMine(mineId) {
  const mine = MINES.find(m => m.id === mineId);
  if (!mine) return;

  activeMine = mine;
  document.getElementById('mine-select').value = mineId;

  // Reset optimization state if switching mines
  optimizationApplied = false;

  // Update space-met headers
  document.getElementById('lbl-forecast-rain').innerText = `${mine.weather.forecast_rain_mm} mm`;
  document.getElementById('lbl-soil-moist').innerText = `${mine.weather.soil_moisture_pct} %`;
  document.getElementById('lbl-land-temp').innerText = `${mine.weather.land_surface_temp_c} °C`;

  // Draw equipment table
  const container = document.getElementById('eq-list-container');
  container.innerHTML = '';
  mine.equipment.forEach(eq => {
    const row = document.createElement('div');
    row.className = 'eq-row';
    
    let statusClass = 'eq-status-active';
    if (eq.status === 'Maintenance') statusClass = 'eq-status-maint';
    else if (eq.status === 'Critical Failure') statusClass = 'eq-status-fail';

    row.innerHTML = `
      <span class="eq-name">${eq.name}</span>
      <div>
        <span class="eq-status-badge ${statusClass}">${eq.status}</span>
        <span style="margin-left: 8px; font-weight:700; color:#ffffff;">${eq.efficiency}% Eff</span>
      </div>
    `;
    container.appendChild(row);
  });

  // Calculate Shortfall Risk
  calculateShortfallRisk(mine);

  // Redraw Mine target vs actual production charts
  renderMineProductionChart(mine);
  
  // Pan to mine
  if (map) {
    map.panTo(mine.coords);
  }
}

// Compute dynamic shortfall probabilities
function calculateShortfallRisk(mine) {
  const rain = mine.weather.forecast_rain_mm;
  const downtime = mine.constraints.equipment_downtime_hours;
  const delay = mine.constraints.blasting_delay_days;

  // Math heuristic risk probability
  let score = (rain / 120) * 40 + (downtime / 100) * 35 + (delay / 5) * 25;
  score = Math.min(Math.round(score), 100);

  // Apply optimization drops if triggered
  if (optimizationApplied && mine.id === activeMine.id) {
    score = Math.max(12, Math.round(score * 0.25));
  }

  // Update UI Elements
  const badge = document.getElementById('shortfall-risk-badge');
  const gauge = document.getElementById('shortfall-gauge');
  const pct = document.getElementById('shortfall-pct');
  const headline = document.getElementById('shortfall-headline');
  const expl = document.getElementById('shortfall-explanation');
  const diagnostics = document.getElementById('diagnostic-list');

  pct.innerText = `${score}%`;
  
  // Color configuration
  let color = 'var(--low-green)';
  let riskLevel = 'LOW RISK';
  
  if (score > 60) {
    color = 'var(--danger-red)';
    riskLevel = 'HIGH RISK';
    badge.className = 'badge badge-risk high';
  } else if (score > 35) {
    color = 'var(--warn-yellow)';
    riskLevel = 'MEDIUM RISK';
    badge.className = 'badge badge-risk';
  } else {
    badge.className = 'badge badge-risk low';
  }

  badge.innerText = riskLevel;
  gauge.style.background = `conic-gradient(${color} 0% ${score}%, #1f2937 ${score}% 100%)`;
  pct.style.color = color;

  // Diagnostics & explanatory alerts
  diagnostics.innerHTML = '';
  
  if (score > 35) {
    headline.innerText = "Production Shortfall Anticipated";
    expl.innerText = `AI Predictor model identifies constraints at ${mine.name} yielding a ${score}% shortfall probability over the upcoming weekly run.`;
    
    // Render diagnostics bullets
    if (rain > 40) {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-cloud-showers-heavy text-blue"></i> Slippery haul ramps due to rainfall (${rain}mm forecast)`;
      diagnostics.appendChild(li);
    }
    if (downtime > 20) {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-screwdriver-wrench text-yellow"></i> Accumulating equipment downtime (${downtime} total hours)`;
      diagnostics.appendChild(li);
    }
    if (delay > 0) {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-burst text-orange"></i> Blasting scheduling delay (${delay} days behind schedule)`;
      diagnostics.appendChild(li);
    }
  } else {
    headline.innerText = "Mine Operations Stable";
    expl.innerText = `Constraints resolved. Operations at ${mine.name} are optimized to achieve target schedules with negligible shortfall risk.`;
    
    const li = document.createElement('li');
    li.style.borderColor = 'rgba(16,185,129,0.3)';
    li.style.background = 'rgba(16,185,129,0.02)';
    li.innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> All systems operational. Haul channels fully clear.`;
    diagnostics.appendChild(li);
  }
}

// 4. Chart.js Production target rendering
function renderMineProductionChart(mine) {
  let target = mine.target_production;
  let current = mine.current_production;

  if (optimizationApplied && mine.id === activeMine.id) {
    current = Math.round(target * 0.98); // optimized to target line
  }

  if (charts.mineProd) {
    charts.mineProd.data.datasets[0].data = [current];
    charts.mineProd.data.datasets[1].data = [target];
    charts.mineProd.update();
  } else {
    const ctx = document.getElementById('chart-production-vs-target').getContext('2d');
    charts.mineProd = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Current Output'],
        datasets: [
          {
            label: 'Actual (Tonnes)',
            data: [current],
            backgroundColor: 'rgba(0, 191, 255, 0.75)',
            borderColor: '#00bfff',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Target (Tonnes)',
            data: [target],
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }
        }
      }
    });
  }
}

// 5. AI Corrective Actions & Optimizer
function triggerResourceOptimization() {
  const btn = document.getElementById('btn-trigger-optimization');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Re-routing Resources...';
  btn.disabled = true;

  // Log dispatch alerts to bottom console
  const consoleEl = document.getElementById('opt-console-log');
  const logList = document.getElementById('console-logs-list');
  consoleEl.style.display = 'flex';
  logList.innerHTML = '';

  const actions = [
    { time: "T+0.2s", msg: "Scanning mine operational dependencies..." },
    { time: "T+1.1s", msg: "Rerouting backup Dumper DM-208 from Chikla Mine to Dongri Buzurg." },
    { time: "T+2.3s", msg: "Blasting window adjusted. Rescheduling to dry window (Forecasted 22:00h)." },
    { time: "T+3.5s", msg: "Dispatched maintenance team to fix Excavator winch hydraulics." },
    { time: "T+4.2s", msg: "Redistributing shovel capacities: 3 loaders re-allocated to Level 3 Shaft.", success: true },
    { time: "T+4.8s", msg: "Shortfall hazard minimized. Target schedules aligned.", success: true }
  ];

  actions.forEach((act, idx) => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = 'console-log-msg';
      const statusClass = act.success ? 'success' : '';
      p.innerHTML = `<span>[${act.time}]</span> <span class="${statusClass}">${act.msg}</span>`;
      logList.appendChild(p);
      logList.scrollTop = logList.scrollHeight;

      if (idx === actions.length - 1) {
        // Complete Optimization
        optimizationApplied = true;
        calculateShortfallRisk(activeMine);
        renderMineProductionChart(activeMine);
        
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> System Optimized';
        btn.classList.remove('btn-primary');
        btn.classList.remove('btn-pulse-blue');
        btn.style.background = 'var(--low-green)';
        btn.style.color = '#ffffff';

        // Auto close console after 6 seconds
        setTimeout(() => {
          consoleEl.style.opacity = '0';
          setTimeout(() => {
            consoleEl.style.display = 'none';
            consoleEl.style.opacity = '1';
            // Restore button
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Trigger Resource Optimization';
            btn.disabled = false;
            btn.style.background = '';
            btn.style.color = '';
            btn.classList.add('btn-primary');
            btn.classList.add('btn-pulse-blue');
          }, 400);
        }, 6000);
      }
    }, idx * 1000);
  });
}

// 6. Bottom Tabs switching
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));
      document.getElementById(target).classList.add('active');

      if (target === 'tab-historical') {
        renderHistoricalCharts();
      }
    });
  });

  // Load initial tab
  renderHistoricalCharts();
}

// Render historical analysis tab charts
let annualChart = null;
let driversChart = null;

function renderHistoricalCharts() {
  if (annualChart && driversChart) return;

  const annualCtx = document.getElementById('chart-annual-production').getContext('2d');
  annualChart = new Chart(annualCtx, {
    type: 'line',
    data: {
      labels: HISTORICAL_SHORTFALLS.timeline.labels,
      datasets: [
        {
          label: 'Production Target (KT)',
          data: HISTORICAL_SHORTFALLS.timeline.target,
          borderColor: 'rgba(255,255,255,0.2)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 2,
          borderDash: [5, 5],
          tension: 0.1
        },
        {
          label: 'Actual Production (KT)',
          data: HISTORICAL_SHORTFALLS.timeline.actual,
          borderColor: '#00bfff',
          backgroundColor: 'rgba(0, 191, 255, 0.08)',
          fill: true,
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }
      }
    }
  });

  const driversCtx = document.getElementById('chart-failure-drivers').getContext('2d');
  driversChart = new Chart(driversCtx, {
    type: 'pie',
    data: {
      labels: HISTORICAL_SHORTFALLS.shortfall_drivers.labels,
      datasets: [{
        data: HISTORICAL_SHORTFALLS.shortfall_drivers.impact_percentages,
        backgroundColor: [
          'rgba(239, 68, 68, 0.75)',  // Flooding
          'rgba(245, 158, 11, 0.75)',  // Dumper maintenance
          'rgba(99, 102, 241, 0.75)',  // Winch maintenance
          'rgba(16, 185, 129, 0.75)',  // Blasting delays
          'rgba(148, 163, 184, 0.75)'  // Labor
        ],
        borderColor: '#111827',
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#e2e8f0', font: { size: 9 }, boxWidth: 10 }
        }
      }
    }
  });
}

// 7. AI Prospecting Tool
function initProspectingSliders() {
  const sliders = [
    { id: 'slide-clay', valId: 'val-slide-clay', key: 'clay', suffix: '' },
    { id: 'slide-iron', valId: 'val-slide-iron', key: 'iron', suffix: '' },
    { id: 'slide-ndvi', valId: 'val-slide-ndvi', key: 'ndvi', suffix: '' },
    { id: 'slide-lst', valId: 'val-slide-lst', key: 'lst', suffix: ' °C' }
  ];

  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    el.addEventListener('input', (e) => {
      document.getElementById(s.valId).innerText = `${parseFloat(e.target.value).toFixed(s.id === 'slide-lst' ? 1 : 2)}${s.suffix}`;
    });
  });

  // Bind form submission
  document.getElementById('prospecting-form').addEventListener('submit', (e) => {
    e.preventDefault();
    runAIProspectingScan();
  });
}

function runAIProspectingScan() {
  const clay = parseFloat(document.getElementById('slide-clay').value);
  const iron = parseFloat(document.getElementById('slide-iron').value);
  const ndvi = parseFloat(document.getElementById('slide-ndvi').value);
  const lst = parseFloat(document.getElementById('slide-lst').value);

  // Model susceptibility math heuristic
  // Clay and Iron absorption indicates ore outcrops, LST heat indicates rock thermal inertia, NDVI stress (lower is better for rock exposure)
  const score = (clay / 3.0) * 0.35 + (iron / 4.0) * 0.35 + (1.0 - ndvi) * 0.15 + (lst / 50.0) * 0.15;
  
  const box = document.getElementById('prospecting-output-box');
  const headline = document.getElementById('prospect-status');
  const text = document.getElementById('prospect-details');

  box.classList.add('scanned');

  // Specs
  const specRock = document.getElementById('spec-rock');
  const specGrade = document.getElementById('spec-grade');
  const specDepth = document.getElementById('spec-depth');
  const specTonnage = document.getElementById('spec-tonnage');

  if (score > 0.65) {
    // Susceptibility Matched!
    headline.innerText = "OREBODY SUSCEPTIBILITY FOUND";
    headline.style.color = '#00bfff';
    text.innerText = "AI Heuristics confirm high correlation with Gondite-series manganese mineral indexes. A new prospecting block has been mapped on the GIS server.";

    specRock.innerText = "Manganiferous Quartzite / Braunite";
    specRock.className = 'text-blue';
    specGrade.innerText = "High Grade (>44% Mn)";
    specGrade.className = 'text-green';
    specDepth.innerText = "50m - 140m (Suitable for Open Cast)";
    specDepth.className = 'text-yellow';
    specTonnage.innerText = "Estimated 5.8 Million Tonnes";
    specTonnage.className = 'text-blue';

    // Add temporary polygon to Leaflet Map
    if (map) {
      // Draw a glowing orange polygon near Balaghat mine extension
      const scanPoly = L.polygon([
        [21.8350, 80.1900],
        [21.8400, 80.2050],
        [21.8280, 80.2100],
        [21.8250, 80.1950]
      ], {
        color: '#ff4500', // orange-red
        fillColor: '#ff4500',
        fillOpacity: 0.35,
        weight: 3
      }).addTo(map);

      scanPoly.bindPopup("<strong>AI Predicted Deposit Extension</strong><br>Estimated Tonnage: 5.8 MT<br>Grade: High Grade");
      map.fitBounds(scanPoly.getBounds());
      
      // Keep track to remove if scanned again
      if (charts.scanPolygon) map.removeLayer(charts.scanPolygon);
      charts.scanPolygon = scanPoly;
    }
  } else {
    // Mismatch
    headline.innerText = "NO DETECTABLE ANOMALIES";
    headline.style.color = 'var(--text-muted)';
    text.innerText = "Clay and Iron absorption signatures fall below mining grade classification thresholds. Readjust index parameters.";

    specRock.innerText = "Schist Overburden / Pegmatite";
    specRock.className = '';
    specGrade.innerText = "Low Grade (<15% Mn)";
    specGrade.className = '';
    specDepth.innerText = "Not Determined";
    specDepth.className = '';
    specTonnage.innerText = "Negligible Susceptibility";
    specTonnage.className = '';

    if (charts.scanPolygon && map) {
      map.removeLayer(charts.scanPolygon);
      charts.scanPolygon = null;
    }
  }
}

// 8. Bootstrap Initializations
function initUIEvents() {
  // Populate dropdown select
  const dropdown = document.getElementById('mine-select');
  dropdown.innerHTML = '';
  MINES.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.innerText = m.name;
    dropdown.appendChild(opt);
  });

  dropdown.addEventListener('change', (e) => {
    selectMine(e.target.value);
  });

  // Optimizer trigger
  document.getElementById('btn-trigger-optimization').addEventListener('click', triggerResourceOptimization);

  // Initial selects
  selectMine('MN-02'); // Select Dongri Buzurg by default
  selectBorehole('BH-Balaghat-01');
}

window.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();
  initUIEvents();
  initTabs();
  initProspectingSliders();
});
