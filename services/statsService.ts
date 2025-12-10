import { RawRow, MetricResult, MetricType, ExperimentAnalysis } from '../types';

// Helper to calculate standard deviation
const calculateStdDev = (values: number[], mean: number): number => {
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

// Helper for Z-Test (Proportions) or T-Test (Means) approximation
export const calculateSignificance = (
  control: number[],
  treatment: number[]
): { pValue: number; lift: number; ci: [number, number]; meanC: number; meanT: number } => {
  const n1 = control.length;
  const n2 = treatment.length;
  
  if (n1 === 0 || n2 === 0) return { pValue: 1, lift: 0, ci: [0,0], meanC: 0, meanT: 0 };

  const mean1 = control.reduce((a, b) => a + b, 0) / n1;
  const mean2 = treatment.reduce((a, b) => a + b, 0) / n2;

  const var1 = control.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / n1;
  const var2 = treatment.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / n2;

  // Standard Error of Difference
  const se = Math.sqrt((var1 / n1) + (var2 / n2));
  
  // Z-Score
  const z = se === 0 ? 0 : (mean2 - mean1) / se;

  // Two-tailed P-value approximation
  const pValue = Math.exp(-0.717 * z - 0.416 * z * z); // Simple approximation for demo

  // Confidence Interval (95%)
  const marginOfError = 1.96 * se;
  const ci: [number, number] = [
    (mean2 - mean1) - marginOfError,
    (mean2 - mean1) + marginOfError
  ];

  const lift = mean1 === 0 ? 0 : ((mean2 - mean1) / mean1) * 100;

  return { pValue: Math.max(0, Math.min(1, pValue)), lift, ci, meanC: mean1, meanT: mean2 };
};

export const analyzeExperiment = (data: RawRow[]): ExperimentAnalysis => {
  const controlData = data.filter(r => r.variant === 'control');
  const treatmentData = data.filter(r => r.variant === 'treatment');

  const metricsToAnalyze = [
    { key: 'conversion', name: 'Conversion Rate', type: MetricType.Primary },
    { key: 'revenue', name: 'Avg. Revenue Per User', type: MetricType.Secondary },
    { key: 'retention_day_7', name: 'Retention (D7)', type: MetricType.Guardrail },
  ];

  const summary: MetricResult[] = metricsToAnalyze.map(m => {
    // @ts-ignore - dynamic key access for demo
    const cVals = controlData.map(d => Number(d[m.key]));
    // @ts-ignore
    const tVals = treatmentData.map(d => Number(d[m.key]));

    const stats = calculateSignificance(cVals, tVals);

    return {
      name: m.name,
      type: m.type,
      controlMean: stats.meanC,
      treatmentMean: stats.meanT,
      lift: stats.lift,
      pValue: stats.pValue,
      confidenceInterval: stats.ci,
      isSignificant: stats.pValue < 0.05,
      sampleSize: data.length
    };
  });

  // Simple automated health check
  const guardrail = summary.find(s => s.type === MetricType.Guardrail);
  let overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  
  if (guardrail && guardrail.lift < -5 && guardrail.isSignificant) {
    overallHealth = 'CRITICAL';
  } else if (guardrail && guardrail.lift < 0) {
    overallHealth = 'WARNING';
  }

  return {
    id: `exp_${Date.now()}`,
    name: 'Checkout Flow Redesign V2',
    summary,
    segments: {
      dimension: 'device',
      results: {} // Simplified for demo brevity
    },
    overallHealth,
    causalFindings: [] // Will be populated by CausalService
  };
};

export const generateMockData = (count: number = 2000): RawRow[] => {
  const data: RawRow[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const isControl = Math.random() > 0.5;
    const variant = isControl ? 'control' : 'treatment';
    
    // Simulate: Treatment has better conversion but slightly lower retention (trade-off)
    const baseConv = 0.12;
    // Introduce slight novelty effect: better performance in early dates
    // Date generation logic later determines this
    const effectConv = isControl ? 0 : 0.03; 
    
    const baseRev = 25;
    const effectRev = isControl ? 0 : 4;
    
    const baseRet = 0.60;
    const effectRet = isControl ? 0 : -0.02; // -2% absolute drop

    // Generate random timestamp within last 14 days
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Dynamic effect based on time (Novelty simulation)
    // If daysAgo is small (recent), effect is smaller. If daysAgo is large (older), effect is larger (Novelty wore off? No, usually novelty means start strong then drop)
    // Let's simulate: Old days (10-14 days ago) -> High Lift. Recent days (0-3 days ago) -> Low Lift.
    let timeBasedModifier = 1;
    if (!isControl && daysAgo < 4) {
         timeBasedModifier = 0.5; // Decay in recent days
    }

    // Simulate Simpson's Paradox capability (Device confounding)
    // Let's make Desktop users convert better, but Treatment gets more Mobile users (who convert worse)
    const isDesktop = Math.random() > 0.6; // 40% Desktop
    const device = isDesktop ? 'desktop' : 'mobile';
    
    // Confounder injection: Treatment gets slightly more mobile users (lower converting) randomly?
    // For now we keep it random to avoid forcing the paradox every time, relying on the engine to catch it if it happens.

    const finalConvChance = (baseConv + (effectConv * timeBasedModifier)) * (isDesktop ? 1.5 : 0.8);

    data.push({
      user_id: `u_${i}`,
      variant,
      conversion: Math.random() < finalConvChance ? 1 : 0,
      revenue: Math.max(0, (Math.random() * 50) + (Math.random() < finalConvChance ? (baseRev + effectRev) : 0)),
      retention_day_7: Math.random() < (baseRet + effectRet) ? 1 : 0,
      country: Math.random() > 0.7 ? 'US' : 'UK',
      device: device,
      timestamp: date.toISOString()
    });
  }
  return data;
};