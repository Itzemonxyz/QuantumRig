import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-0 shadow-sm border border-slate-200/80 overflow-hidden flex flex-col relative animate-pulse" id="product-grid-skeleton">
      {/* Target Image Box with deep charcoal accent background */}
      <div className="aspect-square bg-[#111827]/5 flex items-center justify-center p-6 border-b border-slate-100">
        <div className="w-2/3 h-2/3 bg-[#111827]/5 rounded-xl"></div>
      </div>
      
      {/* Content Skeleton containing deep charcoal placeholders */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="space-y-2">
          {/* Title Placeholder */}
          <div className="h-4 bg-[#111827]/10 rounded w-11/12"></div>
          <div className="h-4 bg-[#111827]/5 rounded w-2/3"></div>
        </div>
        
        {/* Specs Lines Placeholder using deep charcoal opacity */}
        <div className="space-y-2 mt-2">
          <div className="h-2.5 bg-[#111827]/5 rounded w-1/2"></div>
          <div className="h-2.5 bg-[#111827]/5 rounded w-3/4"></div>
        </div>

        {/* Footer info: price and cart button skeleton */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-3 bg-[#111827]/5 rounded w-12"></div>
            <div className="h-5 bg-[#111827]/10 rounded w-24"></div>
          </div>
          <div className="h-9 w-9 bg-indigo-600/10 rounded-full flex items-center justify-center">
            <div className="h-4 w-4 bg-indigo-600/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

