import React, { useState, useEffect } from 'react';
import { RawRow, ExperimentAnalysis, AIAnalysisResult } from './types';
import { analyzeExperiment } from './services/statsService';
import { analyzeCausalFactors } from './services/causalService';
import { analyzeExperimentWithAI } from './services/geminiService';
import FileUpload from './components/FileUpload';
import StatCard from './components/StatCard';
import Charts from './components/Charts';
import AIInsights from './components/AIInsights';
import ExecutiveReport from './components/ExecutiveReport';
import { LayoutDashboard, FileText, ArrowLeft, FlaskConical, Github } from 'lucide-react';

enum ViewState {
  Upload = 'UPLOAD',
  Dashboard = 'DASHBOARD',
  Report = 'REPORT'
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.Upload);
  const [loading, setLoading] = useState(false);
  const [experimentData, setExperimentData] = useState<ExperimentAnalysis | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Handle data ingestion
  const handleDataLoaded = async (data: RawRow[]) => {
    setLoading(true);
    try {
      // 1. Run local stats
      const stats = analyzeExperiment(data);
      
      // 2. Run Causal Inference Engine
      const causalFindings = analyzeCausalFactors(data, stats.summary);
      stats.causalFindings = causalFindings;

      setExperimentData(stats);
      setView(ViewState.Dashboard);

      // 3. Trigger AI Analysis
      setIsAiLoading(true);
      const aiResult = await analyzeExperimentWithAI(stats);
      setAiAnalysis(aiResult);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze data");
    } finally {
      setLoading(false);
      setIsAiLoading(false);
    }
  };

  const NavButton = ({ active, label, icon: Icon, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-blue-500/30">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Significance.AI</span>
          </div>

          {view !== ViewState.Upload && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <NavButton 
                label="Analysis Dashboard" 
                icon={LayoutDashboard} 
                active={view === ViewState.Dashboard}
                onClick={() => setView(ViewState.Dashboard)}
              />
              <NavButton 
                label="Executive Report" 
                icon={FileText} 
                active={view === ViewState.Report}
                onClick={() => setView(ViewState.Report)}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
             {view !== ViewState.Upload && (
                 <button 
                    onClick={() => {
                        setView(ViewState.Upload);
                        setExperimentData(null);
                        setAiAnalysis(null);
                    }}
                    className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
                 >
                    <ArrowLeft className="w-3 h-3" /> New Experiment
                 </button>
             )}
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400">PM</span>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {view === ViewState.Upload && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Experiment Intelligence Copilot
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Transform raw A/B test CSVs into statistical insights, causal reasoning, and executive decisions in seconds.
                </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} isLoading={loading} />
          </div>
        )}

        {view === ViewState.Dashboard && experimentData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {experimentData.summary.map((metric) => (
                    <StatCard key={metric.name} metric={metric} />
                ))}
                <div className="p-5 rounded-xl border border-slate-700 bg-slate-900/50 flex flex-col justify-center items-center text-center">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Overall Health</span>
                    <span className={`text-2xl font-bold ${
                        experimentData.overallHealth === 'HEALTHY' ? 'text-green-400' :
                        experimentData.overallHealth === 'WARNING' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                        {experimentData.overallHealth}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">Based on Guardrails</span>
                </div>
            </div>

            {/* Charts & AI Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Charts metrics={experimentData.summary} />
                </div>
                <div className="lg:col-span-1">
                     <div className="h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Sample Breakdown</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm text-slate-400 mb-1">
                                    <span>Control</span>
                                    <span>50%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-600 w-1/2"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm text-slate-400 mb-1">
                                    <span>Treatment</span>
                                    <span>50%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-1/2"></div>
                                </div>
                            </div>
                            <div className="pt-6 mt-6 border-t border-slate-800">
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Segment Impact</h4>
                                <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
                                    Full segment analysis is running in the background. Check AI Insights below for flagged anomalies.
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* AI Analysis Section */}
            <div className="border-t border-slate-800 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6">Decision Intelligence</h2>
                <AIInsights analysis={aiAnalysis} loading={isAiLoading} causalFindings={experimentData.causalFindings} />
            </div>
          </div>
        )}

        {view === ViewState.Report && experimentData && aiAnalysis && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
                <ExecutiveReport data={experimentData} ai={aiAnalysis} />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;