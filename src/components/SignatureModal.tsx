import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Eraser } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSign
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
    if (canvasRef.current && hasSignature) {
      onSign(canvasRef.current.toDataURL('image/png'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-900">Sign Contract</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 bg-white">
            <div className="mb-2 text-sm text-slate-500">Draw your signature below:</div>
            <div className="border-2 border-slate-200 border-dashed rounded-lg overflow-hidden touch-none relative bg-slate-50">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full h-48 cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="mt-4 flex justify-between">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-500 hover:text-red-600 gap-1"
                    onClick={clear}
                >
                    <Eraser className="w-4 h-4" /> Clear
                </Button>
                
                <Button 
                    className={cn(
                        "bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all",
                        !hasSignature && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleSave}
                    disabled={!hasSignature}
                >
                    <Check className="w-4 h-4" /> Apply Signature
                </Button>
            </div>
        </div>
        
        <div className="p-4 bg-slate-50 text-xs text-center text-slate-400 border-t border-slate-100">
            By clicking Apply, you agree that this signature is valid.
        </div>
      </div>
    </div>
  );
};
