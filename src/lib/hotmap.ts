// --- 1. Helper Functions ---

export const LEVEL_COLORS = ["#E8EEF7", "#B2C8E8", "#4A70B0", "#1B3668"];

export const hexToRgb = (hex: string): [number, number, number] => {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

export const componentToHex = (c: number) => {
  const clamped = Math.max(0, Math.min(255, c));
  const hex = clamped.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

export const clamp01 = (x: number) => {
  return Math.max(0, Math.min(1, x));
};

export const sigmoid = (z: number) => {
  return 1 / (1 + Math.exp(-z));
};

export const cityScore = (value: number, median: number, p25: number, p75: number) => {
  const iqr = Math.max(p75 - p25, 1);
  const k = 4 / iqr;
  return clamp01(sigmoid(k * (value - median)));
};

export const getScoreColor = (score: number) => {
  const stops = LEVEL_COLORS.length - 1;
  const scaled = score * stops;
  const lower = Math.floor(scaled);
  const upper = Math.min(stops, Math.ceil(scaled));
  const t = scaled - lower;

  const [r1, g1, b1] = hexToRgb(LEVEL_COLORS[lower]);
  const [r2, g2, b2] = hexToRgb(LEVEL_COLORS[upper]);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return rgbToHex(r, g, b);
};
