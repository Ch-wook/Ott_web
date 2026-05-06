import React from 'react';

const SkeletonCard = ({ isDarkMode }) => {
  return (
    <div className={`flex flex-col w-full animate-pulse rounded-2xl p-2 border ${isDarkMode ? 'border-white/[0.06] bg-white/[0.03]' : 'border-white/50 bg-white/40 shadow-sm'}`}>
      <div className={`w-full aspect-[2/3] rounded-xl ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200/60'} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
      </div>
      <div className="mt-4 px-2 pb-2 space-y-2.5">
        <div className={`h-4 w-3/4 rounded-lg ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200/70'}`} />
        <div className={`h-3 w-1/2 rounded-md ${isDarkMode ? 'bg-white/[0.04]' : 'bg-slate-200/50'}`} />
      </div>
    </div>
  );
};

export default SkeletonCard;
