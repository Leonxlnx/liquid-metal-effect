import React from 'react';
import LiquidButton from './components/LiquidButton';

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-neutral-950 gap-8">
      <LiquidButton 
        text="Enter Experience" 
        width={260} 
        height={70} 
      />
    </div>
  );
}