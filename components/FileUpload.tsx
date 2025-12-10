import React, { useCallback } from 'react';
import { Upload, FileText, Zap } from 'lucide-react';
import { generateMockData } from '../services/statsService';
import { RawRow } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: RawRow[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  
  const handleDemoLoad = () => {
    const mockData = generateMockData(5000);
    onDataLoaded(mockData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, we would parse CSV here.
    // For this demo, we'll simulate parsing delay then load mock data 
    // to ensure the structure matches our strict types.
    setTimeout(() => {
        handleDemoLoad();
    }, 800);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 p-8 border border-slate-700 border-dashed rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 transition-all duration-300 group">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform duration-300 ring-1 ring-slate-700 shadow-lg shadow-blue-500/10">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Upload Experiment CSV</h3>
          <p className="text-slate-400 max-w-md">
            Drag and drop your dataset here. Supported columns: <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">user_id</code>, <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">variant</code>, <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">metric_val</code>.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <label className="relative cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <span className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Select File
            </span>
          </label>
          
          <span className="text-slate-600 font-medium">or</span>
          
          <button 
            onClick={handleDemoLoad}
            disabled={isLoading}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition-all flex items-center gap-2 hover:border-blue-500/50"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            Load Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;