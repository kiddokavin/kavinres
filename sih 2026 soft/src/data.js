// NER-LAMS Monitoring Data, Susceptibility Zones, and Historical Catalog

export const STATIONS = [
  {
    id: "ST-01",
    name: "Gangtok NH-10 Corridor",
    state: "Sikkim",
    coords: [27.3314, 88.6138],
    elevation: "1,650m",
    installed: "2024-04-12",
    status: "active",
    geology: "Sikkim Group Gneiss & Mica Schists",
    description: "Monitors the critical National Highway 10 corridor linking Sikkim to Siliguri. High vulnerability due to steep slope angles and intense monsoon rainfall.",
    sensors: {
      rainfall_24h: 34.5, // mm
      rainfall_3d: 98.2,  // mm
      soil_moisture_shallow: 68.4, // % at 0.5m
      soil_moisture_deep: 52.1,    // % at 1.5m
      displacement_rate: 1.2,      // mm/day
      slope_tilt: 3.1,             // degrees
      seismic_pga: 0.02            // g (Peak Ground Acceleration)
    },
    risk_level: "MODERATE"
  },
  {
    id: "ST-02",
    name: "Shillong Laitlum Slope",
    state: "Meghalaya",
    coords: [25.4485, 91.8922],
    elevation: "1,525m",
    installed: "2024-06-01",
    status: "active",
    geology: "Shillong Group Quartzites & Sandstones",
    description: "Located near the Laitlum canyons. High rainfall zone with high surface runoff and deep soil erosion susceptibility.",
    sensors: {
      rainfall_24h: 12.0,
      rainfall_3d: 42.5,
      soil_moisture_shallow: 41.2,
      soil_moisture_deep: 39.5,
      displacement_rate: 0.1,
      slope_tilt: 0.4,
      seismic_pga: 0.00
    },
    risk_level: "LOW"
  },
  {
    id: "ST-03",
    name: "Aizawl North Ridge",
    state: "Mizoram",
    coords: [23.7534, 92.7165],
    elevation: "1,132m",
    installed: "2024-05-18",
    status: "active",
    geology: "Surma Group Shale & Sandstone intercalations",
    description: "Monitors urban slopes in northern Aizawl. Hilly ridge structure prone to bedding plane failure, compounded by heavy rain and excavation.",
    sensors: {
      rainfall_24h: 88.0,
      rainfall_3d: 210.5,
      soil_moisture_shallow: 85.3,
      soil_moisture_deep: 78.9,
      displacement_rate: 6.4,
      slope_tilt: 12.8,
      seismic_pga: 0.05
    },
    risk_level: "HIGH"
  },
  {
    id: "ST-04",
    name: "Tupul Railway Cut",
    state: "Manipur",
    coords: [24.8715, 93.6821],
    elevation: "890m",
    installed: "2025-01-10",
    status: "active",
    geology: "Disang Shales (highly weathered & argillaceous)",
    description: "Monitors the steep railway excavation slopes near the Tupul station. Very high risk due to weathered shale clay content which loses strength rapidly when wet.",
    sensors: {
      rainfall_24h: 145.2,
      rainfall_3d: 389.0,
      soil_moisture_shallow: 98.4,
      soil_moisture_deep: 95.1,
      displacement_rate: 22.4,
      slope_tilt: 28.5,
      seismic_pga: 0.12
    },
    risk_level: "CRITICAL"
  },
  {
    id: "ST-05",
    name: "Kohima Bypass Road",
    state: "Nagaland",
    coords: [25.6582, 94.0954],
    elevation: "1,444m",
    installed: "2024-09-05",
    status: "active",
    geology: "Barail Group Sandstones & Disang Shales",
    description: "Monitors the Kohima bypass NH-2 segment. Subject to frequent creep and block landslides during the monsoon.",
    sensors: {
      rainfall_24h: 45.0,
      rainfall_3d: 112.4,
      soil_moisture_shallow: 72.1,
      soil_moisture_deep: 65.4,
      displacement_rate: 2.1,
      slope_tilt: 4.8,
      seismic_pga: 0.01
    },
    risk_level: "MODERATE"
  },
  {
    id: "ST-06",
    name: "Tawang Pass Sela Corridor",
    state: "Arunachal Pradesh",
    coords: [27.5023, 92.1035],
    elevation: "3,800m",
    installed: "2024-10-22",
    status: "active",
    geology: "High-grade Gneiss & Granitoids (subject to freeze-thaw)",
    description: "Monitors the high-altitude pass slopes leading to Tawang. Affected by freeze-thaw cycles, slope instability, and sudden snowmelt runoff triggers.",
    sensors: {
      rainfall_24h: 4.5,
      rainfall_3d: 14.2,
      soil_moisture_shallow: 22.5,
      soil_moisture_deep: 19.8,
      displacement_rate: 0.0,
      slope_tilt: 0.1,
      seismic_pga: 0.00
    },
    risk_level: "LOW"
  }
];

// Landslide Susceptibility Zones (LSZ) coordinates for map rendering (Polygons)
export const LSZ_POLYGONS = [
  {
    id: "zone-sikkim",
    name: "Sikkim NH-10 Critical Zone",
    risk: "VERY_HIGH",
    color: "#ff3333",
    coords: [
      [27.42, 88.52],
      [27.45, 88.65],
      [27.30, 88.70],
      [27.22, 88.58],
      [27.28, 88.48]
    ]
  },
  {
    id: "zone-aizawl",
    name: "Aizawl Urban Slopes Zone",
    risk: "HIGH",
    color: "#ff9900",
    coords: [
      [23.82, 92.68],
      [23.80, 92.76],
      [23.70, 92.75],
      [23.68, 92.69],
      [23.74, 92.65]
    ]
  },
  {
    id: "zone-tupul",
    name: "Tupul-Noney Manipur Rail Route",
    risk: "VERY_HIGH",
    color: "#ff3333",
    coords: [
      [24.95, 93.58],
      [24.93, 93.75],
      [24.80, 93.76],
      [24.78, 93.60],
      [24.85, 93.55]
    ]
  },
  {
    id: "zone-shillong",
    name: "Shillong Ridge & Laitlum",
    risk: "MODERATE",
    color: "#ffcc00",
    coords: [
      [25.62, 91.80],
      [25.60, 92.00],
      [25.40, 92.02],
      [25.38, 91.82]
    ]
  }
];

// Historical Landslide Event Catalog for NER
export const HISTORICAL_EVENTS = [
  {
    id: "hist-01",
    date: "2024-05-28",
    location: "Aizawl District (Melthum, Hlimen, etc.)",
    state: "Mizoram",
    casualties: 34,
    trigger: "Heavy Rain (Cyclone Remal)",
    description: "Multiple severe landslides triggered by unprecedented rainfall from Cyclone Remal. Swaths of houses on steep slopes collapsed in several urban pockets.",
    susceptibility_class: "Very High"
  },
  {
    id: "hist-02",
    date: "2022-06-30",
    location: "Tupul Railway Construction Site, Noney",
    state: "Manipur",
    casualties: 61,
    trigger: "Monsoon rains & slope cutting",
    description: "One of the most devastating landslides in NER history, striking a territorial army camp and railway construction base. Triggered by continuous rain destabilizing heavily excavated shale slopes.",
    susceptibility_class: "Very High"
  },
  {
    id: "hist-03",
    date: "2020-06-02",
    location: "South Assam Hills (Cachar, Hailakandi, Karimganj)",
    state: "Assam",
    casualties: 30,
    trigger: "Intense Monsoon Rainfall",
    description: "Multiple landslides occurred simultaneously in three districts of southern Assam following heavy monsoon downpours, burying residential dwellings.",
    susceptibility_class: "High"
  },
  {
    id: "hist-04",
    date: "2018-06-14",
    location: "Lunglei and Aizawl",
    state: "Mizoram",
    casualties: 12,
    trigger: "Continuous Pre-monsoon Deluge",
    description: "Several structures collapsed along structural joint planes in sandstone layers. Communication and power lines were severed for weeks.",
    susceptibility_class: "High"
  },
  {
    id: "hist-05",
    date: "2017-07-11",
    location: "Laptap Village, Papum Pare",
    state: "Arunachal Pradesh",
    casualties: 14,
    trigger: "Torrential Rain",
    description: "A sudden, massive landslide swept away an entire settlement of houses on a saturated hill. Debris clearance was hampered by persistent mudflows.",
    susceptibility_class: "High"
  },
  {
    id: "hist-06",
    date: "2015-06-30",
    location: "Darjeeling and Kalimpong Hills",
    state: "West Bengal (NER boundary)",
    casualties: 38,
    trigger: "Cloudburst / Extreme Precipitation",
    description: "Scores of landslides blocked the NH-10 corridor, isolating Sikkim. Destabilized soil on terraced tea garden slopes liquified into mudflows.",
    susceptibility_class: "Very High"
  }
];

// Historical Analytics Data for Graphs
export const ANALYTICS_DATA = {
  // Landslide occurrences by month (NER is monsoon dominated)
  monthly_distribution: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    counts: [1, 0, 2, 5, 18, 48, 65, 52, 38, 11, 2, 0]
  },
  // Distribution of recorded major events by State (past 10 years)
  state_distribution: {
    labels: ["Sikkim", "Mizoram", "Manipur", "Arunachal", "Assam (Hills)", "Meghalaya", "Nagaland"],
    counts: [42, 35, 28, 24, 21, 15, 12]
  }
};
