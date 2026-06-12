import React, { useState } from 'react';
import { useStore } from '../store';
import { Megaphone, Zap } from 'lucide-react';

export default function AnnouncementBar() {
  const { settings } = useStore();
  const [isPaused, setIsPaused] = useState(false);
  
  // Use professional fallback string matching the original context
  const text = settings?.announcementText || "Welcome to QuantumRig - Customize and build your ultimate high-performance gaming PC with zero hardware compatibility concerns.";

  return (
    <div id="detached-announcement-bar-container" className="w-full">
      <div 
        id="announcement-marquee-wrapper" 
        className="flex items-stretch bg-indigo-50/50 hover:bg-indigo-50/80 border border-indigo-100/70 hover:border-indigo-200/90 rounded-xl h-11 relative overflow-hidden select-none shadow-xs transition-all duration-300"
      >
        {/* Dynamic Highlight Badge */}
        <div 
          id="announcement-badge" 
          className="bg-indigo-600 border-r border-indigo-200/50 text-white font-bold px-4 md:px-5 flex items-center gap-2 text-[11px] uppercase tracking-wider shrink-0 z-10 select-none"
        >
          <Megaphone className="w-3.5 h-3.5 text-white animate-pulse" /> 
          <span>Notice</span>
        </div>
        
        {/* Ticker Section */}
        <div id="announcement-ticker-track" className="flex-1 overflow-hidden relative flex items-center bg-white dark:bg-slate-900/40">
          <div 
            id="announcement-track-wrap" 
            className="w-full overflow-hidden whitespace-nowrap"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div 
              id="announcement-moving-text" 
              className="inline-flex items-center animate-marquee text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase py-1 cursor-help"
              style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
            >
              <div className="flex items-center gap-3 shrink-0 pr-16 select-none">
                <span>{text}</span>
                <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              </div>
              <div className="flex items-center gap-3 shrink-0 pr-16 select-none">
                <span>{text}</span>
                <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              </div>
            </div>
          </div>
          
          {/* Transparent Gradient Fade Out on Right Side */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 via-slate-50/60 to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}
