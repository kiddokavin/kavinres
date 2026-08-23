// MOIL-MEPO Database: Mines, Boreholes, Satellite Indexes, and Historical Telemetry

export const MINES = [
  {
    id: "MN-01",
    name: "Balaghat Mine",
    type: "Underground & Open Cast",
    location: "Balaghat, MP",
    coords: [21.8152, 80.1834],
    description: "MOIL's flagship mine. Deepest underground manganese mine in Asia, producing high-quality dioxide ore used for dry battery and ferro-manganese industries.",
    target_production: 12000, // Tonnes per month
    current_production: 10800,
    constraints: {
      equipment_downtime_hours: 48,
      weather_impact_slippery: "Moderate",
      blasting_delay_days: 2,
      labor_shortage_pct: 8
    },
    equipment: [
      { name: "Excavator EX-101", status: "Active", efficiency: 94 },
      { name: "Dumper DM-304", status: "Maintenance", efficiency: 0 },
      { name: "Hauler HL-08", status: "Active", efficiency: 88 },
      { name: "Crusher CR-02", status: "Active", efficiency: 95 }
    ],
    weather: {
      forecast_rain_mm: 45,
      soil_moisture_pct: 72,
      ndvi_vegetation_index: 0.38,
      land_surface_temp_c: 32
    }
  },
  {
    id: "MN-02",
    name: "Dongri Buzurg Mine",
    type: "Open Cast",
    location: "Bhandara, MH",
    coords: [21.4312, 79.7423],
    description: "Large open-cast operations. Known for battery-grade manganese ore and pyrolusite, utilizing heavy Earth-moving machinery.",
    target_production: 15000,
    current_production: 13200,
    constraints: {
      equipment_downtime_hours: 92, // High downtime
      weather_impact_slippery: "High (Flooding Risk)",
      blasting_delay_days: 4,
      labor_shortage_pct: 12
    },
    equipment: [
      { name: "Excavator EX-202", status: "Active", efficiency: 91 },
      { name: "Dumper DM-501", status: "Critical Failure", efficiency: 0 },
      { name: "Dumper DM-502", status: "Active", efficiency: 85 },
      { name: "Crusher CR-01", status: "Active", efficiency: 92 }
    ],
    weather: {
      forecast_rain_mm: 110, // Extreme rain forecast
      soil_moisture_pct: 94, // Fully saturated
      ndvi_vegetation_index: 0.42,
      land_surface_temp_c: 29
    }
  },
  {
    id: "MN-03",
    name: "Chikla Mine",
    type: "Underground & Open Cast",
    location: "Bhandara, MH",
    coords: [21.4582, 79.7824],
    description: "Located near Nagpur border. Features gondite-series manganese deposits. High recovery factor but restricted by older transport winch lines.",
    target_production: 8500,
    current_production: 8300,
    constraints: {
      equipment_downtime_hours: 12,
      weather_impact_slippery: "Low",
      blasting_delay_days: 0,
      labor_shortage_pct: 4
    },
    equipment: [
      { name: "Excavator EX-105", status: "Active", efficiency: 96 },
      { name: "Dumper DM-208", status: "Active", efficiency: 90 },
      { name: "Crusher CR-03", status: "Active", efficiency: 98 }
    ],
    weather: {
      forecast_rain_mm: 15,
      soil_moisture_pct: 42,
      ndvi_vegetation_index: 0.35,
      land_surface_temp_c: 34
    }
  },
  {
    id: "MN-04",
    name: "Mansar Mine",
    type: "Underground",
    location: "Ramtek, Nagpur, MH",
    coords: [21.3982, 79.2831],
    description: "Underground operations near the Ramtek hills. Produces medium-grade siliceous ores primarily for domestic steel alloy plants.",
    target_production: 6000,
    current_production: 5400,
    constraints: {
      equipment_downtime_hours: 36,
      weather_impact_slippery: "Low",
      blasting_delay_days: 3,
      labor_shortage_pct: 15
    },
    equipment: [
      { name: "Excavator EX-801", status: "Active", efficiency: 89 },
      { name: "Dumper DM-102", status: "Active", efficiency: 82 },
      { name: "Crusher CR-04", status: "Maintenance", efficiency: 0 }
    ],
    weather: {
      forecast_rain_mm: 20,
      soil_moisture_pct: 45,
      ndvi_vegetation_index: 0.28,
      land_surface_temp_c: 35
    }
  }
];

export const BOREHOLES = [
  {
    id: "BH-Balaghat-01",
    name: "Drill Hole BH-B1",
    mine: "Balaghat",
    coords: [21.8210, 80.1870],
    elevation: "320m",
    total_depth: 250, // meters
    avg_grade: 46.5, // Mn %
    recovery_rate: 92.4, // %
    layers: [
      { depth_range: "0m - 20m", lithology: "Alluvium / Overburden", grade: 0 },
      { depth_range: "20m - 90m", lithology: "Weathered Mansar Schist", grade: 12.5 },
      { depth_range: "90m - 210m", lithology: "High-Grade Gondite Orebody", grade: 48.2 },
      { depth_range: "210m - 250m", lithology: "Basal Lohangi Marble", grade: 5.1 }
    ]
  },
  {
    id: "BH-Balaghat-02",
    name: "Drill Hole BH-B2",
    mine: "Balaghat",
    coords: [21.8120, 80.1790],
    elevation: "315m",
    total_depth: 180,
    avg_grade: 38.2,
    recovery_rate: 88.0,
    layers: [
      { depth_range: "0m - 40m", lithology: "Overburden clay", grade: 0 },
      { depth_range: "40m - 150m", lithology: "Medium-Grade Braided Gondite", grade: 39.5 },
      { depth_range: "150m - 180m", lithology: "Pegmatite intrusions", grade: 2.3 }
    ]
  },
  {
    id: "BH-Dongri-01",
    name: "Drill Hole BH-D1",
    mine: "Dongri Buzurg",
    coords: [21.4340, 79.7400],
    elevation: "285m",
    total_depth: 300,
    avg_grade: 42.1,
    recovery_rate: 94.2,
    layers: [
      { depth_range: "0m - 15m", lithology: "Soil & weathered gravel", grade: 0 },
      { depth_range: "15m - 250m", lithology: "Supergene enriched Battery Ore", grade: 45.4 },
      { depth_range: "250m - 300m", lithology: "Quartzite bedrock", grade: 0.5 }
    ]
  }
];

export const RESERVE_POLYGONS = [
  {
    id: "res-balaghat-east",
    name: "Balaghat East Extension Deposit",
    probability: "VERY_HIGH",
    color: "#00bfff", // cyan glowing indicator
    estimated_tonnage: "8.4 Million Tonnes",
    grade_class: "High Grade (>44% Mn)",
    coords: [
      [21.8230, 80.1850],
      [21.8280, 80.1980],
      [21.8150, 80.2050],
      [21.8080, 80.1890]
    ]
  },
  {
    id: "res-dongri-north",
    name: "Dongri Buzurg Deep Reserves",
    probability: "HIGH",
    color: "#ffa500",
    estimated_tonnage: "12.6 Million Tonnes",
    grade_class: "Battery Grade",
    coords: [
      [21.4380, 79.7350],
      [21.4420, 79.7480],
      [21.4280, 79.7550],
      [21.4250, 79.7400]
    ]
  },
  {
    id: "res-chikla-south",
    name: "Chikla South-West Prospect",
    probability: "MODERATE",
    color: "#ffd700",
    estimated_tonnage: "3.2 Million Tonnes",
    grade_class: "Medium Grade (35-44% Mn)",
    coords: [
      [21.4550, 79.7750],
      [21.4600, 79.7890],
      [21.4500, 79.7950],
      [21.4460, 79.7800]
    ]
  }
];

// Production analysis metrics over past 12 months
export const HISTORICAL_SHORTFALLS = {
  timeline: {
    labels: ["Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26"],
    target: [35, 35, 35, 38, 38, 38, 42, 42, 42, 45, 45, 45], // Thousand Tonnes (cumulative target)
    actual: [32, 33.2, 34.8, 37.1, 35.8, 36.4, 41.0, 38.5, 35.2, 31.8, 29.4, 28.5] // shortfalls during monsoon (Jun, Jul, Aug)
  },
  shortfall_drivers: {
    labels: ["Pit Flooding & Slippery Ramps", "Dumper Engine Overheating", "Winch Cable Maintenance", "Blasting Delay (Safety clears)", "Labor Deficiencies"],
    impact_percentages: [42, 26, 14, 11, 7]
  }
};
