import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  History,
  ShieldCheck,
  FileJson,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { formatBDT, formatDateBn, toBanglaNumber } from '../utils/formatters';

export default function BackupAndHistoryView({
  yearlyComparison = [],
  members = [],
  availableYears = [],
  onSelectYear,
  onOpenMemberProfile,
  onDataRestored
}) {
  const [snapshots, setSnapshots] = useState([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef(null);

  const fetchSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/backups/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: `ম্যানুয়াল ব্যাকআপ (${new Date().toLocaleDateString('bn-BD')})`
        })
      });
      if (res.ok) {
        setStatusMsg('সার্ভারে নতুন ব্যাকআপ স্ন্যাপশট সফলভাবে সংরক্ষিত হয়েছে!');
        await fetchSnapshots();
      }
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleDownloadFullBackup = async () => {
    try {
      const res = await fetch('/api/backups/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `golden-somiti-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg('ব্যাকআপ ফাইলটি আপনার ডিভাইসে ডাউনলোড হয়েছে!');
    } catch (err) {
      alert('ব্যাকআপ ডাউনলোডে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const handleRestoreFromFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    setStatusMsg('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: parsed })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'রিস্টোর ব্যর্থ হয়েছে');
      setStatusMsg('সফলভাবে ব্যাকআপ ফাইল থেকে সকল ডাটা পুনরুদ্ধার করা হয়েছে!');
      await fetchSnapshots();
      if (onDataRestored) onDataRestored();
    } catch (err) {
      alert('রিস্টোর ত্রুটি: ' + err.message);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreServerSnapshot = async (fileName) => {
    setRestoring(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'রিস্টোর ব্যর্থ হয়েছে');
      setStatusMsg(`"${fileName}" থেকে সকল ডাটা সফলভাবে পুনরুদ্ধার হয়েছে!`);
      await fetchSnapshots();
      if (onDataRestored) onDataRestored();
    } catch (err) {
      alert('রিস্টোর ত্রুটি: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Multi-Year Comparison Matrix (1 year ago, 2 years ago, current year) */}
      <div className="rounded-3xl golden-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
              <History className="h-5 w-5" />
              <span>বিগত বছরগুলোর তুলনামূলক ফান্ড ও সদস্য প্রোফাইল আর্কাইভ</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              চলতি বছর, ১ বছর আগে এবং ২ বছর আগের সকল সদস্যের জমা, বকেয়া ও খরচের আলাদা হিসাব
            </p>
          </div>
        </div>

        {/* Yearly Summary Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 mb-6">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-amber-300 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">অর্থবছর</th>
                <th className="py-3 px-3.5 text-center">সদস্য</th>
                <th className="py-3 px-3.5 text-right">বার্ষিক মোট ধার্য</th>
                <th className="py-3 px-3.5 text-right">ফান্ডে মোট জমা ছিল</th>
                <th className="py-3 px-3.5 text-right">বকেয়া ছিল</th>
                <th className="py-3 px-3.5 text-right">ফান্ড হতে খরচ</th>
                <th className="py-3 px-3.5 text-right">মাথাপিছু খরচ</th>
                <th className="py-3 px-3.5 text-right">বর্ষশেষে নিট ফান্ড</th>
                <th className="py-3 px-3.5 text-center">ড্যাশবোর্ডে দেখুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {yearlyComparison.map((yc) => (
                <tr key={yc.year} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3.5 font-bold text-white">
                    {toBanglaNumber(yc.year)} সাল
                  </td>
                  <td className="py-3 px-3.5 text-center text-slate-300">
                    {toBanglaNumber(yc.memberCount)} জন
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-200">
                    {formatBDT(yc.totalTarget)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-emerald-400">
                    {formatBDT(yc.totalCollected)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-rose-400">
                    {formatBDT(yc.totalDue)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-orange-400">
                    {formatBDT(yc.totalExpense)}
                  </td>
                  <td className="py-3 px-3.5 text-right text-amber-300">
                    {formatBDT(yc.perMemberExpense)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-amber-300">
                    {formatBDT(yc.netYearBalance)}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <button
                      onClick={() => onSelectYear(yc.year)}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/30 px-2.5 py-1 text-xs font-semibold text-amber-300 cursor-pointer"
                    >
                      <span>{toBanglaNumber(yc.year)} দেখুন</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Member-wise Multi-Year Comparison Matrix */}
        <h3 className="text-xs sm:text-sm font-bold text-white mb-2.5 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-400" />
          <span>প্রত্যেক সদস্যের বছরভিত্তিক জমা ও বকেয়া তুলনামূলক তালিকা (ক্লিক করলে আলাদা প্রোফাইল খুলবে)</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">সদস্যের নাম ও কোড</th>
                {availableYears.map((yr) => (
                  <th key={yr} className="py-2.5 px-3 text-right">
                    {toBanglaNumber(yr)} সাল (জমা / বকেয়া)
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center">প্রোফাইল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members.map((m) => (
                <tr key={m._id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{m.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {m.memberCode} • {m.designation}
                    </div>
                  </td>
                  {availableYears.map((yr) => {
                    const yh = (m.yearlyHistory || []).find(
                      (h) => Number(h.year) === Number(yr)
                    );
                    return (
                      <td key={yr} className="py-2.5 px-3 text-right">
                        <div className="font-bold text-emerald-400">
                          জমা: {formatBDT(yh?.paid || 0)}
                        </div>
                        <div
                          className={`text-[10px] ${
                            (yh?.due || 0) > 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          বকেয়া: {formatBDT(yh?.due || 0)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onOpenMemberProfile(m)}
                      className="rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition cursor-pointer"
                    >
                      প্রোফাইল
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Permanent Data Backup & Restore Center */}
      <div className="rounded-3xl golden-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>স্থায়ী ডাটা ব্যাকআপ ও রিস্টোর সেন্টার</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  মঙ্গোডিবি + ডিস্ক অটো-ব্যাকআপ সক্রিয়
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                প্রতিটি লেনদেনের সাথে সাথে MongoDB ডাটাবেস এবং সার্ভারের ডিস্কে স্বয়ংক্রিয়ভাবে ব্যাকআপ ফাইল সংরক্ষিত হয়। চাইলে মোবাইলে বা কম্পিউটারে ব্যাকআপ ডাউনলোড করে রাখতে পারবেন।
              </p>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <button
            onClick={handleDownloadFullBackup}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:from-emerald-400 hover:to-teal-500 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>মোবাইল/পিসিতে ফুল ব্যাকআপ ডাউনলোড (.JSON)</span>
          </button>

          <button
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${creatingSnapshot ? 'animate-spin' : ''}`} />
            <span>
              {creatingSnapshot ? 'স্ন্যাপশট তৈরি হচ্ছে...' : 'সার্ভারে নতুন স্ন্যাপশট ব্যাকআপ রাখুন'}
            </span>
          </button>

          <label className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3.5 text-xs sm:text-sm font-bold text-amber-300 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{restoring ? 'রিস্টোর হচ্ছে...' : 'ব্যাকআপ ফাইল আপলোড করে রিস্টোর'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFromFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Saved Server Snapshots List */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2.5">
            সার্ভারে সংরক্ষিত স্বয়ংক্রিয় ও ম্যানুয়াল ব্যাকআপ ফাইলসমূহ ({toBanglaNumber(snapshots.length)} টি)
          </h3>

          {loadingSnapshots ? (
            <div className="text-xs text-slate-400 py-4">ব্যাকআপ তালিকা লোড হচ্ছে...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {snapshots.map((snap) => (
                <div
                  key={snap.fileName}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileJson className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {snap.label}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        ফাইল: {snap.fileName} • তারিখ: {formatDateBn(snap.exportedAt)}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        সদস্য: {toBanglaNumber(snap.counts?.members || 0)} জন | জমা:{' '}
                        {toBanglaNumber(snap.counts?.payments || 0)} টি | খরচ:{' '}
                        {toBanglaNumber(snap.counts?.expenses || 0)} টি
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`/api/backups/file/${encodeURIComponent(snap.fileName)}`}
                      download={snap.fileName}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200"
                    >
                      ডাউনলোড
                    </a>
                    <button
                      onClick={() => handleRestoreServerSnapshot(snap.fileName)}
                      disabled={restoring}
                      className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 cursor-pointer"
                    >
                      রিস্টোর
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
