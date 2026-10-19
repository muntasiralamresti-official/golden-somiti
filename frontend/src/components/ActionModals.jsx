import React, { useState, useEffect } from 'react';
import { X, Calculator, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { BENGALI_MONTHS, formatBDT, toBanglaNumber } from '../utils/formatters';
import { optimizeImageFile, formatBytes } from '../utils/imageOptimizer';

export function MemberModal({
  isOpen,
  editingMember,
  selectedYear,
  onClose,
  onSave
}) {
  const defaultYr =
    selectedYear === 'all' ? new Date().getFullYear() : Number(selectedYear);

  const [form, setForm] = useState({
    memberCode: '',
    name: '',
    phone: '',
    designation: 'সদস্য',
    joinYear: defaultYr,
    monthlyAmount: 1500,
    yearlyTarget: 18000,
    planYear: defaultYr,
    photoUrl: '',
    photoMeta: null,
    note: ''
  });
  const [optimizingPhoto, setOptimizingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingMember) {
      const mAmt = Number(editingMember.monthlyAmountDisplay || editingMember.monthlyAmount || 1500);
      const yTarget = Number(editingMember.yearlyTargetDisplay || editingMember.yearlyTarget || mAmt * 12);
      setForm({
        memberCode: editingMember.memberCode || '',
        name: editingMember.name || '',
        phone: editingMember.phone || '',
        designation: editingMember.designation || 'সদস্য',
        joinYear: editingMember.joinYear || defaultYr,
        monthlyAmount: mAmt,
        yearlyTarget: yTarget,
        planYear: defaultYr,
        photoUrl: editingMember.photoUrl || '',
        photoMeta: editingMember.photoMeta || null,
        note: editingMember.note || ''
      });
    } else {
      setForm({
        memberCode: '',
        name: '',
        phone: '',
        designation: 'সদস্য',
        joinYear: defaultYr,
        monthlyAmount: 1500,
        yearlyTarget: 18000,
        planYear: defaultYr,
        photoUrl: '',
        photoMeta: null,
        note: ''
      });
    }
  }, [editingMember, defaultYr, isOpen]);

  if (!isOpen) return null;

  const handleMonthlyChange = (val) => {
    const num = Number(val) || 0;
    setForm((prev) => ({
      ...prev,
      monthlyAmount: num,
      yearlyTarget: num * 12
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptimizingPhoto(true);
    try {
      const result = await optimizeImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.78,
        format: 'image/webp'
      });
      setForm((prev) => ({
        ...prev,
        photoUrl: result.dataUrl,
        photoMeta: {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          savedPercent: result.savedPercent,
          width: result.width,
          height: result.height,
          format: result.format
        }
      }));
    } catch (err) {
      alert('ছবি অপটিমাইজ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setOptimizingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        selectedYear: form.planYear
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-amber-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-lg font-bold text-amber-300">
            {editingMember ? 'সদস্যের তথ্য ও কিস্তি আপডেট করুন' : 'গোল্ডেন সমিতিতে নতুন সদস্য যোগ করুন'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                সদস্যের পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: মোঃ তানভীর আহমেদ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                সদস্য কোড (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="স্বয়ংক্রিয় (GS-17)"
                value={form.memberCode}
                onChange={(e) => setForm({ ...form, memberCode: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="text"
                placeholder="017XX-XXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                পদবী / পরিচয়
              </label>
              <select
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="সদস্য">সদস্য</option>
                <option value="সভাপতি">সভাপতি</option>
                <option value="সহ-সভাপতি">সহ-সভাপতি</option>
                <option value="সাধারণ সম্পাদক">সাধারণ সম্পাদক</option>
                <option value="কোষাধ্যক্ষ">কোষাধ্যক্ষ</option>
                <option value="সাংগঠনিক সম্পাদক">সাংগঠনিক সম্পাদক</option>
                <option value="কার্যনির্বাহী সদস্য">কার্যনির্বাহী সদস্য</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                যোগদানের সাল
              </label>
              <input
                type="number"
                value={form.joinYear}
                onChange={(e) => setForm({ ...form, joinYear: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
              <span>মাসিক ও বার্ষিক নির্ধারিত অ্যামাউন্ট ({toBanglaNumber(form.planYear)} সাল)</span>
              <span>১২ মাসের অটো হিসাব</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  মাসিক নির্ধারিত টাকা (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.monthlyAmount}
                  onChange={(e) => handleMonthlyChange(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-amber-500/40 px-3.5 py-2 text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  বার্ষিক মোট নির্ধারিত টাকা (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.yearlyTarget}
                  onChange={(e) =>
                    setForm({ ...form, yearlyTarget: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl bg-slate-900 border border-emerald-500/40 px-3.5 py-2 text-emerald-400 font-bold focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Optional Auto-Optimized Image Upload */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt="Preview"
                  className="h-11 w-11 rounded-xl object-cover border border-amber-400/50 shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-amber-300">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200">
                  ছবি অটো-অপটিমাইজ ও সংযুক্তি (ঐচ্ছিক)
                </div>
                {form.photoMeta?.optimizedSize ? (
                  <div className="text-[11px] text-emerald-400 truncate">
                    অপটিমাইজড: {formatBytes(form.photoMeta.originalSize)} →{' '}
                    {formatBytes(form.photoMeta.optimizedSize)} (WebP)
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    আপলোড করলে স্বয়ংক্রিয়ভাবে মেগাবাইট কমে WebP হয়ে যাবে
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {form.photoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, photoUrl: '', photoMeta: null })}
                  className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400 cursor-pointer"
                  title="ছবি সরান"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <label className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-300 cursor-pointer">
                <span>{optimizingPhoto ? 'অপটিমাইজ হচ্ছে...' : 'ছবি দিন'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              মন্তব্য / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="সদস্য সম্পর্কে যেকোনো নোট..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-amber-300 hover:to-amber-400 cursor-pointer disabled:opacity-60"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : editingMember ? 'আপডেট সংরক্ষণ করুন' : 'সদস্য যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PaymentModal({
  isOpen,
  members = [],
  selectedYear,
  prefillData,
  onClose,
  onSave
}) {
  const defaultYr =
    selectedYear === 'all' ? new Date().getFullYear() : Number(selectedYear);

  const [memberId, setMemberId] = useState('');
  const [year, setYear] = useState(defaultYr);
  const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() + 1]);
  const [amount, setAmount] = useState(1500);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState('মাসিক কিস্তি');
  const [method, setMethod] = useState('নগদ (Cash)');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (prefillData) {
      setMemberId(prefillData.memberId || members[0]?._id || '');
      setYear(Number(prefillData.year || defaultYr));
      setSelectedMonths([Number(prefillData.month ?? new Date().getMonth() + 1)]);
      setAmount(Number(prefillData.amount || 1500));
    } else {
      const firstMember = members[0];
      setMemberId(firstMember?._id || '');
      setYear(defaultYr);
      setSelectedMonths([new Date().getMonth() + 1]);
      setAmount(Number(firstMember?.monthlyAmountDisplay || firstMember?.monthlyAmount || 1500));
    }
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
  }, [isOpen, prefillData, defaultYr, members]);

  if (!isOpen) return null;

  const currentMember = members.find((m) => String(m._id) === String(memberId));
  const monthlyRate = Number(
    currentMember?.monthlyAmountDisplay || currentMember?.monthlyAmount || 1500
  );

  const handleMemberSelect = (newId) => {
    setMemberId(newId);
    const found = members.find((m) => String(m._id) === String(newId));
    if (found) {
      const rate = Number(found.monthlyAmountDisplay || found.monthlyAmount || 1500);
      setAmount(rate * Math.max(1, selectedMonths.length));
    }
  };

  const toggleMonth = (mNum) => {
    if (mNum === 0) {
      setSelectedMonths([0]);
      return;
    }
    setSelectedMonths((prev) => {
      const filtered = prev.filter((x) => x !== 0);
      let next;
      if (filtered.includes(mNum)) {
        next = filtered.filter((x) => x !== mNum);
        if (next.length === 0) next = [mNum];
      } else {
        next = [...filtered, mNum].sort((a, b) => a - b);
      }
      setAmount(monthlyRate * next.length);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await onSave({
        memberId,
        year: Number(year),
        month: selectedMonths[0],
        months: selectedMonths.length > 1 ? selectedMonths : undefined,
        amount: Number(amount),
        date,
        paymentType,
        method,
        note
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-lg font-bold text-emerald-400">
            সদস্যের কিস্তি ও দৈনন্দিন কালেকশন জমা নিন
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              সদস্য নির্বাচন করুন *
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberSelect(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white focus:border-emerald-400 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.memberCode} — {m.name} (মাসিক: {formatBDT(m.monthlyAmountDisplay)} | বকেয়া: {formatBDT(m.totalDue)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                হিসাবের বছর *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                তারিখ *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                পেমেন্ট মাধ্যম
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="নগদ (Cash)">নগদ (Cash)</option>
                <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                <option value="নগদ অ্যাপ (Nagad)">নগদ অ্যাপ (Nagad)</option>
                <option value="ব্যাংক (Bank)">ব্যাংক (Bank)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                কোন মাসের জমা? (একাধিক মাস একসাথে সিলেক্ট করা যাবে)
              </label>
              <button
                type="button"
                onClick={() => toggleMonth(0)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold cursor-pointer ${
                  selectedMonths.includes(0)
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                এককালীন / দৈনিক জমা
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {BENGALI_MONTHS.map((bm) => {
                const isSelected = selectedMonths.includes(bm.num);
                const monthHistory = currentMember?.monthsBreakdown?.find(
                  (mb) => mb.month === bm.num
                );
                const alreadyPaid = monthHistory?.status === 'paid';
                return (
                  <button
                    key={bm.num}
                    type="button"
                    onClick={() => toggleMonth(bm.num)}
                    className={`rounded-xl py-1.5 px-2 text-xs font-semibold border transition cursor-pointer flex flex-col items-center ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow'
                        : alreadyPaid
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/40'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{bm.short}</span>
                    <span className="text-[9px] opacity-80">
                      {alreadyPaid ? 'পরিশোধিত' : 'বাকি'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                জমার পরিমাণ (মোট টাকা ৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-emerald-500/50 px-3.5 py-2.5 text-lg font-bold text-emerald-400 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                জমার ধরন
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="মাসিক কিস্তি">মাসিক কিস্তি</option>
                <option value="দৈনিক জমা">দৈনিক জমা</option>
                <option value="বকেয়া পরিশোধ">বকেয়া পরিশোধ</option>
                <option value="এককালীন জমা">এককালীন জমা</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              মন্তব্য / রশিদ নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: বিকাশ ট্রানজেকশন বা নগদ জমা..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-emerald-400 hover:to-teal-400 cursor-pointer disabled:opacity-60"
            >
              {saving ? 'জমা হচ্ছে...' : 'কালেকশন সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ExpenseModal({
  isOpen,
  members = [],
  selectedYear,
  currentFundBalance = 0,
  onClose,
  onSave
}) {
  const defaultYr =
    selectedYear === 'all' ? new Date().getFullYear() : Number(selectedYear);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ইভেন্ট ও অনুষ্ঠান');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [year, setYear] = useState(defaultYr);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [spentBy, setSpentBy] = useState('কমিটি');
  const [splitType, setSplitType] = useState('all_active');
  const [participants, setParticipants] = useState([]);
  const [voucherImage, setVoucherImage] = useState('');
  const [voucherImageMeta, setVoucherImageMeta] = useState(null);
  const [optimizingVoucher, setOptimizingVoucher] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setCategory('ইভেন্ট ও অনুষ্ঠান');
    setCustomCategory('');
    setAmount('');
    setYear(defaultYr);
    setDate(new Date().toISOString().slice(0, 10));
    setSpentBy('কমিটি');
    setSplitType('all_active');
    setParticipants(members.map((m) => m._id));
    setVoucherImage('');
    setVoucherImageMeta(null);
    setNote('');
  }, [isOpen, defaultYr, members]);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const targetCount =
    splitType === 'selected'
      ? Math.max(1, participants.length)
      : Math.max(1, members.length);
  const perMemberCost = Math.round((numAmount / targetCount) * 100) / 100;
  const remainingFundAfterExpense = currentFundBalance - numAmount;

  const toggleParticipant = (id) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleVoucherImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptimizingVoucher(true);
    try {
      const result = await optimizeImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.75,
        format: 'image/webp'
      });
      setVoucherImage(result.dataUrl);
      setVoucherImageMeta({
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        format: result.format
      });
    } finally {
      setOptimizingVoucher(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || numAmount <= 0) return;
    const resolvedCategory =
      category === '__custom__'
        ? customCategory.trim() || 'অন্যান্য খরচ'
        : category;

    setSaving(true);
    try {
      await onSave({
        title,
        category: resolvedCategory,
        amount: numAmount,
        year: Number(year),
        date,
        spentBy,
        splitType,
        participants: splitType === 'selected' ? participants : [],
        voucherImage,
        voucherImageMeta,
        note
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-amber-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-lg font-bold text-amber-400">
            ফান্ড থেকে খরচ ও সদস্যদের মাঝে বণ্টন হিসাব
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              খরচের খাত / বিবরণ *
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: বার্ষিক পিকনিক, ইফতার মাহফিল, মিটিং আপ্যায়ন..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                খরচের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-amber-500/50 px-3.5 py-2.5 text-lg font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  ক্যাটাগরি
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (category === '__custom__') {
                      setCategory('ইভেন্ট ও অনুষ্ঠান');
                    } else {
                      setCategory('__custom__');
                    }
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {category === '__custom__' ? 'তালিকা থেকে বাছুন' : '+ কাস্টম লিখুন'}
                </button>
              </div>

              {category === '__custom__' ? (
                <input
                  type="text"
                  required
                  placeholder="ক্যাটাগরির নাম লিখুন (যেমন: পিকনিক বাস ভাড়া)..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-amber-400 px-3 py-2.5 text-white focus:outline-none"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCategory('__custom__');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ইভেন্ট ও অনুষ্ঠান">ইভেন্ট ও অনুষ্ঠান</option>
                  <option value="আপ্যায়ন ও মিটিং">আপ্যায়ন ও মিটিং</option>
                  <option value="স্টেশনারি ও অফিস">স্টেশনারি ও অফিস</option>
                  <option value="সদস্য সহায়তা / কল্যাণ">সদস্য সহায়তা / কল্যাণ</option>
                  <option value="বিনিয়োগ / প্রজেক্ট">বিনিয়োগ / প্রজেক্ট</option>
                  <option value="অন্যান্য খরচ">অন্যান্য খরচ</option>
                  <option value="__custom__">✏️ কাস্টম ক্যাটাগরি লিখুন...</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                অর্থবছর
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                তারিখ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                খরচ করেছেন (মারফত)
              </label>
              <input
                type="text"
                value={spentBy}
                onChange={(e) => setSpentBy(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Split Mode among Members */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 space-y-2.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>সদস্যদের মাঝে খরচের হিসাব বণ্টন পদ্ধতি:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSplitType('all_active')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                    splitType === 'all_active'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  সবার মাঝে সমান ভাগ
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('selected')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                    splitType === 'selected'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  নির্দিষ্ট সদস্য নির্বাচন
                </button>
              </div>
            </div>

            {splitType === 'selected' && (
              <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-1.5 pt-1">
                {members.map((m) => {
                  const checked = participants.includes(m._id);
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleParticipant(m._id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] border cursor-pointer ${
                        checked
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Check className={`h-3 w-3 ${checked ? 'text-amber-400' : 'opacity-20'}`} />
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Shared Calculation Preview */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
              <Calculator className="h-4 w-4" />
              <span>খরচ পরবর্তী ফান্ড ও মাথাপিছু অটো ক্যালকুলেশন:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-900/90 p-2">
                <div className="text-[10px] text-slate-400">বর্তমান ফান্ড</div>
                <div className="text-xs font-bold text-emerald-400">
                  {formatBDT(currentFundBalance)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 p-2">
                <div className="text-[10px] text-slate-400">
                  মাথাপিছু খরচ ({toBanglaNumber(targetCount)} জন)
                </div>
                <div className="text-xs font-bold text-orange-400">
                  {formatBDT(perMemberCost)} /জন
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 p-2">
                <div className="text-[10px] text-slate-400">খরচ বাদে ফান্ডে থাকবে</div>
                <div className="text-xs font-bold text-amber-300">
                  {formatBDT(remainingFundAfterExpense)}
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Image Auto-Optimizer */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {voucherImage ? (
                <img
                  src={voucherImage}
                  alt="Voucher"
                  className="h-10 w-10 rounded-lg object-cover border border-amber-400/50"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-amber-400 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200">
                  ভাউচার বা রশিদের ছবি (অটো ইমেজ অপটিমাইজ)
                </div>
                {voucherImageMeta ? (
                  <div className="text-[10px] text-emerald-400">
                    অপটিমাইজড: {formatBytes(voucherImageMeta.originalSize)} →{' '}
                    {formatBytes(voucherImageMeta.optimizedSize)}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">ঐচ্ছিক রশিদ কপি সংযুক্ত করুন</div>
                )}
              </div>
            </div>

            <label className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-300 cursor-pointer shrink-0">
              <span>{optimizingVoucher ? 'অপটিমাইজ হচ্ছে...' : 'রশিদ ছবি'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleVoucherImage}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ভাউচার নোট / বিস্তারিত (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="খরচের অতিরিক্ত বিবরণ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-amber-300 hover:to-orange-400 cursor-pointer disabled:opacity-60"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'খরচ লিপিবদ্ধ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function YearConfigModal({
  isOpen,
  selectedYear,
  fontSize = 'md',
  onFontSizeChange,
  onOpenAppHub,
  onOpenBackup,
  onClose,
  onSave
}) {
  const defaultYr =
    selectedYear === 'all' ? new Date().getFullYear() : Number(selectedYear);

  const [year, setYear] = useState(defaultYr);
  const [monthlyAmount, setMonthlyAmount] = useState(1500);
  const [yearlyTarget, setYearlyTarget] = useState(18000);
  const [applyToAllMembers, setApplyToAllMembers] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setYear(defaultYr);
    }
  }, [isOpen, defaultYr]);

  if (!isOpen) return null;

  const handleMonthly = (val) => {
    const num = Number(val) || 0;
    setMonthlyAmount(num);
    setYearlyTarget(num * 12);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        year: Number(year),
        defaultMonthlyAmount: Number(monthlyAmount),
        defaultYearlyTarget: Number(yearlyTarget),
        applyToAllMembers,
        note
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-amber-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-amber-300">
            বার্ষিক কিস্তির হার ও নতুন অর্থবছর সেটআপ
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              অর্থবছর (যেমন: ২০২৩, ২০২৪, ২০২৫, ২০২৬, ২০২৭) *
            </label>
            <input
              type="number"
              required
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                মাসিক কিস্তির হার (৳)
              </label>
              <input
                type="number"
                required
                value={monthlyAmount}
                onChange={(e) => handleMonthly(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-amber-500/40 px-3.5 py-2 text-amber-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                বার্ষিক মোট ধার্য (৳)
              </label>
              <input
                type="number"
                required
                value={yearlyTarget}
                onChange={(e) => setYearlyTarget(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-emerald-500/40 px-3.5 py-2 text-emerald-400 font-bold"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl bg-slate-900 border border-slate-800 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAllMembers}
              onChange={(e) => setApplyToAllMembers(e.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            <span className="text-xs text-slate-200">
              এই বছরের জন্য সকল সদস্যের প্রোফাইলে এই মাসিক/বার্ষিক হার প্রযোজ্য করুন
            </span>
          </label>

          {/* Mobile & Display Font Size Control */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">
                📱 মোবাইল ও ডিসপ্লে লেখার সাইজ (Font Size)
              </span>
              <span className="text-[11px] text-slate-400">
                {fontSize === 'sm' ? 'ছোট' : fontSize === 'md' ? 'স্বাভাবিক' : fontSize === 'lg' ? 'বড়' : 'অতিরিক্ত বড়'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              মোবাইলে পড়তে সুবিধা অনুযায়ী লেখার সাইজ ছোট বা বড় করতে পারেন:
            </p>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { id: 'sm', label: 'ছোট', preview: 'A-' },
                { id: 'md', label: 'স্বাভাবিক', preview: 'A' },
                { id: 'lg', label: 'বড়', preview: 'A+' },
                { id: 'xl', label: 'খুব বড়', preview: 'A++' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFontSizeChange && onFontSizeChange(opt.id)}
                  className={`rounded-xl py-2 px-1 text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                    fontSize === opt.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs">{opt.preview}</span>
                  <span className="text-[10px] mt-0.5 opacity-90">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* APK & Image Optimizer Studio Link */}
          {onOpenAppHub && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-amber-300 block">
                  📲 APK ডাউনলোড ও ইমেজ অপটিমাইজার
                </span>
                <span className="text-[11px] text-slate-400">
                  মোবাইল অ্যাপ ইনস্টল ও ছবির সাইজ ছোট করার টুল
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAppHub();
                }}
                className="shrink-0 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
              >
                খুলুন
              </button>
            </div>
          )}

          {/* Backup & History Link */}
          {onOpenBackup && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-indigo-300 block">
                  💾 ডাটাবেজ ব্যাকআপ ও রিস্টোর
                </span>
                <span className="text-[11px] text-slate-400">
                  সম্পূর্ণ ডাটা JSON ফাইল ডাউনলোড ও রিস্টোর
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="shrink-0 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 px-3 py-1.5 text-xs font-bold text-indigo-300 cursor-pointer"
              >
                খুলুন
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 cursor-pointer"
            >
              {saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
