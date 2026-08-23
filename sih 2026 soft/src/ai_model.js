// AI Susceptibility Engine - Simulates Landslide Susceptibility Index (LSI)
// and returns Explainable AI (XAI) feature contributions.

export function predictLandslideRisk(parameters) {
  const {
    rainfall_24h,       // mm
    rainfall_3d,        // mm
    soil_moisture,      // % saturation
    slope_angle,        // degrees
    displacement_rate,  // mm/day
    seismic_pga         // g (Peak Ground Acceleration)
  } = parameters;

  // Weight coefficients representing the relative importance of factors in the landslide model
  // (In a real model, these are learned from historical landslide events)
  const weights = {
    rainfall_24h: 0.22,
    rainfall_3d: 0.18,
    soil_moisture: 0.15,
    slope_angle: 0.12,
    displacement_rate: 0.23,
    seismic_pga: 0.10
  };

  // Normalize inputs to [0, 1] range based on typical physical hazard thresholds
  // 150mm is extremely heavy 24h rainfall
  const norm_rf_24h = Math.min(rainfall_24h / 150, 1.0);
  
  // 350mm is extremely saturated 3-day antecedent rainfall
  const norm_rf_3d = Math.min(rainfall_3d / 350, 1.0);
  
  // Soil moisture percentage
  const norm_sm = Math.min(soil_moisture / 100, 1.0);
  
  // Slopes > 45 degrees are highly unstable (normalized around steepness)
  const norm_slope = Math.min(slope_angle / 45, 1.0);
  
  // Displacement rates > 25 mm/day represent tertiary creep/imminent failure
  const norm_disp = Math.min(displacement_rate / 25, 1.0);
  
  // Seismic Peak Ground Acceleration > 0.25g is a severe earthquake trigger
  const norm_seismic = Math.min(seismic_pga / 0.25, 1.0);

  // Compute individual weighted hazard scores (raw values for feature importance)
  const rawContributions = {
    "24h Rainfall": norm_rf_24h * weights.rainfall_24h,
    "3-day Cumulative Rainfall": norm_rf_3d * weights.rainfall_3d,
    "Soil Saturation": norm_sm * weights.soil_moisture,
    "Slope Gradient": norm_slope * weights.slope_angle,
    "Displacement Velocity": norm_disp * weights.displacement_rate,
    "Seismic Ground Acceleration": norm_seismic * weights.seismic_pga
  };

  // Calculate overall Landslide Susceptibility Index (LSI) in range [0, 100%]
  let totalScore = 0;
  for (const key in rawContributions) {
    totalScore += rawContributions[key];
  }
  
  const lsi = Math.min(Math.round(totalScore * 100), 100);

  // Determine Warning Level and Recommendations
  let alert_level = "LOW";
  let color = "#10b981"; // neon green
  let recommendations = [];
  
  if (lsi < 30) {
    alert_level = "LOW";
    color = "#10b981";
    recommendations = [
      "Normal monitoring routines active.",
      "Weather conditions are stable; no immediate hazard detected."
    ];
  } else if (lsi >= 30 && lsi < 55) {
    alert_level = "MODERATE";
    color = "#eab308"; // bright yellow
    recommendations = [
      "Increase observation frequency of telemetered rain gauges.",
      "Advise road maintenance crews to watch for minor debris on NH highway segments.",
      "Verify backup power lines and regional communications."
    ];
  } else if (lsi >= 55 && lsi < 75) {
    alert_level = "HIGH";
    color = "#f97316"; // bright orange
    recommendations = [
      "Issue Regional Advisory: Restrict heavy vehicle transport on critical corridors.",
      "Trigger warning alerts to village disaster management committees.",
      "Prepare emergency services and locate transit shelter points.",
      "Closely monitor active creep zones for cracking or slope toe seepages."
    ];
  } else {
    alert_level = "CRITICAL";
    color = "#ef4444"; // glowing red
    recommendations = [
      "IMMEDIATE EVACUATION: Deploy sirens and alert broadcasts for vulnerable downhill settlements.",
      "Close highway corridors (NH-10/NH-2) to all traffic.",
      "Dispatch search & rescue teams to high-readiness staging areas.",
      "Automatic fail-safe protocols triggered for critical infrastructure (railway cuts, bridges)."
    ];
  }

  // Calculate percentage contributions for explainable AI (XAI)
  const sumContributions = Object.values(rawContributions).reduce((a, b) => a + b, 0);
  const featureContributions = {};
  
  for (const key in rawContributions) {
    // Avoid division by zero
    const pct = sumContributions > 0 
      ? Math.round((rawContributions[key] / sumContributions) * 100) 
      : 0;
    featureContributions[key] = pct;
  }

  return {
    lsi,
    alert_level,
    color,
    recommendations,
    featureContributions
  };
}
