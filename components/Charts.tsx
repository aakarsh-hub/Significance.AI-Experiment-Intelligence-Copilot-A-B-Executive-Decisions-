import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MetricResult } from '../types';

interface ChartsProps {
  metrics: MetricResult[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-300 font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: <span className="font-mono text-white ml-auto pl-4">{entry.value.toFixed(3)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Charts: React.FC<ChartsProps> = ({ metrics }) => {
  const chartData = metrics.map(m => ({
    name: m.name,
    Control: m.controlMean,
    Treatment: m.treatmentMean,
    lift: m.lift
  }));

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-6">Variant Comparison (Mean Values)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar 
            dataKey="Control" 
            fill="#64748b" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={60}
          />
          <Bar 
            dataKey="Treatment" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;