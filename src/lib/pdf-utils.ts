

export type Stroke = {
  page: number;
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export function dataURLToUint8Array(dataURL: string): Uint8Array {
  const base64 = dataURL.split(',')[1];
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  scale: number
) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
