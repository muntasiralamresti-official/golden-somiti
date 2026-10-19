import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Calculator,
  History,
  ArrowUpRight
} from 'lucide-react';
import { formatBDT, toBanglaNumber } from '../utils/formatters';

export default function FundOverviewCards({
  summary = {},
  selectedYear,
  yearlyComparison = [],
  onSelectYear
}) {
  const isAll = selectedYear === 'all';
  const periodLabel = isAll
    ? 'সর্বমোট সব বছর'
    : `${toBanglaNumber(selectedYear)} অর্থবছর`;

  const collectionRate =
    summary.periodTarget > 0
      ? Math.min(100, Math.round((summary.periodCollected / summary.periodTarget) * 100))
      : 0;

  const expenseRatio =
    summary.periodCollected > 0
      ? Math.min(100, Math.round((summary.periodExpense / summary.periodCollected) * 100))
      : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Main 4 Financial Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: ফান্ডে বর্তমানে কত টাকা আছে (Net Available Fund) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-400/40 p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                খরচ বাদে বর্তমান স্থিতি ({periodLabel})
              </span>
              <h3 className="text-xs font-medium text-slate-300 mt-2">
                ফান্ডে নিট জমা আছে (অবশিষ্ট টাকা)
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-amber-300 mt-1">
                {formatBDT(summary.periodNetBalance)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-300">সর্বমোট সব বছরের নিট ক্যাশ:</span>
            <span className="font-bold text-emerald-300">
              {formatBDT(summary.allTimeCurrentFund)}
            </span>
          </div>
        </div>

        {/* Card 2: ফান্ডে কত টাকা ছিল (Total Collected in Fund) */}
        <div className="relative overflow-hidden rounded-2xl golden-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                কালেকশন ({toBanglaNumber(collectionRate)}% আদায়)
              </span>
              <h3 className="text-xs font-medium text-slate-300 mt-2">
                ফান্ডে মোট জমা হয়েছিল ({periodLabel})
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
                {formatBDT(summary.periodCollected)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">বার্ষিক মোট নির্ধারিত লক্ষ্য:</span>
            <span className="font-semibold text-slate-200">
              {formatBDT(summary.periodTarget)}
            </span>
          </div>
        </div>

        {/* Card 3: ফান্ড থেকে কত টাকা খরচ হয়েছে ও মাথাপিছু হিসাব */}
        <div className="relative overflow-hidden rounded-2xl golden-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                সমবণ্টনকৃত খরচ ({toBanglaNumber(expenseRatio)}%)
              </span>
              <h3 className="text-xs font-medium text-slate-300 mt-2">
                ফান্ড থেকে মোট খরচ হয়েছে
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-400 mt-1">
                {formatBDT(summary.periodExpense)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              মাথাপিছু খরচের অংশ ({toBanglaNumber(summary.activeMembers)} জন):
            </span>
            <span className="font-bold text-amber-300">
              {formatBDT(summary.perMemberEqualExpense)}
            </span>
          </div>
        </div>

        {/* Card 4: কত টাকা বকেয়া আছে (Total Due / Arrears) */}
        <div className="relative overflow-hidden rounded-2xl golden-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                বকেয়া হিসাব ({periodLabel})
              </span>
              <h3 className="text-xs font-medium text-slate-300 mt-2">
                সদস্যদের নিকট মোট বকেয়া আছে
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-rose-400 mt-1">
                {formatBDT(summary.periodDue)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              মোট তালিকাভুক্ত সদস্য:
            </span>
            <span className="font-semibold text-slate-200">
              {toBanglaNumber(summary.totalMembers)} জন
            </span>
          </div>
        </div>
      </div>

      {/* Fund Equation & Multi-Year Quick Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Visual Fund Equation Card */}
        <div className="lg:col-span-5 rounded-2xl golden-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                <span>ফান্ডের স্বয়ংক্রিয় ক্যালকুলেশন সারাংশ ({periodLabel})</span>
              </span>
              <span className="text-[11px] text-slate-400">
                আদায় হার: {toBanglaNumber(collectionRate)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex my-2">
              <div
                style={{ width: `${Math.max(0, 100 - expenseRatio)}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                title="অবশিষ্ট ফান্ড"
              />
              <div
                style={{ width: `${expenseRatio}%` }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                title="খরচ হয়েছে"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
              <div className="text-[11px] text-slate-400">মোট জমা ছিল</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                {formatBDT(summary.periodCollected)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
              <div className="text-[11px] text-slate-400">বাদ: মোট খরচ</div>
              <div className="text-xs sm:text-sm font-bold text-orange-400 mt-0.5">
                - {formatBDT(summary.periodExpense)}
              </div>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2">
              <div className="text-[11px] text-amber-300">হাতে আছে</div>
              <div className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5">
                = {formatBDT(summary.periodNetBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Year History Cards (Current Year, 1 Year Ago, 2 Years Ago) */}
        <div className="lg:col-span-7 rounded-2xl golden-card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <History className="h-4 w-4" />
              <span>বছরভিত্তিক আলাদা হিসাব (চলতি বছর, ১ বছর আগে ও ২ বছর আগে)</span>
            </span>
            <span className="text-[11px] text-slate-400">ক্লিক করে বছরের বিস্তারিত দেখুন</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {yearlyComparison.slice(0, 3).map((yc) => {
              const isSelected = String(selectedYear) === String(yc.year);
              const diff = new Date().getFullYear() - Number(yc.year);
              const badge =
                diff === 0 ? 'চলতি বছর' : diff === 1 ? '১ বছর আগে' : diff === 2 ? '২ বছর আগে' : `${toBanglaNumber(yc.year)}`;
              return (
                <button
                  key={yc.year}
                  onClick={() => onSelectYear(yc.year)}
                  className={`text-left rounded-xl p-3 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {toBanglaNumber(yc.year)} সাল
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                      {badge}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">মোট জমা:</span>
                      <span className="font-semibold text-emerald-400">
                        {formatBDT(yc.totalCollected)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">মোট খরচ:</span>
                      <span className="font-semibold text-orange-400">
                        {formatBDT(yc.totalExpense)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-300">নিট ফান্ড:</span>
                      <span className="font-bold text-amber-300 flex items-center gap-0.5">
                        {formatBDT(yc.netYearBalance)}
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
