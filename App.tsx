import React from 'react';
import LiquidButton from './components/LiquidButton';

// Subtle grainy noise overlay for that "film/analog" high-end feel
const NoiseOverlay = () => (
  <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.035] mix-blend-overlay">
    <svg className='w-full h-full'>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

export default function App() {
  return (
    <>
      <NoiseOverlay />
      
      {/* Main Container - Full Screen, Dark, Minimal */}
      <div className="relative w-full h-screen bg-[#080808] text-[#e0e0e0] flex flex-col justify-between overflow-hidden font-['Inter'] selection:bg-white selection:text-black">
        
        {/* Navbar */}
        <nav className="w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-center z-40">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-[2.5] transition-transform duration-500 ease-out"></div>
            <span className="text-xs font-semibold tracking-[0.25em] uppercase opacity-90 group-hover:opacity-100 transition-opacity">
              Aether
            </span>
          </div>
          
          <div className="flex gap-10">
            {['Work', 'Studio', 'Contact'].map((item, i) => (
              <span 
                key={item} 
                className="hidden md:block text-[10px] font-medium tracking-[0.2em] uppercase opacity-40 hover:opacity-100 cursor-pointer transition-all duration-500"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {item}
              </span>
            ))}
            <span className="md:hidden text-[10px] font-medium tracking-[0.2em] uppercase opacity-60">Menu</span>
          </div>
        </nav>

        {/* Hero Section Content */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
           
           {/* Subtle Atmospheric Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-white opacity-[0.02] blur-[150px] rounded-full pointer-events-none" />

           {/* Typography Composition */}
           <div className="relative flex flex-col items-center z-20">
              
              {/* Main Headline with Reveal Animation */}
              <h1 className="text-center font-normal leading-[0.85] tracking-[-0.04em] mix-blend-difference pointer-events-none">
                 <div className="overflow-hidden">
                    <span className="block text-[14vw] md:text-[9.5rem] animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 translate-y-full">
                      LIQUID
                    </span>
                 </div>
                 <div className="overflow-hidden">
                    <span className="block text-[14vw] md:text-[9.5rem] text-[#333] animate-[slideUp_1.1s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards] opacity-0 translate-y-full">
                      MATTER
                    </span>
                 </div>
              </h1>
              
              {/* CTA Button */}
              <div className="mt-14 md:mt-20 animate-[fadeIn_1s_ease-out_0.8s_forwards] opacity-0">
                <LiquidButton 
                  text="Explore Project" 
                  width={240} 
                  height={72} 
                />
              </div>

              {/* Subtext */}
              <div className="mt-16 max-w-xs text-center px-4 overflow-hidden">
                 <p className="text-neutral-500 text-[10px] md:text-[11px] leading-relaxed uppercase tracking-[0.25em] animate-[slideUpSmall_1s_ease-out_1s_forwards] opacity-0 translate-y-4">
                    Redefining digital materiality <br/> through organic motion.
                 </p>
              </div>
           </div>

        </main>

        {/* Footer info */}
        <footer className="w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-end z-40">
            <div className="flex flex-col gap-2">
               <span className="text-[9px] text-neutral-600 uppercase tracking-[0.2em]">( 2024 Edition )</span>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2">
               <span className="text-[9px] text-neutral-600 uppercase tracking-[0.2em] animate-pulse">Scroll to explore</span>
            </div>
        </footer>

        {/* Custom CSS for one-off animations */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(120%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideUpSmall {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

      </div>
    </>
  );
}