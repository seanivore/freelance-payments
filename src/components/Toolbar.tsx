import React from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

type ToolbarProps = {
  pageInfo: string;
  onPrev: () => void;
  onNext: () => void;
  onDownload: () => void;
};

export const Toolbar: React.FC<ToolbarProps> = ({
  pageInfo,
  onPrev,
  onNext,
  onDownload
}) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur shadow-lg">
      
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button 
            onClick={onPrev} 
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <span className="font-mono text-sm text-slate-400 bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 min-w-[80px] text-center">
          {pageInfo}
        </span>

        <button 
            onClick={onNext} 
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
             title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>
    </div>
  );
};
