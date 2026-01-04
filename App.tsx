import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidButton from './components/LiquidButton';
import LiquidDigit from './components/LiquidDigit';

// --- VISUAL FX COMPONENTS ---

const NoiseOverlay = () => (
  <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.05] mix-blend-overlay">
    <svg className='w-full h-full'>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

const FluidBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] bg-neutral-900/40 rounded-full blur-[120px] mix-blend-screen animate-blob" />
    <div className="absolute bottom-[10%] right-[10%] w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[150px] mix-blend-overlay animate-blob animation-delay-2000" />
  </div>
);

// --- HELPERS ---

const pad = (n: number) => n.toString().padStart(2, '0');

const playBeep = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
};

// --- MAIN APP ---

export default function App() {
  const [appMode, setAppMode] = useState<'timer' | 'alarm'>('timer'); // Top level switch
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'ringing'>('idle');
  
  // Timer State
  const [timerInput, setTimerInput] = useState({ h: 0, m: 5, s: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const endTimeRef = useRef<number>(0);
  
  // Alarm State
  const [alarmInput, setAlarmInput] = useState({ h: 8, m: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dimensions
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  // Increased widths to prevent clipping of liquid effect
  const digitWidth = isMobile ? 100 : 300; 
  const digitHeight = isMobile ? 140 : 280;
  const separatorWidth = isMobile ? 30 : 80;

  // --- LOGIC ---

  // Clock Ticker for Alarm check & Timer loop
  useEffect(() => {
    let animationFrameId: number;
    let lastRingTime = 0;

    const tick = () => {
      const now = Date.now();
      setCurrentTime(new Date());

      if (status === 'running') {
        if (appMode === 'timer') {
          // Timer Logic
          const left = Math.ceil((endTimeRef.current - now) / 1000);
          if (left <= 0) {
            setRemainingSeconds(0);
            setStatus('ringing');
            playBeep();
          } else {
            setRemainingSeconds(left);
          }
        } else if (appMode === 'alarm') {
          // Alarm Logic
          const nowObj = new Date();
          if (
            nowObj.getHours() === alarmInput.h && 
            nowObj.getMinutes() === alarmInput.m && 
            nowObj.getSeconds() === 0
          ) {
            // Only trigger once per second
            if (now - lastRingTime > 1500) {
                setStatus('ringing');
                playBeep();
                lastRingTime = now;
            }
          }
        }
      } else if (status === 'ringing') {
         // Loop beep every 2 seconds if ringing
         if (now - lastRingTime > 2000) {
             playBeep();
             lastRingTime = now;
         }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, appMode, alarmInput]);


  const handleStart = () => {
    if (appMode === 'timer') {
      const total = (timerInput.h * 3600) + (timerInput.m * 60) + timerInput.s;
      if (total === 0) return;
      setRemainingSeconds(total);
      endTimeRef.current = Date.now() + (total * 1000);
    } 
    // Alarm simply enters running state to wait for time
    setStatus('running');
  };

  const handleStop = () => {
    setStatus('idle');
  };

  const handlePause = () => {
     setStatus('paused');
  };

  const handleResume = () => {
    if (appMode === 'timer') {
        endTimeRef.current = Date.now() + (remainingSeconds * 1000);
    }
    setStatus('running');
  };

  // Input Handlers
  const handleTimerChange = (field: 'h'|'m'|'s', valStr: string) => {
    let val = parseInt(valStr, 10);
    if (isNaN(val)) val = 0;
    if (field === 's' && val > 59) val = 59;
    if (field === 'm' && val > 59) val = 59;
    if (field === 'h' && val > 99) val = 99;
    setTimerInput(prev => ({...prev, [field]: val}));
  };

  const handleAlarmChange = (field: 'h'|'m', valStr: string) => {
    let val = parseInt(valStr, 10);
    if (isNaN(val)) val = 0;
    if (field === 'm' && val > 59) val = 59;
    if (field === 'h' && val > 23) val = 23;
    setAlarmInput(prev => ({...prev, [field]: val}));
  };

  // --- RENDER HELPERS ---

  let displayH, displayM, displayS;
  
  if (appMode === 'timer') {
    if (status === 'idle') {
      displayH = timerInput.h;
      displayM = timerInput.m;
      displayS = timerInput.s;
    } else {
      displayH = Math.floor(remainingSeconds / 3600);
      displayM = Math.floor((remainingSeconds % 3600) / 60);
      displayS = remainingSeconds % 60;
    }
  } else {
    // Alarm Mode
    if (status === 'idle') {
       displayH = alarmInput.h;
       displayM = alarmInput.m;
       displayS = 0;
    } else {
       // Alarm Running: Show current time
       displayH = currentTime.getHours();
       displayM = currentTime.getMinutes();
       displayS = currentTime.getSeconds();
    }
  }

  const showSeconds = appMode === 'timer' || status === 'running';

  return (
    <>
      <NoiseOverlay />
      <FluidBackground />
      
      <div className="relative w-full h-screen bg-[#050505] text-[#e0e0e0] flex flex-col justify-center items-center overflow-hidden font-['Inter'] selection:bg-white selection:text-black">
        
        {/* Top Toggle Switch */}
        <nav className="absolute top-0 left-0 w-full px-8 py-8 flex justify-center items-center z-40">
           <div className="flex gap-8 bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-sm">
              <button 
                onClick={() => { setAppMode('timer'); setStatus('idle'); }}
                className={`text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 ${appMode === 'timer' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/30 hover:text-white/60'}`}
              >
                Timer
              </button>
              <div className="w-px h-3 bg-white/20"></div>
              <button 
                onClick={() => { setAppMode('alarm'); setStatus('idle'); }}
                className={`text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 ${appMode === 'alarm' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/30 hover:text-white/60'}`}
              >
                Wecker
              </button>
           </div>
        </nav>

        {/* MAIN DISPLAY */}
        <main className="relative z-10 flex flex-col items-center justify-center w-full">
          
          <div className="flex items-center justify-center -space-x-4 md:-space-x-8">
             
             {/* HOURS */}
             {status === 'idle' ? (
                 <div className="relative group z-30">
                    <input 
                       type="number"
                       value={pad(displayH)}
                       onChange={(e) => appMode === 'timer' ? handleTimerChange('h', e.target.value) : handleAlarmChange('h', e.target.value)}
                       className="w-[20vw] md:w-[280px] bg-transparent text-center text-[20vw] md:text-[14rem] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500 outline-none caret-white/50"
                    />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-white/30">Hr</span>
                 </div>
             ) : (
                <LiquidDigit value={pad(displayH)} width={digitWidth} height={digitHeight} />
             )}

             {/* SEPARATOR */}
             <div className="z-20 flex items-center justify-center opacity-80">
                 {status === 'idle' ? (
                     <span className="text-[10vw] md:text-[8rem] text-neutral-600 font-light -translate-y-2 md:-translate-y-6">:</span>
                 ) : (
                     <LiquidDigit value=":" width={separatorWidth} height={digitHeight} />
                 )}
             </div>

             {/* MINUTES */}
             {status === 'idle' ? (
                 <div className="relative group z-30">
                    <input 
                       type="number"
                       value={pad(displayM)}
                       onChange={(e) => appMode === 'timer' ? handleTimerChange('m', e.target.value) : handleAlarmChange('m', e.target.value)}
                       className="w-[20vw] md:w-[280px] bg-transparent text-center text-[20vw] md:text-[14rem] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500 outline-none caret-white/50"
                    />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-white/30">Min</span>
                 </div>
             ) : (
                <LiquidDigit value={pad(displayM)} width={digitWidth} height={digitHeight} />
             )}

             {/* SECONDS */}
             {showSeconds && (
               <>
                 {/* SEPARATOR */}
                 <div className="z-20 flex items-center justify-center opacity-80">
                     {status === 'idle' ? (
                         <span className="text-[10vw] md:text-[8rem] text-neutral-600 font-light -translate-y-2 md:-translate-y-6">:</span>
                     ) : (
                         <LiquidDigit value=":" width={separatorWidth} height={digitHeight} />
                     )}
                 </div>

                 {status === 'idle' ? (
                     <div className="relative group z-30">
                        <input 
                           type="number"
                           value={pad(displayS)}
                           onChange={(e) => handleTimerChange('s', e.target.value)}
                           className="w-[20vw] md:w-[280px] bg-transparent text-center text-[20vw] md:text-[14rem] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500 outline-none caret-white/50"
                        />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-white/30">Sec</span>
                     </div>
                 ) : (
                    <LiquidDigit value={pad(displayS)} width={digitWidth} height={digitHeight} />
                 )}
               </>
             )}

          </div>

          {/* Alarm Status Text */}
          {appMode === 'alarm' && status === 'running' && (
             <div className="mt-12 text-xs tracking-[0.4em] uppercase text-white/40 animate-pulse">
                Alarm set for {pad(alarmInput.h)}:{pad(alarmInput.m)}
             </div>
          )}

          {/* Controls */}
          <div className="mt-20 md:mt-32 h-24">
            <AnimatePresence mode="wait">
              
              {status === 'idle' && (
                <motion.div 
                  key="start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <LiquidButton 
                    text={appMode === 'timer' ? "Start Timer" : "Set Alarm"} 
                    onClick={handleStart}
                    width={240}
                  />
                </motion.div>
              )}

              {status === 'running' && (
                 <motion.div 
                  key="running-controls"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-6"
                 >
                   {appMode === 'timer' ? (
                     <>
                        <LiquidButton text="Pause" onClick={handlePause} width={180} />
                        <div onClick={handleStop} className="h-[80px] w-[80px] rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer transition-colors group">
                           <div className="w-3 h-3 bg-red-500/50 group-hover:bg-red-500 rounded-sm transition-colors"></div>
                        </div>
                     </>
                   ) : (
                      <LiquidButton text="Cancel Alarm" onClick={handleStop} width={220} />
                   )}
                 </motion.div>
              )}

              {status === 'paused' && (
                <motion.div 
                  key="paused"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-6"
                >
                   <LiquidButton text="Resume" onClick={handleResume} width={180} />
                   <div onClick={handleStop} className="h-[80px] w-[80px] rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer transition-colors group">
                       <span className="text-[10px] tracking-widest text-white/50 group-hover:text-white">RST</span>
                   </div>
                </motion.div>
              )}

              {status === 'ringing' && (
                <motion.div 
                  key="ringing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                   <div className="text-2xl uppercase tracking-[0.5em] text-white animate-[pulse_0.2s_infinite]">
                     {appMode === 'timer' ? "Time's Up" : "Wake Up"}
                   </div>
                   <LiquidButton text="Dismiss" onClick={handleStop} width={240} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </main>
      </div>
      
      <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
      `}</style>
    </>
  );
}