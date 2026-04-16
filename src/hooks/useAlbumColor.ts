import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

// Helper to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

// Helper to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

export function useAlbumColor(imageUrl: string | undefined) {
  const [colors, setColors] = useState<{
    dominant: [number, number, number];
    light: [number, number, number];
  }>({
    dominant: [25, 20, 20],
    light: [255, 255, 255]
  });

  useEffect(() => {
    if (!imageUrl) return;

    const fac = new FastAverageColor();
    
    fac.getColorAsync(imageUrl as string, {
      crossOrigin: 'anonymous',
      algorithm: 'dominant'
    })
    .then((color) => {
      if (color && color.value) {
        const [r, g, b] = [color.value[0], color.value[1], color.value[2]];
        const [h, s] = rgbToHsl(r, g, b);

        let accent: [number, number, number];
        
        if (color.isLight) {
          // Monochromatic derivation: Dark shade of the same hue
          // If background is light, we want a very dark text color (L = 15%)
          // We also boost saturation slightly to keep it from looking "muddy"
          accent = hslToRgb(h, Math.min(s + 20, 100), 15);
        } else {
          // Monochromatic derivation: Light tint of the same hue
          // If background is dark, we want a very light text color (L = 90%)
          // We slightly desaturate the tint to make it feel like "off-white" themed text
          accent = hslToRgb(h, Math.max(s - 10, 10), 92);
        }

        setColors({
          dominant: [r, g, b],
          light: accent
        });
      }
    })
    .catch(err => {
      console.error('FastAverageColor: Failed to extract color', err);
      setColors({ dominant: [25, 20, 20], light: [255, 255, 255] });
    });

  }, [imageUrl]);

  return colors;
}
