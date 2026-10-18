import React from 'react';
import { STORE_CONFIG } from '@/config/store.config';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="flex flex-col items-center space-y-5">
        
        {/* Animated Brand Ring Logo */}
        <div className="relative flex items-center justify-center w-24 h-24">
          {/* Outer Rotating Glow Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-brand/20 border-t-brand animate-spin"></div>
          
          {/* Middle Pulse Ring */}
          <div className="absolute inset-2 rounded-full border border-brand/40 animate-pulse"></div>
          
          {/* Center Logo */}
          <div className="w-14 h-14 rounded-full bg-[#0f1015] border border-[#1f2025] flex items-center justify-center overflow-hidden p-2 shadow-lg">
            <img 
              src="/Logo.png" 
              alt={STORE_CONFIG.storeName} 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Text Details */}
        <div className="flex flex-col items-center space-y-1.5 text-center">
          <h2 className="font-serif text-xl md:text-2xl font-bold text-white tracking-wide">
            {STORE_CONFIG.storeName}
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-neutral-400 font-medium tracking-wider uppercase">
            <span>Loading</span>
            <span className="flex space-x-1">
              <span className="w-1 h-1 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-brand rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
