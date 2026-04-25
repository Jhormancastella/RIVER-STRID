function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(start, end, factor) { return start + (end - start) * factor; }
function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function normalize(x, y) {
  const mag = Math.hypot(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}
