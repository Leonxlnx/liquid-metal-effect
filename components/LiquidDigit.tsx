import React, { useState, useEffect, useMemo } from 'react';
import MetallicPaint, { parseLogoImage } from './MetallicPaint';

interface LiquidDigitProps {
  value: string | number;
  width?: number;
  height?: number;
}

const LiquidDigit: React.FC<LiquidDigitProps> = ({ 
  value, 
  width = 150, 
  height = 200 
}) => {
  // Use a displayedImage state to hold the "last good" image to avoid flickering
  const [displayedImageData, setDisplayedImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    let active = true;

    async function generateDigitShape() {
      // Create SVG blob. Text must be BLACK (#000000) because the shader calculates liquid
      // based on (1.0 - brightness). Black = 0 = Max Liquid Effect.
      // Background is transparent (alpha 0).
      const svgString = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .text { 
              font-family: 'Inter', sans-serif; 
              font-weight: 800; 
              fill: #000000; 
            }
          </style>
          <text 
            x="50%" 
            y="55%" 
            dominant-baseline="middle" 
            text-anchor="middle" 
            class="text" 
            font-size="${height * 0.85}px"
          >${value}</text>
        </svg>
      `;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const file = new File([blob], "digit.svg", { type: "image/svg+xml" });

      try {
        const parsed = await parseLogoImage(file);
        if (active && parsed?.imageData) {
          // Update the display only when the new image is ready
          setDisplayedImageData(parsed.imageData);
        }
      } catch (err) {
        console.error("Failed to generate liquid digit", err);
      }
    }

    generateDigitShape();

    return () => { active = false; };
  }, [value, width, height]);

  // Params tuned for "Chrome Liquid" - smooth, high reflection
  const paintParams = useMemo(() => ({
    edge: 0.5, 
    patternBlur: 0.005, 
    patternScale: 1.0, 
    refraction: 0.05, 
    speed: 0.3, 
    liquid: 0.5,
  }), []);

  if (!displayedImageData) {
    // Initial loading state (only happens once on first mount)
    return (
        <div style={{ width, height }} className="flex items-center justify-center">
            <span className="text-white/20 font-bold text-8xl animate-pulse opacity-0">{value}</span>
        </div>
    )
  }

  return (
    <div style={{ width, height }} className="relative overflow-hidden">
        <MetallicPaint 
            imageData={displayedImageData} 
            params={paintParams}
            className="w-full h-full object-contain" 
        />
    </div>
  );
};

export default LiquidDigit;