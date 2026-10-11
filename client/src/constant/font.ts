/** Shared font families and weights for the Collune UI. */
export const fonts = {
  sans: '"Inter", "DM Sans", ui-sans-serif, system-ui, sans-serif',
  display: '"Inter", "DM Sans", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;
