import React from 'react';
import LiquidButton from './components/LiquidButton';

// 1. Noise Overlay (Film Grain)
const NoiseOverlay = () => (
  <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-overlay">
    <svg className='w-full h-full'>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

// 2. Liquid Distortion Filter for Text
// This creates the "underwater" wobbling effect on the main headline
const LiquidTextFilter = () => (
  <svg className="absolute w-0 h-0">
    <defs>
      <filter id="liquid-flow">
        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.005" numOctaves="5" seed="2" result="noise">
          <animate attributeName="baseFrequency" dur="20s" values="0.01 0.005; 0.02 0.009; 0.01 0.005" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" />
      </filter>
    </defs>
  </svg>
);

// 3. Ambient Fluid Background
// Moving blobs to make the void feel "liquid"
const FluidBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-neutral-800/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
    <div className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] bg-neutral-900/40 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
    <div className="absolute bottom-[0%] left-[30%] w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[150px] mix-blend-overlay animate-blob animation-delay-4000" />
  </div>
);

export default function App() {
  return (
    <>
      <NoiseOverlay />
      <LiquidTextFilter />
      <FluidBackground />
      
      {/* Main Container */}
      <div className="relative w-full h-screen bg-[#050505] text-[#e0e0e0] flex flex-col justify-between overflow-hidden font-['Inter'] selection:bg-white selection:text-black">
        
        {/* Navbar */}
        <nav className="w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-center z-40 mix-blend-difference">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-[3] group-hover:blur-[1px] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"></div>
            <span className="text-xs font-semibold tracking-[0.25em] uppercase opacity-90 group-hover:tracking-[0.35em] transition-all duration-700">
              Aether
            </span>
          </div>
          
          <div className="flex gap-10">
            {['Work', 'Studio', 'Contact'].map((item, i) => (
              <span 
                key={item} 
                className="hidden md:block text-[10px] font-medium tracking-[0.2em] uppercase opacity-50 hover:opacity-100 hover:blur-[0.5px] cursor-pointer transition-all duration-500"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {item}
              </span>
            ))}
            <span className="md:hidden text-[10px] font-medium tracking-[0.2em] uppercase opacity-60">Menu</span>
          </div>
        </nav>

        {/* Hero Section Content */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full perspective-[1000px]">
           
           {/* Typography Composition */}
           <div className="relative flex flex-col items-center z-20">
              
              {/* Main Headline with Liquid Filter & Reveal Animation */}
              <h1 className="text-center font-normal leading-[0.85] tracking-[-0.04em] mix-blend-difference pointer-events-none select-none">
                 <div className="overflow-hidden py-4">
                    <span 
                      className="block text-[13vw] md:text-[9.5rem] animate-[slideUp_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 translate-y-full"
                      style={{ filter: 'url(#liquid-flow)' }}
                    >
                      LIQUID
                    </span>
                 </div>
                 <div className="overflow-hidden py-4 -mt-4 md:-mt-8">
                    <span 
                      className="block text-[13vw] md:text-[9.5rem] text-[#444] animate-[slideUp_1.6s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards] opacity-0 translate-y-full"
                      style={{ filter: 'url(#liquid-flow)' }}
                    >
                      MATTER
                    </span>
                 </div>
              </h1>
              
              {/* CTA Button */}
              <div className="mt-12 md:mt-16 animate-[fadeIn_1.2s_ease-out_1s_forwards] opacity-0 hover:scale-[1.02] transition-transform duration-700">
                <LiquidButton 
                  text="Enter Void" 
                  width={260} 
                  height={76} 
                />
              </div>

              {/* Subtext */}
              <div className="mt-20 max-w-xs text-center px-4 overflow-hidden mix-blend-screen">
                 <p className="text-neutral-500 text-[10px] md:text-[11px] leading-relaxed uppercase tracking-[0.3em] animate-[slideUpSmall_1s_ease-out_1.2s_forwards] opacity-0 translate-y-4">
                    Digital materiality in <br/> perpetual motion.
                 </p>
              </div>
           </div>

        </main>

        {/* Footer info */}
        <footer className="w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-end z-40 mix-blend-difference">
            <div className="flex flex-col gap-2">
               <span className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] opacity-60">( 2026 Edition )</span>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2">
               <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse"></div>
            </div>
        </footer>

        {/* Custom CSS for Animations */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(140%) skewY(5deg); opacity: 0; }
            to { transform: translateY(0) skewY(0deg); opacity: 1; }
          }
          @keyframes slideUpSmall {
            from { transform: translateY(40px); opacity: 0; blur: 10px; }
            to { transform: translateY(0); opacity: 1; blur: 0px; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(40px, -60px) scale(1.1); }
            66% { transform: translate(-30px, 30px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 5s;
          }
        `}</style>

      </div>
    </>
  );
}