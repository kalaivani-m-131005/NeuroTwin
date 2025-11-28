import React, { useState, useEffect } from 'react';

interface BreathingExerciseProps {
  onClose: () => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [timer, setTimer] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev > 1) return prev - 1;
        
        // Transition phases
        if (phase === 'Inhale') {
          setPhase('Hold');
          return 4;
        } else if (phase === 'Hold') {
          setPhase('Exhale');
          return 4;
        } else {
          setPhase('Inhale');
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center animate-fade-in-up">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-neuro-secondary hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex items-center justify-center">
        {/* Breathing Circle */}
        <div 
          className={`w-64 h-64 rounded-full border-2 border-neuro-accent/30 shadow-[0_0_50px_rgba(0,149,246,0.2)] flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${
            phase === 'Inhale' ? 'scale-125 bg-neuro-accent/10 border-neuro-accent' : 
            phase === 'Hold' ? 'scale-125 bg-neuro-accent/20 border-neuro-accent' : 
            'scale-100 bg-transparent border-neuro-accent/30'
          }`}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2 transition-all">{phase}</h2>
            <span className="text-4xl font-light text-neuro-accent">{timer}</span>
          </div>
        </div>

        {/* Outer Ripple */}
        <div 
            className={`absolute inset-0 rounded-full border border-neuro-accent/10 -z-10 transition-all duration-[4000ms] ease-in-out ${
                 phase === 'Inhale' ? 'scale-150 opacity-100' : 'scale-100 opacity-0'
            }`}
        ></div>
      </div>

      <p className="mt-12 text-neuro-secondary text-sm tracking-widest uppercase">
        Box Breathing
      </p>
    </div>
  );
};

export default BreathingExercise;