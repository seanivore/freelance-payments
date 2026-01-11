import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Stroke } from '@/lib/pdf-utils';

interface PenCanvasProps {
    active: boolean;
    color: string;
    width: number;
    scale: number;
    page: number;
    strokes: Stroke[];
    setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
    canvasSize: { width: number; height: number };
    className?: string;
}

export const PenCanvas = React.forwardRef<HTMLCanvasElement, PenCanvasProps>(({ 
    active,
    color,
    width,
    scale,
    page,
    strokes,
    setStrokes,
    canvasSize,
    className
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<{ x: number, y: number }[]>([]);

    // Expose ref
    React.useImperativeHandle(ref, () => canvasRef.current!, []);

    // Sync canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // We set the canvas DOM size to match the PDF viewer's canvas size
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        
        // Redraw strokes for this page
        redraw(canvas);
    }, [canvasSize, page, strokes, scale]);

    const redraw = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const pageStrokes = strokes.filter(s => s.page === page);
        
        pageStrokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width * scale; // Adjust width by scale if needed
            
            ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x * scale, stroke.points[i].y * scale);
            }
            ctx.stroke();
        });
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / scale,
            y: (clientY - rect.top) / scale
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        setIsDrawing(true);
        const point = getCoordinates(e, canvas);
        setCurrentStroke([point]);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width * scale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(point.x * scale, point.y * scale);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const point = getCoordinates(e, canvas);
        setCurrentStroke(prev => [...prev, point]);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineTo(point.x * scale, point.y * scale);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        if (currentStroke.length > 0) {
            const newStroke: Stroke = {
                page,
                points: currentStroke,
                color,
                width
            };
            setStrokes(prev => [...prev, newStroke]);
        }
        setCurrentStroke([]);
    };

    return (
        <div className={cn("absolute inset-0 touch-none pointer-events-none", className)}>
             <canvas
                ref={canvasRef}
                className={cn("w-full h-full", active ? "pointer-events-auto cursor-crosshair" : "pointer-events-none")}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
});

PenCanvas.displayName = 'PenCanvas';
