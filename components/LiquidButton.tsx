import React, { useState, useEffect, useMemo } from 'react';
import MetallicPaint, { parseLogoImage } from './MetallicPaint';

interface LiquidButtonProps {
  text: string;
  onClick?: () => void;
  width?: number;
  height?: number;
  className?: string;
}

const LiquidButton: React.FC<LiquidButtonProps> = ({ 
  text, 
  onClick, 
  width = 240, 
  height = 80, 
  className = "" 
}) => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Exact 3px border as requested
  const borderSize = 3;

  useEffect(() => {
    let active = true;

    async function generateButtonShape() {
      // Create SVG blob for a rounded rectangle
      const svgString = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${width}" height="${height}" rx="${height/2}" fill="black" />
        </svg>
      `;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const file = new File([blob], "button.svg", { type: "image/svg+xml" });

      try {
        const parsed = await parseLogoImage(file);
        if (active && parsed?.imageData) {
          setImageData(parsed.imageData);
        }
      } catch (err) {
        console.error("Failed to generate liquid button shape", err);
      }
    }

    generateButtonShape();

    return () => { active = false; };
  }, [width, height]);

  // Params tuned for "Thick Oily Chrome" - Fewer folds, smoother surface
  const paintParams = useMemo(() => ({
    edge: 1, 
    patternBlur: 0.015, // Softer edges for a more liquid look
    patternScale: 0.6, // Drastically reduced from 2.5 to remove "wrinkles"
    refraction: 0.03, // Increased refraction for depth
    speed: isHovered ? 0.4 : 0.2, // Smoother speed
    liquid: isHovered ? 0.2 : 0.1, // High distortion
  }), [isHovered]);

  return (
    <div 
      className={`relative inline-block cursor-pointer group select-none ${className}`}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 
        Layer 1: The Liquid Metal Background.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-full">
        {imageData ? (
          <MetallicPaint 
            imageData={imageData} 
            params={paintParams}
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 rounded-full animate-pulse" />
        )}
      </div>

      {/* 
        Layer 2: The "Clean" Inner Button.
      */}
      <div 
        className="absolute z-10 bg-black flex items-center justify-center transition-all duration-300 ease-out"
        style={{
          top: borderSize,
          left: borderSize,
          right: borderSize,
          bottom: borderSize,
          borderRadius: 9999
        }}
      >
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center border border-white/10 group-hover:bg-neutral-900 transition-colors">
          <span className="text-white font-medium tracking-[0.25em] uppercase text-xs md:text-sm">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiquidButton;