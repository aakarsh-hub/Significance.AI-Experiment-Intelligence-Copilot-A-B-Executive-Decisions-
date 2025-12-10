import React from 'react';
import { MetricResult, MetricType } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatCardProps {
  metric: MetricResult;
}

const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  const isPositive = metric.lift > 0;
  const isNeutral = metric.lift === 0;
  const isBad = metric.type === MetricType.Guardrail && metric.lift < 0 && metric.isSignificant;

  let ColorIcon = isPositive ? TrendingUp : TrendingDown;
  if (isNeutral) ColorIcon = Minus;

  const borderColor = isBad 
    ? 'border-red-500/50 bg-red-900/10' 
    : metric.isSignificant 
      ? isPositive ? 'border-green-500/50 bg-green-900/10' : 'border-slate-700 bg-slate-800/50'
      : 'border-slate-700 bg-slate-800/30';

  const textColor = isBad
    ? 'text-red-400'
    : metric.isSignificant
        ? isPositive ? 'text-green-400' : 'text-slate-400'
        : 'text-slate-500';

  return (
    <div className={`p-5 rounded-xl border ${borderColor} backdrop-blur-sm transition-all hover:border-opacity-100`}>
      <div className="flex justify-between items-start mb-4">
        <div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    metric.type === MetricType.Primary ? 'bg-blue-900/50 text-blue-300' :
                    metric.type === MetricType.Guardrail ? 'bg-orange-900/50 text-orange-300' : 'bg-slate-700 text-slate-300'
                }`}>
                    {metric.type}
                </span>
            </div>
            <h4 className="text-slate-300 font-medium mt-2 text-sm">{metric.name}</h4>
        </div>
        {metric.isSignificant && !isBad && <CheckCircle2 className="w-5 h-5 text-green-500/50" />}
        {isBad && <AlertTriangle className="w-5 h-5 text-red-500" />}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white">
            {metric.lift > 0 ? '+' : ''}{metric.lift.toFixed(2)}%
        </span>
        <div className={`flex items-center text-xs font-medium ${textColor}`}>
           <ColorIcon className="w-3 h-3 mr-1" />
           {metric.isSignificant ? 'Significant' : 'Not Sig.'}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4 text-xs text-slate-400">
        <div>
            <span className="block text-slate-500 uppercase text-[10px] tracking-wider mb-1">P-Value</span>
            <span className={metric.pValue < 0.05 ? 'text-blue-300 font-mono' : 'font-mono'}>
                {metric.pValue.toFixed(4)}
            </span>
        </div>
        <div>
            <span className="block text-slate-500 uppercase text-[10px] tracking-wider mb-1">95% CI</span>
            <span className="font-mono">
                [{metric.confidenceInterval[0].toFixed(2)}, {metric.confidenceInterval[1].toFixed(2)}]
            </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;