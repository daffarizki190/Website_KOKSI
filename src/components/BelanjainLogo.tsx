import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface BelanjainLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  dark?: boolean;
  className?: string;
}

export const BelanjainLogo: React.FC<BelanjainLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  dark = false,
  className = ''
}) => {
  const textClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl sm:text-4xl'
  }[size];

  const iconContainerSize = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl'
  }[size];

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  const subtitleClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Stylized Icon Badge */}
      <div
        className={`${iconContainerSize} flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 ${
          dark
            ? 'bg-gradient-to-tr from-amber-500 via-teal-500 to-emerald-400 text-slate-950 font-black'
            : 'bg-gradient-to-tr from-teal-600 via-teal-500 to-amber-500 text-white font-black'
        }`}
      >
        <ShoppingBag className={`${iconSize} stroke-[2.5]`} />
      </div>

      {/* Typographic Wordmark / Desain Tulisan */}
      <div className="flex flex-col justify-center">
        <div className={`font-black tracking-tight leading-none ${textClasses} flex items-baseline gap-0.5`}>
          <span className={dark ? 'text-white' : 'text-slate-900'}>
            belanja
          </span>
          <span className="text-amber-500 italic font-black">
            in
          </span>
          <span className="text-teal-500 font-extrabold text-[0.65em] uppercase tracking-wider ml-1 px-1.5 py-0.5 bg-teal-500/10 rounded-md border border-teal-500/20">
            Saza
          </span>
        </div>
        {showSubtitle && (
          <p className={`font-bold uppercase tracking-widest mt-1 ${subtitleClasses} ${
            dark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Platform Belanja Karyawan
          </p>
        )}
      </div>
    </div>
  );
};
