import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-all cursor-pointer relative animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-video relative overflow-hidden bg-slate-200 p-6 flex items-center justify-center h-48 w-full">
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          {/* Title and Category */}
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
          {/* Price */}
          <div className="h-6 bg-slate-300 rounded w-16 ml-2"></div>
        </div>
        
        {/* Description lines */}
        <div className="space-y-2 mt-4 mb-4">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          <div className="h-3 bg-slate-200 rounded w-4/6"></div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="h-5 bg-slate-200 rounded w-12"></div>
            <div className="h-5 bg-slate-200 rounded w-16"></div>
            <div className="h-5 bg-slate-200 rounded w-10"></div>
          </div>
          <div className="w-full bg-slate-200 h-10 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
