export enum ExperimentStatus {
  Draft = 'DRAFT',
  Running = 'RUNNING',
  Concluded = 'CONCLUDED',
  Analyzed = 'ANALYZED'
}

export enum MetricType {
  Primary = 'PRIMARY',
  Guardrail = 'GUARDRAIL',
  Secondary = 'SECONDARY'
}

export enum InsightType {
  Statistical = 'STATISTICAL',
  Causal = 'CAUSAL',
  Recommendation = 'RECOMMENDATION'
}

export interface RawRow {
  user_id: string;
  variant: 'control' | 'treatment';
  conversion: number; // 0 or 1
  revenue: number;
  retention_day_7: number; // 0 or 1
  country: string;
  device: string;
  timestamp: string; // ISO Date string
}

export interface MetricResult {
  name: string;
  type: MetricType;
  controlMean: number;
  treatmentMean: number;
  lift: number; // percentage
  pValue: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
  sampleSize: number;
}

export interface CausalFinding {
  id: string;
  type: 'SIMPSONS_PARADOX' | 'SELECTION_BIAS' | 'CANNIBALIZATION' | 'NOVELTY_EFFECT' | 'CONFOUNDER' | 'SEASONALITY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  segment?: string;
  metric?: string;
}

export interface ExperimentAnalysis {
  id: string;
  name: string;
  summary: MetricResult[];
  segments: {
    dimension: string;
    results: Record<string, MetricResult[]>;
  };
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  causalFindings: CausalFinding[];
}

export interface AIAnalysisResult {
  executiveSummary: string;
  recommendation: 'SHIP' | 'ITERATE' | 'ROLLBACK';
  confidenceScore: number;
  keyRisks: string[];
  causalInsights: string[];
}