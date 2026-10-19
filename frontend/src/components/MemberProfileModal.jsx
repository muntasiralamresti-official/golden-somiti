import React, { useState } from 'react';
import {
  X,
  Download,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Edit3,
  Trash2,
  Award
} from 'lucide-react';
import {
  formatBDT,
  formatDateBn,
  getMonthNameBn,
  toBanglaNumber
} from '../utils/formatters';
import { downloadMemberProfilePDF } from '../utils/pdfExport';

export default function MemberProfileModal({
  member,
  allPayments = [],
  availableYears = [],
  initialYear,
  onClose,
  onQuickPayMonth,
  onEditMember,
  onDeletePayment
}) {
  if (!member) return null;

  const defaultYr =
    initialYear === 'all'
      ? availableYears[0] || new Date().getFullYear()
      : Number(initialYear);

  const [profileYear, setProfileYear] = useState(defaultYr);
  const [downloading, setDownloading] = useState(false);

  const memberPaymentsAll = allPayments.filter(
    (p) => String(p.memberId?._id || p.memberId) === String(member._id)
  );

  const yearRecord =
    (member.yearlyHistory || []).find((h) => Number(h.year) === Number(profileYear)) ||
    member.yearlyHistory?.[0];

  const filteredPaymentsForYear = memberPaymentsAll.filter(
    (p) => Number(p.year) === Number(profileYear)
  );

  const totalAllYearsTarget = (member.yearlyHistory || []).reduce(
    (s, h) => s + (h.yearlyTarget || 0),
    0
  );
  const totalAllYearsPaid = (member.yearlyHistory || []).reduce(
    (s, h) => s + (h.paid || 0),
    0
  );
  const totalAllYearsDue = (member.yearlyHistory || []).reduce(
    (s, h) => s + (h.due || 0),
    0
  );
  const totalAllYearsExpense = (member.yearlyHistory || []).reduce(
    (s, h) => s + (h.expenseShare || 0),
    0
  );
  const totalAllYearsNet = totalAllYearsPaid - totalAllYearsExpense;

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadMemberProfilePDF(member, memberPaymentsAll, profileYear);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-amber-500/30 shadow-2xl">
        {/* Top Profile Header */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-bold text-base shadow-md">
              {member.memberCode}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">{member.name}</h2>
                <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {member.designation || 'সদস্য'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                {member.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-400" />
                    {member.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-amber-400" />
                  যোগদান: {toBanglaNumber(member.joinYear)} সাল
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow cursor-pointer disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading ? 'ডাউনলোড হচ্ছে...' : 'প্রোফাইল পিডিএফ'}</span>
            </button>

            <button
              onClick={() => onEditMember(member)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-amber-300 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>এডিট</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Lifetime / All-Years Summary Row */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2.5">
              সদস্যের সামগ্রিক সারাংশ (সকল বছর একত্রে)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3">
                <div className="text-[11px] text-slate-400">সর্বমোট নির্ধারিত</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatBDT(totalAllYearsTarget)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-3">
                <div className="text-[11px] text-emerald-300">সর্বমোট জমা</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {formatBDT(totalAllYearsPaid)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-rose-500/30 p-3">
                <div className="text-[11px] text-rose-300">সর্বমোট বকেয়া</div>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  {formatBDT(totalAllYearsDue)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-orange-500/30 p-3">
                <div className="text-[11px] text-orange-300">সমিতির খরচে অংশ</div>
                <div className="text-base font-bold text-orange-400 mt-0.5">
                  {formatBDT(totalAllYearsExpense)}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-2xl bg-amber-500/15 border border-amber-400/40 p-3">
                <div className="text-[11px] text-amber-300">খরচ বাদে নিট ফান্ড শেয়ার</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {formatBDT(totalAllYearsNet)}
                </div>
              </div>
            </div>
          </div>

          {/* Year-by-Year Separate Comparison Table for this Member */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2.5">
              বছরভিত্তিক আলাদা হিসাব (১ বছর ও ২ বছর আগের তুলনামূলক চিত্র)
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">অর্থবছর</th>
                    <th className="py-2.5 px-3 text-right">মাসিক হার</th>
                    <th className="py-2.5 px-3 text-right">বার্ষিক ধার্য</th>
                    <th className="py-2.5 px-3 text-right">মোট জমা</th>
                    <th className="py-2.5 px-3 text-right">বকেয়া</th>
                    <th className="py-2.5 px-3 text-right">খরচের অংশ</th>
                    <th className="py-2.5 px-3 text-right">নিট স্থিতি</th>
                    <th className="py-2.5 px-3 text-center">বিস্তারিত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(member.yearlyHistory || []).map((yh) => {
                    const isSelected = Number(profileYear) === Number(yh.year);
                    return (
                      <tr
                        key={yh.year}
                        onClick={() => setProfileYear(yh.year)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-amber-500/15' : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white">
                          {toBanglaNumber(yh.year)} সাল
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatBDT(yh.monthlyAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-200">
                          {formatBDT(yh.yearlyTarget)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                          {formatBDT(yh.paid)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-semibold ${
                            yh.due > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatBDT(yh.due)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-orange-400">
                          {formatBDT(yh.expenseShare)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                          {formatBDT(yh.netBalance)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isSelected ? 'নির্বাচিত' : 'দেখুন'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 12-Month Breakdown Grid for Selected Year */}
          {yearRecord && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {toBanglaNumber(profileYear)} সালের ১২ মাসের কিস্তির কার্ড
                  </h3>
                  <span className="rounded-lg bg-slate-800 px-2.5 py-0.5 text-xs text-amber-300">
                    মাসিক হার: {formatBDT(yearRecord.monthlyAmount)}
                  </span>
                </div>

                {/* Year switcher pills inside profile */}
                <div className="flex items-center gap-1.5">
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setProfileYear(yr)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
                        Number(profileYear) === Number(yr)
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {toBanglaNumber(yr)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {(yearRecord.months || []).map((mItem) => {
                  const isPaid = mItem.status === 'paid';
                  const isPartial = mItem.status === 'partial';
                  return (
                    <div
                      key={mItem.month}
                      className={`rounded-2xl p-3 border transition flex flex-col justify-between ${
                        isPaid
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : isPartial
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {mItem.monthName}
                        </span>
                        {isPaid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : isPartial ? (
                          <Clock className="h-4 w-4 text-amber-400" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400/80" />
                        )}
                      </div>

                      <div className="mt-2 space-y-0.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">জমা:</span>
                          <span
                            className={`font-bold ${
                              isPaid ? 'text-emerald-400' : isPartial ? 'text-amber-300' : 'text-slate-400'
                            }`}
                          >
                            {formatBDT(mItem.paid)}
                          </span>
                        </div>
                        {mItem.due > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">বকেয়া:</span>
                            <span className="font-semibold text-rose-400">
                              {formatBDT(mItem.due)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold ${
                            isPaid
                              ? 'text-emerald-400'
                              : isPartial
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক জমা' : 'বকেয়া আছে'}
                        </span>

                        {!isPaid && (
                          <button
                            onClick={() =>
                              onQuickPayMonth({
                                memberId: member._id,
                                year: profileYear,
                                month: mItem.month,
                                amount: mItem.due || yearRecord.monthlyAmount
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 cursor-pointer"
                          >
                            <PlusCircle className="h-3 w-3" />
                            জমা দিন
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Receipts History for Selected Year */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {toBanglaNumber(profileYear)} সালের জমার রশিদ সমূহ ({toBanglaNumber(filteredPaymentsForYear.length)} টি)
              </h3>
            </div>

            {filteredPaymentsForYear.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
                {toBanglaNumber(profileYear)} সালে এই সদস্যের কোনো জমার রেকর্ড নেই।
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">মাস</th>
                      <th className="py-2.5 px-3">ধরন ও মাধ্যম</th>
                      <th className="py-2.5 px-3">রশিদ ও নোট</th>
                      <th className="py-2.5 px-3 text-right">টাকা</th>
                      <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPaymentsForYear.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-200">{formatDateBn(p.date)}</td>
                        <td className="py-2 px-3 font-semibold text-amber-300">
                          {getMonthNameBn(p.month)}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {p.paymentType} • {p.method}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {p.receiptNo} {p.note ? `(${p.note})` : ''}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {formatBDT(p.amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => onDeletePayment(p._id)}
                            className="inline-flex items-center justify-center rounded-lg bg-rose-500/15 hover:bg-rose-500/30 p-1.5 text-rose-400 cursor-pointer"
                            title="রশিদ মুছে ফেলুন"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
