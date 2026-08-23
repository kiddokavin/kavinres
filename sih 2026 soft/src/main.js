// NER-LAMS Main Application Controller
import { STATIONS, LSZ_POLYGONS, HISTORICAL_EVENTS, ANALYTICS_DATA } from './data.js';
import { predictLandslideRisk } from './ai_model.js';

// Application State
let activeStation = STATIONS.find(s => s.id === "ST-01") || STATIONS[0];
let map = null;
let mapMarkers = {};
let mapPolygons = [];
let charts = {};
let telemetryInterval = null;
let simulationActive = false;
let simulationStep = 0;
let simulatedStation = null;
let audioContext = null;
let sirenOscillators = [];
let sirenGainNode = null;
let sirenIsPlaying = false;

// 1. Initialize clock
function initClock() {
  const clockEl = document.getElementById('ner-clock');
  setInterval(() => {
    const now = new Date();
    // Simulate time advancing in 2026
    const simulatedYear = 2026;
    now.setFullYear(simulatedYear);
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    };
    clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleString('en-IN', options).replace(/\//g, '-')}`;
  }, 1000);
}

// 2. Initialize Leaflet GIS Map
function initMap() {
  if (typeof L === 'undefined') return;

  // Center on North-East India (Guwahati/Shillong focus)
  map = L.map('gis-map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([25.80, 92.50], 7);

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Draw Susceptibility Zones (LSZ Polygons)
  drawLSZPolygons();

  // Draw Station Markers
  drawStationMarkers();

  // Recenter map button listener
  document.getElementById('btn-recenter').addEventListener('click', () => {
    map.setView([25.80, 92.50], 7);
  });

  // Toggle LSZ polygons listener
  const btnToggleLSZ = document.getElementById('btn-toggle-lsz');
  btnToggleLSZ.addEventListener('click', () => {
    if (btnToggleLSZ.classList.contains('active')) {
      mapPolygons.forEach(p => map.removeLayer(p));
      btnToggleLSZ.classList.remove('active');
    } else {
      drawLSZPolygons();
      btnToggleLSZ.classList.add('active');
    }
  });
}

// Draw LSZ overlays
function drawLSZPolygons() {
  if (mapPolygons.length > 0) {
    mapPolygons.forEach(p => map.removeLayer(p));
    mapPolygons = [];
  }

  LSZ_POLYGONS.forEach(zone => {
    const polygon = L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.25,
      weight: 2,
      dashArray: '4, 4'
    }).addTo(map);
    
    polygon.bindPopup(`<strong>${zone.name}</strong><br>Susceptibility: <span style="color:${zone.color}; font-weight:bold;">${zone.risk}</span>`);
    mapPolygons.push(polygon);
  });
}

// Helper to get color of risk levels
function getRiskColor(level) {
  switch (level.toUpperCase()) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MODERATE': return '#eab308';
    default: return '#10b981';
  }
}

// Draw markers for stations
function drawStationMarkers() {
  // Clear existing markers if any
  Object.values(mapMarkers).forEach(m => map.removeLayer(m));
  mapMarkers = {};

  STATIONS.forEach(station => {
    const color = getRiskColor(station.risk_level);
    const pulseClass = (station.risk_level === 'CRITICAL' || station.risk_level === 'HIGH') ? 'marker-pulse' : '';
    
    const iconStyle = `
      background-color: ${color};
      width: 14px;
      height: 14px;
      display: block;
      border-radius: 50%;
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 10px ${color};
    `;

    // Define custom marker icon
    const icon = L.divIcon({
      className: 'custom-leaflet-marker',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -7],
      html: `<div style="${iconStyle}" class="${pulseClass}"></div>`
    });

    const marker = L.marker(station.coords, { icon }).addTo(map);
    
    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif; color:#ffffff; padding:2px;">
        <strong style="font-size:13px; font-family:'Outfit',sans-serif;">${station.name}</strong><br>
        <span style="font-size:11px; color:#a1a1aa;">State: ${station.state}</span><br>
        <span style="font-size:11px; font-weight:bold; color:${color};">Risk: ${station.risk_level}</span>
      </div>
    `);

    marker.on('click', () => {
      selectStation(station.id);
    });

    mapMarkers[station.id] = marker;
  });
}

// Select active telemetry station
function selectStation(stationId) {
  const station = STATIONS.find(s => s.id === stationId);
  if (!station) return;
  
  activeStation = station;
  document.getElementById('station-select').value = stationId;

  // Update Metadata Text
  document.getElementById('station-geology').innerText = station.geology;
  document.getElementById('station-elevation').innerText = station.elevation;
  
  const riskBadge = document.getElementById('station-current-risk');
  riskBadge.innerText = station.risk_level;
  riskBadge.className = 'info-value risk-badge ' + getRiskClass(station.risk_level);

  // Update Mini Indicators
  updateMiniSensorCards(station.sensors);

  // Refresh Telemetry Graphs with selected station's historical/live data
  resetAndRebuildCharts(station);

  // Pan map to station
  if (map) {
    map.panTo(station.coords);
  }
}

// Helper to get CSS risk class names
function getRiskClass(level) {
  switch (level.toUpperCase()) {
    case 'CRITICAL': return 'risk-critical';
    case 'HIGH': return 'risk-high';
    case 'MODERATE': return 'risk-moderate';
    default: return 'risk-low';
  }
}

// Update the sensor numeric value cards
function updateMiniSensorCards(sensors) {
  document.getElementById('lbl-rain-24').innerText = `${sensors.rainfall_24h.toFixed(1)} mm`;
  document.getElementById('lbl-soil-sm').innerText = `${sensors.soil_moisture_shallow.toFixed(1)} %`;
  document.getElementById('lbl-displacement').innerText = `${sensors.displacement_rate.toFixed(1)} mm/day`;
  document.getElementById('lbl-slope-tilt').innerText = `${sensors.slope_tilt.toFixed(1)} °`;
}

// 3. Initialize and Setup Telemetry Charts
function resetAndRebuildCharts(station) {
  // Generate 12 historical time points (e.g. past 12 hours)
  const labels = [];
  const rainData = [];
  const cumulativeRainData = [];
  const soilShallowData = [];
  const soilDeepData = [];
  const displacementData = [];

  const now = new Date();
  
  // Seed telemetry histories based on current values
  let cumulativeRainAcc = station.sensors.rainfall_3d - station.sensors.rainfall_24h;
  if (cumulativeRainAcc < 0) cumulativeRainAcc = 10;

  for (let i = 11; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000);
    labels.push(`${t.getHours().toString().padStart(2, '0')}:00`);

    // Simulated historical curves leading to present values
    const progressFactor = (12 - i) / 12; // 0.08 to 1.0
    
    // Rainfall intensity and cumulative rainfall
    const hourRain = (station.sensors.rainfall_24h / 12) * (0.5 + Math.random() * 0.8) * progressFactor;
    rainData.push(parseFloat(hourRain.toFixed(1)));
    
    cumulativeRainAcc += hourRain;
    cumulativeRainData.push(parseFloat(cumulativeRainAcc.toFixed(1)));

    // Soil moisture curves
    const shallowMoist = station.sensors.soil_moisture_shallow * (0.9 + 0.1 * Math.sin(progressFactor * Math.PI));
    const deepMoist = station.sensors.soil_moisture_deep * (0.95 + 0.05 * Math.sin(progressFactor * Math.PI / 2));
    soilShallowData.push(parseFloat(Math.min(shallowMoist, 100).toFixed(1)));
    soilDeepData.push(parseFloat(Math.min(deepMoist, 100).toFixed(1)));

    // Displacement curve
    const disp = station.sensors.displacement_rate * Math.pow(progressFactor, 3) * (0.8 + 0.4 * Math.random());
    displacementData.push(parseFloat(disp.toFixed(2)));
  }

  // Update Rainfall Chart
  if (charts.rainfall) {
    charts.rainfall.data.labels = labels;
    charts.rainfall.data.datasets[0].data = rainData;
    charts.rainfall.data.datasets[1].data = cumulativeRainData;
    charts.rainfall.update();
  } else {
    const ctx = document.getElementById('chart-rainfall').getContext('2d');
    charts.rainfall = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Hourly Rain (mm)',
            data: rainData,
            backgroundColor: 'rgba(96, 165, 250, 0.5)',
            borderColor: '#60a5fa',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Cumulative 3d (mm)',
            data: cumulativeRainData,
            type: 'line',
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } },
          y: { 
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.05)' }, 
            ticks: { color: '#60a5fa', font: { size: 9 } },
            title: { display: true, text: 'Hourly (mm)', color: '#60a5fa', font: { size: 8 } }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#3b82f6', font: { size: 9 } },
            title: { display: true, text: 'Cumulative (mm)', color: '#3b82f6', font: { size: 8 } }
          }
        }
      }
    });
  }

  // Update Soil Moisture Chart
  if (charts.soil) {
    charts.soil.data.labels = labels;
    charts.soil.data.datasets[0].data = soilShallowData;
    charts.soil.data.datasets[1].data = soilDeepData;
    charts.soil.update();
  } else {
    const ctx = document.getElementById('chart-soil').getContext('2d');
    charts.soil = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '0.5m Depth',
            data: soilShallowData,
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            fill: true,
            borderWidth: 2,
            pointRadius: 1,
            tension: 0.3
          },
          {
            label: '1.5m Depth',
            data: soilDeepData,
            borderColor: '#d97706',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } },
          y: { 
            grid: { color: 'rgba(255,255,255,0.05)' }, 
            ticks: { color: '#fbbf24', font: { size: 9 } },
            min: 0, max: 100
          }
        }
      }
    });
  }

  // Update Displacement Chart
  if (charts.displacement) {
    charts.displacement.data.labels = labels;
    charts.displacement.data.datasets[0].data = displacementData;
    charts.displacement.update();
  } else {
    const ctx = document.getElementById('chart-displacement').getContext('2d');
    charts.displacement = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Deformation Rate',
            data: displacementData,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            borderWidth: 2.5,
            pointRadius: 2,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } },
          y: { 
            grid: { color: 'rgba(255,255,255,0.05)' }, 
            ticks: { color: '#f97316', font: { size: 9 } },
            suggestedMin: 0, suggestedMax: 10
          }
        }
      }
    });
  }
}

// 4. Live sensor streaming loop
function startTelemetryStream() {
  if (telemetryInterval) clearInterval(telemetryInterval);
  
  telemetryInterval = setInterval(() => {
    if (simulationActive) {
      runSimulationStep();
    } else {
      // Normal background fluctuations for active station
      const s = activeStation.sensors;
      // Add small random noise
      s.rainfall_24h += Math.max(-0.2, Math.min(0.3, Math.random() * 0.4 - 0.15));
      s.rainfall_3d += Math.max(-0.2, Math.min(0.4, Math.random() * 0.4 - 0.15));
      s.soil_moisture_shallow = Math.max(10, Math.min(100, s.soil_moisture_shallow + (Math.random() * 0.6 - 0.3)));
      s.soil_moisture_deep = Math.max(10, Math.min(100, s.soil_moisture_deep + (Math.random() * 0.3 - 0.15)));
      s.displacement_rate = Math.max(0, s.displacement_rate + (Math.random() * 0.1 - 0.05));
      s.slope_tilt = Math.max(0.1, s.slope_tilt + (Math.random() * 0.05 - 0.025));

      // Append data point to graphs
      appendChartData(s);
      updateMiniSensorCards(s);
      
      // Periodically recalculate station risk
      evaluateStationSelfRisk(activeStation);
    }
  }, 2000);
}

// Add new real-time tick to graphs
function appendChartData(sensors) {
  // Push new and shift old for all active charts
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Rainfall chart update
  if (charts.rainfall) {
    const ds0 = charts.rainfall.data.datasets[0].data;
    const ds1 = charts.rainfall.data.datasets[1].data;
    charts.rainfall.data.labels.shift();
    charts.rainfall.data.labels.push(timeStr);
    ds0.shift();
    ds0.push(parseFloat(Math.max(0, sensors.rainfall_24h / 12).toFixed(1)));
    ds1.shift();
    ds1.push(parseFloat(sensors.rainfall_3d.toFixed(1)));
    charts.rainfall.update();
  }

  // Soil moisture chart update
  if (charts.soil) {
    const ds0 = charts.soil.data.datasets[0].data;
    const ds1 = charts.soil.data.datasets[1].data;
    charts.soil.data.labels.shift();
    charts.soil.data.labels.push(timeStr);
    ds0.shift();
    ds0.push(parseFloat(sensors.soil_moisture_shallow.toFixed(1)));
    ds1.shift();
    ds1.push(parseFloat(sensors.soil_moisture_deep.toFixed(1)));
    charts.soil.update();
  }

  // Displacement chart update
  if (charts.displacement) {
    const ds0 = charts.displacement.data.datasets[0].data;
    charts.displacement.data.labels.shift();
    charts.displacement.data.labels.push(timeStr);
    ds0.shift();
    ds0.push(parseFloat(sensors.displacement_rate.toFixed(2)));
    charts.displacement.update();
  }
}

// Re-calculate the station's risk based on dynamic sensor updates
function evaluateStationSelfRisk(station) {
  const params = {
    rainfall_24h: station.sensors.rainfall_24h,
    rainfall_3d: station.sensors.rainfall_3d,
    soil_moisture: station.sensors.soil_moisture_shallow,
    slope_angle: parseFloat(station.id === 'ST-04' ? '42' : station.id === 'ST-03' ? '38' : '30'), // mock constant slopes
    displacement_rate: station.sensors.displacement_rate,
    seismic_pga: station.sensors.seismic_pga
  };

  const pred = predictLandslideRisk(params);
  
  if (station.risk_level !== pred.alert_level) {
    station.risk_level = pred.alert_level;
    // Redraw markers with the updated alert level
    drawStationMarkers();
    
    // Refresh status indicator
    selectStation(station.id);
    
    // Log bulletin updates
    addRegionalBulletin(station.name, station.state, pred.alert_level, `Dynamic sensors indicate risk transition to ${pred.alert_level}.`);
  }
}

// 5. Landslide sequence simulator
function triggerLandslideSimulation() {
  if (simulationActive) {
    // Reset simulation
    stopLandslideSimulation();
    return;
  }

  simulationActive = true;
  simulationStep = 0;
  simulatedStation = activeStation;

  const btnSim = document.getElementById('btn-simulate-landslide');
  btnSim.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Stopping Sim';
  btnSim.classList.remove('btn-danger');
  btnSim.classList.add('btn-warning');

  // Set system indicator status pulse
  document.getElementById('broadcast-pulse').classList.add('simulating');
  document.getElementById('system-status-indicator').innerHTML = `<i class="fa-solid fa-triangle-exclamation warning-blink"></i> SIMULATION ACTIVE`;
  document.getElementById('system-status-indicator').className = 'meta-val status-orange';

  addRegionalBulletin(simulatedStation.name, simulatedStation.state, "INFO", "Started landslide failure process simulation.");
}

function stopLandslideSimulation() {
  simulationActive = false;
  const btnSim = document.getElementById('btn-simulate-landslide');
  btnSim.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Run Landslide Sim';
  btnSim.classList.remove('btn-warning');
  btnSim.classList.add('btn-danger');

  document.getElementById('broadcast-pulse').classList.remove('simulating');
  document.getElementById('system-status-indicator').innerHTML = `<i class="fa-solid fa-circle-check"></i> Operational`;
  document.getElementById('system-status-indicator').className = 'meta-val status-green';

  muteSiren();

  // Reset station sensors to baseline values
  if (simulatedStation) {
    const original = STATIONS.find(s => s.id === simulatedStation.id);
    if (original) {
      simulatedStation.sensors = { ...original.sensors };
      evaluateStationSelfRisk(simulatedStation);
    }
  }
}

// Sequence of failure steps (representing increasing hazard levels)
function runSimulationStep() {
  if (!simulationActive || !simulatedStation) return;

  simulationStep++;
  const s = simulatedStation.sensors;

  // 6 Simulation steps leading to catastrophic failure
  switch (simulationStep) {
    case 1:
      // Intense cloudburst starts
      s.rainfall_24h += 40;
      s.rainfall_3d += 60;
      s.soil_moisture_shallow = 78;
      addRegionalBulletin(simulatedStation.name, simulatedStation.state, "MODERATE", "Heavy localized cloudburst detected. Runoff levels rising.");
      break;
    case 2:
      // Soil saturating
      s.rainfall_24h += 35;
      s.rainfall_3d += 55;
      s.soil_moisture_shallow = 91;
      s.soil_moisture_deep = 80;
      addRegionalBulletin(simulatedStation.name, simulatedStation.state, "HIGH", "Subsoil moisture saturation capacity exceeded. Pore pressure increasing.");
      break;
    case 3:
      // Early creeping movement
      s.rainfall_24h += 20;
      s.rainfall_3d += 30;
      s.displacement_rate = 4.2;
      s.slope_tilt = 5.2;
      addRegionalBulletin(simulatedStation.name, simulatedStation.state, "HIGH", "Inclinometer triggers primary creep warning. Shear deformation: 4.2 mm/d.");
      break;
    case 4:
      // Tertiary creep (runaway deformation)
      s.displacement_rate = 14.8;
      s.slope_tilt = 12.6;
      addRegionalBulletin(simulatedStation.name, simulatedStation.state, "CRITICAL", "Secondary slope creep observed. Tension cracks propagating at slope crest.");
      break;
    case 5:
      // Extreme movement
      s.displacement_rate = 26.5;
      s.slope_tilt = 24.1;
      // Trigger Siren!
      playSiren();
      showSirenPanel();
      // Auto open SMS alert broadcaster mockup
      dispatchMockSMSAlert(simulatedStation);
      break;
    case 6:
      // Landslide occurred
      s.displacement_rate = 40.0;
      s.slope_tilt = 35.0;
      addRegionalBulletin(simulatedStation.name, simulatedStation.state, "CRITICAL", "Slope failure completed. NH corridor block confirmed. Debris flows active.");
      // Stop the simulation loop
      simulationActive = false;
      const btnSim = document.getElementById('btn-simulate-landslide');
      btnSim.innerHTML = '<i class="fa-solid fa-redo"></i> Reset Station';
      btnSim.classList.remove('btn-warning');
      btnSim.classList.add('btn-primary');
      break;
  }

  // Update indicators
  updateMiniSensorCards(s);
  appendChartData(s);
  evaluateStationSelfRisk(simulatedStation);
}

// 6. Regional Advisories Feed & SMS Simulator
const bulletins = [
  { region: "Gangtok Sector II", state: "Sikkim", type: "MODERATE", text: "NH-10 corridor reporting persistent creep deformation of 1.2 mm/day. Travelers advised to restrict night transit." },
  { region: "Tupul Railway Cut", state: "Manipur", type: "CRITICAL", text: "Weathered Disang Shales saturated. High risk of sliding near railway staging camps. Evacuation recommended." }
];

function initBulletins() {
  const listEl = document.getElementById('advisory-bulletins');
  listEl.innerHTML = '';

  bulletins.forEach(b => {
    const card = document.createElement('div');
    card.className = 'advisory-card';
    
    let color = getRiskColor(b.type);
    
    card.innerHTML = `
      <div class="advisory-meta">
        <span class="advisory-state">${b.region} (${b.state})</span>
        <span class="advisory-time">Active</span>
      </div>
      <div class="advisory-title" style="color:${color}"><i class="fa-solid fa-triangle-exclamation"></i> ${b.type} ALERT</div>
      <p class="advisory-desc">${b.text}</p>
    `;
    listEl.appendChild(card);
  });

  // Update warnings counts
  const criticalCount = bulletins.filter(b => b.type === 'CRITICAL' || b.type === 'HIGH').length;
  document.getElementById('active-warnings-count').innerText = `${criticalCount} Threat Zones`;
}

function addRegionalBulletin(region, state, type, text) {
  bulletins.unshift({ region, state, type, text });
  // Cap at 10 items
  if (bulletins.length > 10) bulletins.pop();
  initBulletins();
}

function dispatchMockSMSAlert(station) {
  const phone = document.getElementById('sms-phone').value || "+91 98300 12345";
  const smsText = `EMERGENCY ALERT (NER-LAMS): ${station.risk_level} Warning in ${station.name}, ${station.state}. Extreme landslide conditions detected. Ground displacement: ${station.sensors.displacement_rate.toFixed(1)} mm/day. Evacuate immediately to designated relief shelters.`;
  
  document.getElementById('phone-sms-text').innerText = smsText;
  
  const now = new Date();
  document.getElementById('phone-sms-time').innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Show modal
  const modal = document.getElementById('phone-alert-modal');
  modal.classList.add('show');
}

// 7. Web Audio API warning siren
function playSiren() {
  if (sirenIsPlaying) return;
  
  try {
    // Initialize AudioContext on user interaction
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Check if context is suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    sirenGainNode = audioContext.createGain();
    sirenGainNode.gain.setValueAtTime(0.0, audioContext.currentTime);
    sirenGainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.5); // moderate volume

    // Create 2 Oscillators for a dual-frequency warning wail
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(550, audioContext.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554, audioContext.currentTime);

    // Apply frequency modulation (wailing sweep)
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1.2; // sweep rate (1.2 Hz)
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 150; // swing frequency +/- 150 Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.connect(sirenGainNode);
    osc2.connect(sirenGainNode);
    sirenGainNode.connect(audioContext.destination);

    lfo.start();
    osc1.start();
    osc2.start();

    sirenOscillators = [osc1, osc2, lfo];
    sirenIsPlaying = true;
  } catch (err) {
    console.warn("Audio Context error", err);
  }
}

function muteSiren() {
  if (!sirenIsPlaying) return;

  if (sirenGainNode) {
    sirenGainNode.gain.setValueAtTime(sirenGainNode.gain.value, audioContext.currentTime);
    sirenGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
  }

  setTimeout(() => {
    sirenOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    sirenOscillators = [];
    sirenIsPlaying = false;
    document.getElementById('siren-alert-panel').style.display = 'none';
  }, 400);
}

function showSirenPanel() {
  document.getElementById('siren-alert-panel').style.display = 'flex';
}

// 8. AI Manual Evaluation Controls & Charts
let xaiChart = null;

function initAISliders() {
  const sliders = [
    { id: 'slide-rain24', labelId: 'val-slide-rain24', key: 'rainfall_24h', suffix: ' mm' },
    { id: 'slide-rain3d', labelId: 'val-slide-rain3d', key: 'rainfall_3d', suffix: ' mm' },
    { id: 'slide-soil', labelId: 'val-slide-soil', key: 'soil_moisture', suffix: ' %' },
    { id: 'slide-angle', labelId: 'val-slide-angle', key: 'slope_angle', suffix: ' °' },
    { id: 'slide-displacement', labelId: 'val-slide-displacement', key: 'displacement_rate', suffix: ' mm/d' },
    { id: 'slide-seismic', labelId: 'val-slide-seismic', key: 'seismic_pga', suffix: ' g' }
  ];

  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    el.addEventListener('input', (e) => {
      document.getElementById(s.labelId).innerText = `${parseFloat(e.target.value).toFixed(s.key === 'seismic_pga' ? 2 : s.key === 'displacement_rate' ? 1 : 0)}${s.suffix}`;
      runAIEvaluation();
    });
  });

  // Initial Run
  runAIEvaluation();
}

function runAIEvaluation() {
  const params = {
    rainfall_24h: parseFloat(document.getElementById('slide-rain24').value),
    rainfall_3d: parseFloat(document.getElementById('slide-rain3d').value),
    soil_moisture: parseFloat(document.getElementById('slide-soil').value),
    slope_angle: parseFloat(document.getElementById('slide-angle').value),
    displacement_rate: parseFloat(document.getElementById('slide-displacement').value),
    seismic_pga: parseFloat(document.getElementById('slide-seismic').value)
  };

  const results = predictLandslideRisk(params);

  // Update radial dial gauge
  const gaugeEl = document.getElementById('lsi-gauge');
  gaugeEl.style.background = `conic-gradient(${results.color} 0% ${results.lsi}%, #27272a ${results.lsi}% 100%)`;
  document.getElementById('lsi-value').innerText = `${results.lsi}%`;
  document.getElementById('lsi-value').style.color = results.color;

  // Update warning status block
  const alertBox = document.getElementById('ai-alert-box');
  const alertText = document.getElementById('ai-alert-level');
  const explanation = document.getElementById('ai-explanation');

  alertText.innerText = `RISK STATUS: ${results.alert_level}`;
  alertBox.style.borderColor = results.color;
  alertBox.style.background = `rgba(${hexToRgb(results.color)}, 0.1)`;
  alertText.style.color = results.color;

  // Render explainable list text description
  let mainDriver = Object.keys(results.featureContributions).reduce((a, b) => results.featureContributions[a] > results.featureContributions[b] ? a : b);
  explanation.innerText = `AI rates risk as ${results.alert_level}. Primary triggering factor is ${mainDriver} (contributing ${results.featureContributions[mainDriver]}% to instability).`;

  // Render XAI Feature Contributions Chart
  renderXAIChart(results.featureContributions, results.color);

  // Render Recommendations list
  const listEl = document.getElementById('ai-recommendations-list');
  listEl.innerHTML = '';
  results.recommendations.forEach(r => {
    const li = document.createElement('li');
    li.innerText = r;
    listEl.appendChild(li);
  });
}

// XAI Feature contributions bar chart
function renderXAIChart(contributions, barColor) {
  const labels = Object.keys(contributions);
  const data = Object.values(contributions);

  if (xaiChart) {
    xaiChart.data.datasets[0].data = data;
    xaiChart.data.datasets[0].backgroundColor = barColor + 'cc';
    xaiChart.data.datasets[0].borderColor = barColor;
    xaiChart.update();
  } else {
    const ctx = document.getElementById('chart-xai').getContext('2d');
    xaiChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: barColor + 'cc',
          borderColor: barColor,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { 
            grid: { display: false }, 
            ticks: { color: '#a1a1aa', font: { size: 8 } },
            max: 100
          },
          y: { 
            grid: { display: false }, 
            ticks: { color: '#f4f4f5', font: { size: 8 } }
          }
        }
      }
    });
  }
}

// Helper to convert hex to rgb for alpha opacity background
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
}

// 9. Historical Database catalog & tab navigations
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle button states
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle tab content panels
      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');

      // Render tab-specific static charts when switching to statistics
      if (targetId === 'tab-analytics') {
        renderAnalyticsCharts();
      }
    });
  });
}

function initHistoricalTable() {
  const tableBody = document.getElementById('db-table-body');
  
  function populateTable(data) {
    tableBody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      
      let riskColor = row.susceptibility_class === 'Very High' ? '#ef4444' : '#f97316';
      
      tr.innerHTML = `
        <td style="font-weight:600; white-space:nowrap;">${row.date}</td>
        <td style="font-weight:600; color:#ffffff;">${row.location}</td>
        <td>${row.state}</td>
        <td style="text-align:center; font-weight:700; color:#ef4444;">${row.casualties}</td>
        <td style="color:#60a5fa;">${row.trigger}</td>
        <td><span class="risk-badge" style="background:rgba(239, 68, 68, 0.1); border:1px solid ${riskColor}; color:${riskColor};">${row.susceptibility_class}</span></td>
        <td style="color:#a1a1aa; font-size:11px;">${row.description}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Populate initially
  populateTable(HISTORICAL_EVENTS);

  // Set up search filter
  const searchInput = document.getElementById('db-search');
  const stateSelect = document.getElementById('filter-state');

  function filterData() {
    const term = searchInput.value.toLowerCase();
    const state = stateSelect.value;

    const filtered = HISTORICAL_EVENTS.filter(e => {
      const matchTerm = e.location.toLowerCase().includes(term) || 
                        e.description.toLowerCase().includes(term) || 
                        e.trigger.toLowerCase().includes(term);
      const matchState = (state === 'all' || e.state === state);
      
      return matchTerm && matchState;
    });

    populateTable(filtered);
  }

  searchInput.addEventListener('input', filterData);
  stateSelect.addEventListener('change', filterData);
}

// Monthly & State analytics charts
let monthlyChart = null;
let stateChart = null;

function renderAnalyticsCharts() {
  if (monthlyChart && stateChart) return; // already rendered

  // Monthly stats chart
  const ctxMonth = document.getElementById('chart-monthly-stats').getContext('2d');
  monthlyChart = new Chart(ctxMonth, {
    type: 'bar',
    data: {
      labels: ANALYTICS_DATA.monthly_distribution.labels,
      datasets: [{
        label: 'Landslide Count',
        data: ANALYTICS_DATA.monthly_distribution.counts,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } }
      }
    }
  });

  // State distribution chart
  const ctxState = document.getElementById('chart-state-stats').getContext('2d');
  stateChart = new Chart(ctxState, {
    type: 'pie',
    data: {
      labels: ANALYTICS_DATA.state_distribution.labels,
      datasets: [{
        data: ANALYTICS_DATA.state_distribution.counts,
        backgroundColor: [
          'rgba(239, 68, 68, 0.75)',  // Sikkim
          'rgba(249, 115, 22, 0.75)',  // Mizoram
          'rgba(236, 72, 153, 0.75)',  // Manipur
          'rgba(139, 92, 246, 0.75)',  // Arunachal
          'rgba(59, 130, 246, 0.75)',  // Assam
          'rgba(16, 185, 129, 0.75)',  // Meghalaya
          'rgba(234, 179, 8, 0.75)'   // Nagaland
        ],
        borderColor: '#18181b',
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#f4f4f5', font: { size: 9 }, boxWidth: 10 }
        }
      }
    }
  });
}

// 10. Forms, Modals & Button click binders
function initUIEvents() {
  // Populate station dropdown
  const dropdown = document.getElementById('station-select');
  dropdown.innerHTML = '';
  STATIONS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.innerText = s.name;
    dropdown.appendChild(opt);
  });

  dropdown.addEventListener('change', (e) => {
    selectStation(e.target.value);
  });

  // Landslide simulation trigger button
  document.getElementById('btn-simulate-landslide').addEventListener('click', triggerLandslideSimulation);

  // SMS Broadcast dispatch simulation form
  document.getElementById('sms-broadcast-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const stationId = document.getElementById('station-select').value;
    const currentStation = STATIONS.find(s => s.id === stationId);
    dispatchMockSMSAlert(currentStation);
  });

  // Close simulated phone overlay
  document.getElementById('btn-close-phone').addEventListener('click', () => {
    document.getElementById('phone-alert-modal').classList.remove('show');
  });

  // Siren mute alarm button
  document.getElementById('btn-mute-siren').addEventListener('click', () => {
    muteSiren();
  });
}

// Document Ready Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();
  initUIEvents();
  
  // Select initial station Gangtok
  selectStation('ST-01');
  
  // Start stream loops
  startTelemetryStream();

  // AI slider configurations
  initAISliders();

  // Historical database components
  initTabs();
  initHistoricalTable();
});
