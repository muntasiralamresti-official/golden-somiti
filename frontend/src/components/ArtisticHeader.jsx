import React from 'react';
import {
  Download,
  PlusCircle,
  Calendar,
  Sparkles,
  UserPlus,
  Receipt,
  Settings2
} from 'lucide-react';
import { toBanglaNumber } from '../utils/formatters';

export default function ArtisticHeader({
  selectedYear,
  availableYears = [],
  onSelectYear,
  onOpenAddMember,
  onOpenAddPayment,
  onOpenAddExpense,
  onOpenYearConfig,
  onDownloadPDF,
  isDownloadingPDF
}) {
  const currentYear = new Date().getFullYear();

  const getYearLabel = (yr) => {
    const diff = currentYear - Number(yr);
    if (diff === 0) return `${toBanglaNumber(yr)} (চলতি বছর)`;
    if (diff === 1) return `${toBanglaNumber(yr)} (১ বছর আগে)`;
    if (diff === 2) return `${toBanglaNumber(yr)} (২ বছর আগে)`;
    if (diff > 2) return `${toBanglaNumber(yr)} (${toBanglaNumber(diff)} বছর আগে)`;
    return `${toBanglaNumber(yr)} সাল`;
  };

  return (
    <header className="relative overflow-hidden rounded-3xl golden-hero-card p-4 sm:p-6 mb-5">
      {/* Custom Meaningful Community & Unity SVG Artwork (Society, Unity, Prosperity, Helping Hands, Growth) */}
      {/* 1. Helping Hands & Prosperity Sprout (Nature, Help & Growth) on the Right */}
      <svg
        className="pointer-events-none absolute -right-6 -bottom-6 h-64 w-64 opacity-20 text-emerald-400"
        viewBox="0 0 200 200"
        fill="none"
      >
        {/* Glow halo */}
        <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        {/* Helping / Supporting Hands */}
        <path
          d="M35 145 C55 125, 75 120, 95 132 C105 138, 115 138, 125 130 C135 122, 145 125, 165 145"
          stroke="#f59e0b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M50 160 C70 142, 90 140, 105 148 C115 152, 125 150, 135 142 C145 135, 155 138, 170 155"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Growth Tree / Sprout of Prosperity (সমৃদ্ধির চারাগাছ) */}
        <path
          d="M100 135 L100 65"
          stroke="#34d399"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Leaves (Natural Growth & Prosperity) */}
        <path
          d="M100 95 C85 85, 65 90, 68 110 C82 110, 95 102, 100 95 Z"
          fill="#10b981"
          fillOpacity="0.4"
          stroke="#34d399"
          strokeWidth="2"
        />
        <path
          d="M100 80 C115 70, 135 75, 132 95 C118 95, 105 87, 100 80 Z"
          fill="#f59e0b"
          fillOpacity="0.35"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <path
          d="M100 65 C88 50, 92 35, 100 25 C108 35, 112 50, 100 65 Z"
          fill="#34d399"
          fillOpacity="0.5"
          stroke="#6ee7b7"
          strokeWidth="2"
        />
        {/* Golden Sun / Prosperity Sparkle */}
        <circle cx="100" cy="25" r="4" fill="#fbbf24" />
        <path d="M100 12 L100 17 M100 33 L100 38 M88 25 L93 25 M107 25 L112 25" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* 2. Unity Circle of People / Society (ঐক্য ও সমাজ) on the Left Background */}
      <svg
        className="pointer-events-none absolute -left-10 -top-8 h-60 w-60 opacity-15 text-amber-400"
        viewBox="0 0 200 200"
        fill="none"
      >
        {/* Outer Ring of Unity */}
        <circle cx="100" cy="100" r="75" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="100" cy="100" r="50" stroke="#10b981" strokeWidth="1.2" opacity="0.5" />
        
        {/* 5 United Society Members holding hands in circle (ঐক্যবদ্ধ সমাজ) */}
        {/* Person 1 (Top) */}
        <circle cx="100" cy="40" r="9" fill="#fbbf24" fillOpacity="0.7" />
        <path d="M85 64 C85 52, 115 52, 115 64" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
        
        {/* Person 2 (Top Right) */}
        <circle cx="150" cy="75" r="9" fill="#34d399" fillOpacity="0.7" />
        <path d="M140 100 C132 88, 158 78, 163 94" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
        
        {/* Person 3 (Bottom Right) */}
        <circle cx="132" cy="145" r="9" fill="#fbbf24" fillOpacity="0.7" />
        <path d="M115 160 C118 145, 145 142, 142 160" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />

        {/* Person 4 (Bottom Left) */}
        <circle cx="68" cy="145" r="9" fill="#34d399" fillOpacity="0.7" />
        <path d="M58 160 C55 142, 82 145, 85 160" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />

        {/* Person 5 (Top Left) */}
        <circle cx="50" cy="75" r="9" fill="#fbbf24" fillOpacity="0.7" />
        <path d="M37 94 C42 78, 68 88, 60 100" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />

        {/* Connecting Unity Hands (হাতে হাত মেলানো ঐক্যের বন্ধন) */}
        <path
          d="M85 58 Q60 62 48 85 Q45 115 68 145 Q100 165 132 145 Q155 115 152 85 Q140 62 115 58"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.8"
        />
        {/* Central Heart of Mutual Help (পারস্পরিক সহযোগিতা) */}
        <path
          d="M100 92 C96 86, 88 86, 84 91 C78 98, 86 108, 100 118 C114 108, 122 98, 116 91 C112 86, 104 86, 100 92 Z"
          fill="#f59e0b"
          fillOpacity="0.3"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & Artistic Emblem */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/90">
              <svg className="h-8 w-8 text-amber-400" viewBox="0 0 36 36" fill="none">
                <path
                  d="M18 4L22.5 13.5L32 11L27 23H9L4 11L13.5 13.5L18 4Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  fill="rgba(251, 191, 36, 0.2)"
                />
                <path d="M8 27H28" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="18" cy="16" r="2.2" fill="#fbbf24" />
              </svg>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 mb-1">
              <Sparkles className="h-3 w-3" />
              <span>ঐক্য • সঞ্চয় • সমৃদ্ধি</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                গোল্ডেন সমিতি
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 rounded-lg">
                Golden Somiti
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              দৈনন্দিন ও মাসিক তহবিল, বকেয়া, সমবণ্টনকৃত খরচ ও বহু-বার্ষিক প্রোফাইল ড্যাশবোর্ড
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddPayment}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-400 hover:to-teal-500 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>জমা নিন</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-500 active:scale-95 transition cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            <span>খরচ যোগ</span>
          </button>

          <button
            onClick={onOpenAddMember}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-amber-300 active:scale-95 transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>নতুন সদস্য</span>
          </button>

          <button
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400/30 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition cursor-pointer disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloadingPDF ? 'পিডিএফ তৈরি হচ্ছে...' : 'পিডিএফ ডাউনলোড'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Year Selector Bar */}
      <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300/90 mr-1 shrink-0">
            <Calendar className="h-3.5 w-3.5" />
            <span>হিসাবের বছর:</span>
          </span>

          {availableYears.map((yr) => {
            const active = String(selectedYear) === String(yr);
            return (
              <button
                key={yr}
                onClick={() => onSelectYear(yr)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700/80'
                }`}
              >
                {getYearLabel(yr)}
              </button>
            );
          })}

          <button
            onClick={() => onSelectYear('all')}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedYear === 'all'
                ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 shadow-md'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700/80'
            }`}
          >
            সর্বমোট (সব বছর একত্রে)
          </button>
        </div>

        <button
          onClick={onOpenYearConfig}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-amber-300 transition cursor-pointer"
        >
          <Settings2 className="h-3.5 w-3.5 text-amber-400" />
          <span>সেটিংস ও ফন্ট সাইজ</span>
        </button>
      </div>
    </header>
  );
}
