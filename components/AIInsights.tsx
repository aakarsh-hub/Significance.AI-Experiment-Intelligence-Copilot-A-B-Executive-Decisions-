import React from 'react';
import { AIAnalysisResult, CausalFinding } from '../types';
import { Bot, Lightbulb, ShieldAlert, BrainCircuit, PlayCircle, SkipForward, RotateCcw, Microscope, AlertOctagon } from 'lucide-react';

interface AIInsightsProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  causalFindings?: CausalFinding[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ analysis, loading, causalFindings = [] }) => {
  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 border border-slate-800 bg-slate-900/30 rounded-2xl animate-pulse">
        <BrainCircuit className="w-10 h-10 text-blue-500 animate-spin-slow" />
        <p className="text-slate-400 text-sm font-medium">Generating Causal Models & Recommendations...</p>
      </div>
    );
  }

  if (!analysis) return null;

  const RecIcon = 
    analysis.recommendation === 'SHIP' ? PlayCircle :
    analysis.recommendation === 'ITERATE' ? SkipForward : RotateCcw;

  const recColor = 
    analysis.recommendation === 'SHIP' ? 'text-green-400 bg-green-900/20 border-green-500/30' :
    analysis.recommendation === 'ITERATE' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' : 
    'text-red-400 bg-red-900/20 border-red-500/30';

  return (
    <div className="space-y-6">
      {/* Top Recommender */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`col-span-1 p-6 rounded-2xl border ${recColor} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 opacity-75" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">AI Recommendation</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{analysis.recommendation}</h2>
          </div>
          <div className="mt-4">
             <div className="flex justify-between text-xs mb-1 opacity-75">
                <span>Confidence Score</span>
                <span>{analysis.confidenceScore}%</span>
             </div>
             <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-current transition-all duration-1000 ease-out" 
                    style={{ width: `${analysis.confidenceScore}%` }}
                ></div>
             </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Executive Summary
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                {analysis.executiveSummary}
            </p>
        </div>
      </div>

      {/* Causal Engine Findings (Programmatic) */}
      {causalFindings.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
             <div className="p-5 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                 <h4 className="text-purple-300 font-medium flex items-center gap-2 mb-4">
                    <Microscope className="w-5 h-5" />
                    Causal Engine Detected Issues
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {causalFindings.map((finding) => (
                         <div key={finding.id} className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/10 flex gap-3">
                             <AlertOctagon className={`w-5 h-5 flex-shrink-0 ${
                                 finding.severity === 'HIGH' ? 'text-red-400' : 'text-yellow-400'
                             }`} />
                             <div>
                                 <h5 className="text-sm font-bold text-slate-200">{finding.title}</h5>
                                 <p className="text-xs text-slate-400 mt-1 leading-relaxed">{finding.description}</p>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
          </div>
      )}

      {/* Deep Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h4 className="text-slate-200 font-medium flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                Risk Factors
            </h4>
            <ul className="space-y-3">
                {analysis.keyRisks.map((risk, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-400">
                        <span className="text-orange-500/50">•</span>
                        {risk}
                    </li>
                ))}
            </ul>
         </div>

         <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h4 className="text-slate-200 font-medium flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                AI Causal Reasoning
            </h4>
            <ul className="space-y-3">
                {analysis.causalInsights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-400">
                         <span className="text-purple-500/50">•</span>
                        {insight}
                    </li>
                ))}
            </ul>
         </div>
      </div>
    </div>
  );
};

export default AIInsights;