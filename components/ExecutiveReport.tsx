import React from 'react';
import { ExperimentAnalysis, AIAnalysisResult } from '../types';
import { Printer } from 'lucide-react';

interface ExecutiveReportProps {
  data: ExperimentAnalysis;
  ai: AIAnalysisResult;
}

const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ data, ai }) => {
  return (
    <div className="bg-white text-slate-900 p-12 max-w-4xl mx-auto rounded-none shadow-2xl relative min-h-[1100px]">
      {/* Print Button (Hidden in Print) */}
      <button 
        onClick={() => window.print()}
        className="absolute -top-16 right-0 print:hidden bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print to PDF
      </button>

      {/* Header */}
      <div className="border-b border-slate-200 pb-8 mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{data.name}</h1>
            <p className="text-slate-500 font-medium">Experiment Analysis Report</p>
        </div>
        <div className="text-right">
            <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1 inline-block rounded mb-1">
                CONFIDENTIAL
            </div>
            <p className="text-slate-400 text-xs">Generated via Significance.AI</p>
            <p className="text-slate-400 text-xs">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`p-6 rounded-lg mb-8 flex items-center justify-between ${
          ai.recommendation === 'SHIP' ? 'bg-green-50 border border-green-200' :
          ai.recommendation === 'ITERATE' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
      }`}>
        <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Final Recommendation</span>
            <h2 className={`text-2xl font-bold ${
                ai.recommendation === 'SHIP' ? 'text-green-700' :
                ai.recommendation === 'ITERATE' ? 'text-yellow-700' : 'text-red-700'
            }`}>
                {ai.recommendation}
            </h2>
        </div>
        <div className="text-right">
             <span className="block text-2xl font-bold text-slate-800">{ai.confidenceScore}%</span>
             <span className="text-xs text-slate-500">Confidence Score</span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-10">
        <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wider">Executive Summary</h3>
        <p className="text-slate-800 leading-relaxed text-justify">
            {ai.executiveSummary}
        </p>
      </div>

      {/* Key Metrics Table */}
      <div className="mb-10">
        <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wider">Statistical Performance</h3>
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                    <th className="py-3 px-4 font-semibold">Metric</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Control</th>
                    <th className="py-3 px-4 font-semibold">Treatment</th>
                    <th className="py-3 px-4 font-semibold text-right">Lift</th>
                    <th className="py-3 px-4 font-semibold text-right">Confidence</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.summary.map((m, i) => (
                    <tr key={i}>
                        <td className="py-3 px-4 font-medium text-slate-900">{m.name}</td>
                        <td className="py-3 px-4 text-xs">
                             <span className={`px-2 py-0.5 rounded-full ${
                                m.type === 'PRIMARY' ? 'bg-blue-100 text-blue-700' :
                                m.type === 'GUARDRAIL' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                             }`}>
                                {m.type}
                             </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{m.controlMean.toFixed(3)}</td>
                        <td className="py-3 px-4 text-slate-600">{m.treatmentMean.toFixed(3)}</td>
                        <td className={`py-3 px-4 font-bold text-right ${m.lift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.lift > 0 ? '+' : ''}{m.lift.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                            {m.isSignificant ? '95%+' : '< 90%'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Causal Analysis */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wider">Causal Analysis & Risks</h3>
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
            <ul className="space-y-2">
                {ai.causalInsights.map((insight, idx) => (
                    <li key={idx} className="text-slate-700 text-sm flex gap-2">
                        <span className="font-bold">•</span> {insight}
                    </li>
                ))}
            </ul>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-12 left-12 right-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400">
        <span>Significance.AI • Product Intelligence Platform</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
};

export default ExecutiveReport;