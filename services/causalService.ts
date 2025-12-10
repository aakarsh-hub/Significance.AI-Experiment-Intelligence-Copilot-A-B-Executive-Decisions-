import { RawRow, MetricResult, CausalFinding, MetricType } from '../types';
import { calculateSignificance } from './statsService';

/**
 * Causal Reasoning Engine
 * 
 * This module detects:
 * 1. Simpson's Paradox (Trend Reversal in Segments)
 * 2. Selection Bias / Sample Ratio Mismatch (SRM)
 * 3. Cannibalization (Primary up, Guardrail down)
 * 4. Novelty Effects (Declining lift over time)
 */

export const analyzeCausalFactors = (data: RawRow[], metrics: MetricResult[]): CausalFinding[] => {
  const findings: CausalFinding[] = [];

  // 1. Check for Sample Ratio Mismatch (Selection Bias)
  const checkSRM = () => {
    const total = data.length;
    // SRM checks are sensitive. We need a decent sample size to be confident it's not just noise.
    if (total < 100) return; 

    const controlCount = data.filter(r => r.variant === 'control').length;
    const treatmentCount = data.filter(r => r.variant === 'treatment').length;
    
    // Expected is 50/50 split
    const expected = total / 2;
    
    // Chi-Square Test for Goodness of Fit (df=1)
    // X^2 = sum( (Observed - Expected)^2 / Expected )
    const chiSquare = (Math.pow(controlCount - expected, 2) / expected) + 
                      (Math.pow(treatmentCount - expected, 2) / expected);
    
    // Critical Values for df=1:
    // p = 0.05  => 3.841
    // p = 0.01  => 6.635
    // p = 0.001 => 10.828

    const controlPct = ((controlCount / total) * 100).toFixed(1);
    const treatmentPct = ((treatmentCount / total) * 100).toFixed(1);
    const splitText = `${controlPct}% / ${treatmentPct}%`;

    if (chiSquare > 10.83) {
      findings.push({
        id: 'srm_bias_critical',
        type: 'SELECTION_BIAS',
        severity: 'HIGH',
        title: 'Critical Sample Ratio Mismatch (SRM)',
        description: `Severe traffic imbalance detected (${splitText}). The deviation from 50/50 is statistically impossible by chance (p < 0.001). This invalidates the experiment results as it indicates a broken randomization mechanism.`,
      });
    } else if (chiSquare > 6.63) {
       findings.push({
        id: 'srm_bias_high',
        type: 'SELECTION_BIAS',
        severity: 'HIGH',
        title: 'Significant Sample Ratio Mismatch',
        description: `Traffic assignment is significantly skewed (${splitText}, p < 0.01). This strongly suggests Selection Bias. Results are likely invalid.`,
      });
    } else if (chiSquare > 3.84) {
      findings.push({
        id: 'srm_bias_warning',
        type: 'SELECTION_BIAS',
        severity: 'MEDIUM',
        title: 'Potential Sample Ratio Mismatch',
        description: `Traffic split (${splitText}) shows a statistically significant deviation (p < 0.05). Verify randomization implementation.`,
      });
    }
  };

  // 2. Check for Simpson's Paradox
  const checkSimpsonsParadox = () => {
    const primaryMetric = metrics.find(m => m.type === MetricType.Primary);
    if (!primaryMetric || !primaryMetric.isSignificant) return;

    const globalLiftIsPositive = primaryMetric.lift > 0;
    // Dimensions to check for confounding
    const dimensions = ['device', 'country'];

    dimensions.forEach(dim => {
      // @ts-ignore
      const values = [...new Set(data.map(d => d[dim]))] as string[];
      let reversalCount = 0;
      let totalSegments = 0;

      values.forEach(val => {
        // @ts-ignore
        const segmentData = data.filter(d => d[dim] === val);
        if (segmentData.length < 20) return; // Skip small segments

        totalSegments++;
        const control = segmentData.filter(d => d.variant === 'control').map(d => d.conversion);
        const treatment = segmentData.filter(d => d.variant === 'treatment').map(d => d.conversion);
        
        const stats = calculateSignificance(control, treatment);
        const segmentLiftIsPositive = stats.lift > 0;

        // If the segment direction contradicts the global direction
        // And the segment finding itself is somewhat strong (low p-value check, relaxed to 0.2 for detection)
        if (globalLiftIsPositive !== segmentLiftIsPositive) { 
          reversalCount++;
        }
      });

      // If a majority of segments show the opposite trend, or if all show opposite
      if (totalSegments > 0 && (reversalCount === totalSegments || reversalCount > totalSegments * 0.6)) {
        findings.push({
          id: `simpson_${dim}`,
          type: 'SIMPSONS_PARADOX',
          severity: 'HIGH',
          title: `Simpson's Paradox detected in ${dim}`,
          description: `Global results show ${globalLiftIsPositive ? 'positive' : 'negative'} lift, but most ${dim} segments show the opposite. This suggests ${dim} is a confounding variable skewing the data. Rely on segment-level analysis.`,
          segment: dim
        });
      }
    });
  };

  // 3. Check for Cannibalization
  const checkCannibalization = () => {
    const primary = metrics.find(m => m.type === MetricType.Primary);
    const guardrail = metrics.find(m => m.type === MetricType.Guardrail);
    const secondary = metrics.find(m => m.type === MetricType.Secondary);

    if (primary && primary.lift > 0 && primary.isSignificant) {
        if (guardrail && guardrail.lift < 0 && guardrail.isSignificant) {
            findings.push({
                id: 'cannibal_guardrail',
                type: 'CANNIBALIZATION',
                severity: 'HIGH',
                title: 'Guardrail Cannibalization',
                description: `Primary metric '${primary.name}' is up, but guardrail metric '${guardrail.name}' has significantly degraded. Gains may be short-term or illusory.`,
                metric: guardrail.name
            });
        }
        if (secondary && secondary.lift < -5 && secondary.isSignificant) {
            findings.push({
                id: 'cannibal_secondary',
                type: 'CANNIBALIZATION',
                severity: 'MEDIUM',
                title: 'Metric Trade-off Detected',
                description: `Improvement in '${primary.name}' is coming at the cost of '${secondary.name}' (dropped ${secondary.lift.toFixed(1)}%).`,
                metric: secondary.name
            });
        }
    }
  };

  // 4. Check for Novelty Effect
  const checkNoveltyEffect = () => {
    const primary = metrics.find(m => m.type === MetricType.Primary);
    if (!primary || !primary.isSignificant || data.length < 100) return;

    // Sort by timestamp
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Compare first 20% vs last 20%
    const sliceSize = Math.floor(sortedData.length * 0.2);
    if (sliceSize < 20) return;

    const earlyData = sortedData.slice(0, sliceSize);
    const lateData = sortedData.slice(-sliceSize);

    const getLift = (subset: RawRow[]) => {
       const c = subset.filter(r => r.variant === 'control').map(r => r.conversion);
       const t = subset.filter(r => r.variant === 'treatment').map(r => r.conversion);
       return calculateSignificance(c, t).lift;
    };

    const earlyLift = getLift(earlyData);
    const lateLift = getLift(lateData);

    // If early lift was strong positive, but late lift is much lower (or negative)
    if (earlyLift > 5 && lateLift < (earlyLift * 0.5)) {
        findings.push({
            id: 'novelty_decay',
            type: 'NOVELTY_EFFECT',
            severity: 'MEDIUM',
            title: 'Novelty Effect (Benefit Decay)',
            description: `The treatment effect is wearing off. Early lift was ${earlyLift.toFixed(1)}%, but recent lift is only ${lateLift.toFixed(1)}%. Users might be acclimating to the change.`,
        });
    }
  };

  checkSRM();
  checkSimpsonsParadox();
  checkCannibalization();
  checkNoveltyEffect();

  return findings;
};