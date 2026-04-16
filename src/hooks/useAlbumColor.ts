import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

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
    
    fac.getColorAsync(imageUrl, {
      crossOrigin: 'anonymous',
      algorithm: 'dominant'
    })
    .then(color => {
      if (color && color.value) {
        // We use the dominant color as the base.
        // For the light accent, we can either use the average or a brightened version of the dominant.
        // Let's also try to get the average for the text/accent.
        return fac.getColorAsync(imageUrl, {
          crossOrigin: 'anonymous',
          algorithm: 'average'
        }).then(avgColor => {
          setColors({
            dominant: [color.value[0], color.value[1], color.value[2]],
            light: avgColor && avgColor.isLight ? 
                   [avgColor.value[0], avgColor.value[1], avgColor.value[2]] : 
                   [Math.min(color.value[0] + 150, 255), Math.min(color.value[1] + 150, 255), Math.min(color.value[2] + 150, 255)]
          });
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
