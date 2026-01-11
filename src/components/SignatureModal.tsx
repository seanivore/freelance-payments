import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Eraser } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureDataUrl: string, legalName: string, signedDate: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSign
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
      }
      setHasSignature(false);
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleSave = () => {
    if (canvasRef.current && hasSignature && legalName && signedDate) {
      onSign(canvasRef.current.toDataURL('image/png'), legalName, signedDate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-semibold text-white">Sign Contract</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Full Legal Name</label>
                <input 
                    type="text" 
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Elliott Elk"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Date</label>
                <input 
                    type="date" 
                    value={signedDate}
                    onChange={(e) => setSignedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none dark-scheme-input"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Signature</label>
                <div className="border border-slate-700 border-dashed rounded-lg overflow-hidden touch-none relative bg-slate-950">
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={160}
                        className="w-full h-40 cursor-crosshair touch-none bg-white/5"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
                <div className="flex justify-start">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-500 hover:text-slate-300 gap-1 pl-0 hover:bg-transparent"
                        onClick={clear}
                    >
                        <Eraser className="w-4 h-4" /> Clear
                    </Button>
                </div>
            </div>
            
            <div className="pt-2">
                <Button 
                    className={cn(
                        "w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 transition-all font-semibold",
                        (!hasSignature || !legalName || !signedDate) && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleSave}
                    disabled={!hasSignature || !legalName || !signedDate}
                >
                    <Check className="w-4 h-4" /> Apply Signature
                </Button>
            </div>
        </div>
        
        <div className="p-3 bg-slate-950 text-xs text-center text-slate-500 border-t border-slate-800">
            By clicking Apply, you agree to the terms of this contract.
        </div>
      </div>
    </div>
  );
};
