// filename: src/components/Toolbar.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Settings, Download, Pencil, FileDown, Layers } from 'lucide-react';

type ToolbarProps = {
  pageInfo: string;
  statusText: string;
  onFilePick: (file: File | null) => void;
  onPrev: () => void;
  onNext: () => void;
  penActive: boolean;
  setPenActive: (v: boolean) => void;
  penColor: string;
  setPenColor: (v: string) => void;
  penWidth: number;
  setPenWidth: (v: number) => void;
  onClearPageStrokes: () => void;
  onFlatten: () => void;
  onDownload: () => void;
  openSettings: () => void;
  branding: string;
  rightSlot?: React.ReactNode; // optional extra controls (e.g., DatePicker)
};

export const Toolbar: React.FC<ToolbarProps> = ({
  pageInfo,
  statusText,
  onFilePick,
  onPrev,
  onNext,
  penActive,
  setPenActive,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  onClearPageStrokes,
  onFlatten,
  onDownload,
  openSettings,
  branding,
  rightSlot
}) => {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur">
      {/* Load + Nav */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <label>
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 px-3 text-sm text-slate-100 hover:from-emerald-500/30 hover:to-sky-500/30">
            <FileDown className="h-4 w-4" /> Load PDF
          </button>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onFilePick(e.target.files?.[0] || null)}
          />
        </label>
        <button onClick={onPrev} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 hover:bg-slate-800">
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button onClick={onNext} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 hover:bg-slate-800">
          <ChevronRight className="h-4 w-4" /> Next
        </button>
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
          {pageInfo}
        </span>
        <span className="text-xs text-slate-400 ml-2">{statusText}</span>
      </div>

      {/* Pen controls */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <button
          onClick={() => setPenActive(!penActive)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 px-3 text-sm text-slate-100 hover:from-emerald-500/30 hover:to-sky-500/30"
        >
          <Pencil className="h-4 w-4" /> Pen: {penActive ? 'On' : 'Off'}
        </button>
        <span className="text-xs text-slate-400">Color</span>
        <input
          type="color"
          value={penColor}
          onChange={(e) => setPenColor(e.target.value)}
          className="h-9 w-9 rounded-md border border-slate-700 bg-slate-900"
        />
        <span className="text-xs text-slate-400 ml-2">Width</span>
        <input
          type="range"
          min={1}
          max={16}
          value={penWidth}
          onChange={(e) => setPenWidth(parseFloat(e.target.value))}
          className="w-28 accent-emerald-400"
        />
        <button
          onClick={onClearPageStrokes}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-700 bg-rose-600 px-3 text-sm text-white hover:bg-rose-700"
        >
          Clear Page
        </button>
      </div>

      {/* Flatten + Download + Settings */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <button
          onClick={onFlatten}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 px-3 text-sm text-slate-100 hover:from-emerald-500/30 hover:to-sky-500/30"
        >
          <Layers className="h-4 w-4" /> Flatten to PDF
        </button>
        <button
          onClick={onDownload}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 hover:bg-slate-800"
        >
          <Download className="h-4 w-4" /> Download
        </button>
        <button
          onClick={openSettings}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 hover:bg-slate-800"
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
      </div>

      <div className="flex-1" />

      {/* Right slot and branding */}
      {rightSlot && <div className="flex items-center gap-2 pr-3 border-r border-slate-800">{rightSlot}</div>}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
          {branding}
        </span>
      </div>
    </div>
  );
};
