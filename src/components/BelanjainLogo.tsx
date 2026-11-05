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

  const koksiImgSize = {
    sm: 'h-8 sm:h-9',
    md: 'h-9 sm:h-10',
    lg: 'h-11 sm:h-12'
  }[size];

  const dividerHeight = {
    sm: 'h-6',
    md: 'h-7',
    lg: 'h-9'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
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
          <span className="ml-1.5 px-2.5 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-white rounded-full text-[0.65em] font-extrabold uppercase tracking-widest shadow-sm">
            SAZA
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

      {/* Vertical Co-Branding Divider */}
      <div
        className={`w-px ${dividerHeight} shrink-0 mx-0.5 ${
          dark ? 'bg-slate-700' : 'bg-slate-200'
        }`}
        aria-hidden="true"
      />

      {/* Frameless Vector KOKSI Logo */}
      <img
        src={dark ? '/koksi-logo-dark.svg' : '/koksi-logo.svg'}
        alt="KOKSI - Koperasi Karyawan PT. Siemens Indonesia"
        title="KOKSI - Koperasi Karyawan PT. Siemens Indonesia"
        className={`${koksiImgSize} w-auto object-contain select-none shrink-0`}
      />
    </div>
  );
};
