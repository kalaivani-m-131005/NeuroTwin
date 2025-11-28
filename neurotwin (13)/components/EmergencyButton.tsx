import React from 'react';

interface EmergencyButtonProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center animate-fade-in-up"
      role="dialog"
      aria-modal="true"
    >
      {/* Calm Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neuro-rose/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2"
        aria-label="Close crisis mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative z-10 max-w-lg w-full p-6 text-center space-y-8">
        <div className="w-20 h-20 mx-auto bg-neuro-rose/20 rounded-full flex items-center justify-center border border-neuro-rose/50 shadow-[0_0_30px_rgba(233,69,96,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#E94560" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          You are safe here.
        </h2>
        
        <p className="text-neuro-muted text-lg leading-relaxed">
          It’s okay to feel overwhelmed. Just breathe with me. <br/>
          <span className="text-neuro-highlight">Inhale... 1, 2, 3, 4. Exhale... 1, 2, 3, 4.</span>
        </p>

        <div className="grid grid-cols-1 gap-4 mt-8">
          <a href="tel:988" className="group relative overflow-hidden bg-neuro-surface border border-neuro-rose/40 hover:bg-neuro-rose/10 text-white py-4 rounded-xl transition-all flex items-center justify-center gap-3">
            <span className="absolute inset-0 w-1 bg-neuro-rose transition-all group-hover:w-full opacity-10"></span>
            <span className="font-bold text-lg">Call 988 (Crisis Lifeline)</span>
          </a>
          
          <a href="tel:911" className="bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 text-red-100 py-4 rounded-xl transition-all font-bold tracking-wide">
            Call Emergency Services (911)
          </a>
        </div>
        
        <p className="text-xs text-slate-600 mt-8">
          NeuroTwin is an AI companion, not a medical professional. If you are in danger, please call for help.
        </p>
      </div>
    </div>
  );
};

export default EmergencyButton;