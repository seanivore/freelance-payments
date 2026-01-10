export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function dataURLToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const raw = atob(base64);
  const u8 = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
  return u8;
}

export type StrokePoint = { x: number; y: number };
export type Stroke = {
  page: number;
  color: string;
  width: number;
  scale: number;
  points: StrokePoint[];
};

export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  scaleFactor = 1
) {
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < s.points.length; i++) {
      ctx.beginPath();
      ctx.moveTo(s.points[i - 1].x, s.points[i - 1].y);
      ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    }
  }
}
