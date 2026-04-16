import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

export function useAlbumColor(imageUrl: string | undefined) {
  // Initial fallback to Spotify black
  const [dominantColor, setDominantColor] = useState<[number, number, number]>([25, 20, 20]);

  useEffect(() => {
    if (!imageUrl) return;

    const fac = new FastAverageColor();
    
    fac.getColorAsync(imageUrl, {
      crossOrigin: 'anonymous',
      algorithm: 'dominant' // Can use 'average' or 'dominant'
    })
    .then(color => {
      if (color && color.value) {
        setDominantColor([color.value[0], color.value[1], color.value[2]]);
      }
    })
    .catch(err => {
      console.error('FastAverageColor: Failed to extract color', err);
      // Fallback to a dark color if it fails
      setDominantColor([25, 20, 20]);
    });

  }, [imageUrl]);

  return dominantColor;
}
