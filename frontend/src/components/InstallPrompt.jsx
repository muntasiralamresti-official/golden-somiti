import React from 'react';
import { Smartphone, Download, X, HelpCircle, CheckCircle2, ChevronRight, Share, MoreVertical } from 'lucide-react';

export function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="fixed top-2 inset-x-2.5 z-50 sm:hidden animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/icon-192.png"
            alt="Golden Somiti"
            className="w-10 h-10 rounded-xl border border-amber-400/40 shrink-0 shadow"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-300 truncate">গোল্ডেন সমিতি অ্যাপ</p>
            <p className="text-[11px] text-slate-300">মোবাইলে সরাসরি ইনস্টল করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ইনস্টল</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstallGuideModal({ isOpen, onClose, deferredPrompt, onTriggerInstall }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-bold">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-300">মোবাইলে অ্যাপ ইনস্টল গাইড</h3>
              <p className="text-xs text-slate-400">সহজ উপায়ে মোবাইলে ইনস্টল করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Method 1: One-Click Direct Button (if deferred prompt is ready) */}
          {deferredPrompt && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/50 p-4">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>সরাসরি ১-ক্লিক ইনস্টল তৈরি আছে!</span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                নিচের বাটনে চাপ দিলে সরাসরি অ্যান্ড্রয়েডের অফিসিয়াল ইনস্টল ডায়ালগ আসবে।
              </p>
              <button
                type="button"
                onClick={onTriggerInstall}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-lg cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>এখনই অ্যাপ ইনস্টল করুন</span>
              </button>
            </div>
          )}

          {/* Method 2: Android Chrome 3-Dots */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[11px] text-amber-300">১</span>
              <span>Android ফোনে Chrome দিয়ে ইনস্টল করার নিয়ম:</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 pl-3 list-decimal list-inside">
              <li>
                Chrome ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮)</strong> মেনুতে চাপ দিন।
              </li>
              <li>
                মেনু তালিকা থেকে <strong>"Install app" (বা "অ্যাপ ইনস্টল করুন" / "Add to Home screen")</strong> চাপুন।
              </li>
              <li>
                পপ-আপ আসলে <strong>"Install"</strong> বাটনে চাপ দিন। ১ সেকেন্ডের মধ্যে মোবাইলের হোম স্ক্রিনে অ্যাপ আইকন চলে আসবে!
              </li>
            </ol>
          </div>

          {/* Method 3: PWABuilder ZIP File Notice */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-400/20 text-[11px] text-sky-300">২</span>
              <span>PWABuilder থেকে ফাইল ডাউনলোড করে থাকলে:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              PWABuilder সাধারণত একটি <strong>.ZIP</strong> ফাইল ডাউনলোড করে দেয়।
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-3 list-disc list-inside">
              <li>মোবাইলে ওই <strong>.ZIP</strong> ফাইলটি আনজিপ (Extract) করুন।</li>
              <li>ভেতরের <strong>.apk</strong> ফাইলটিতে চাপ দিলে ইনস্টল হয়ে যাবে।</li>
              <li>মোবাইল যদি <em>"Install unknown apps"</em> পারমিশন চায়, তবে Settings থেকে Allow করে দিন।</li>
            </ul>
          </div>

          {/* Method 4: iPhone / iOS Safari */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400/20 text-[11px] text-indigo-300">৩</span>
              <span>iPhone বা iPad (Safari) ব্যবহারকারীদের জন্য:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              সাফারি ব্রাউজারের নিচে থাকা <strong>Share (শেয়ার)</strong> বাটনে চাপ দিয়ে <strong>"Add to Home Screen"</strong> চাপুন।
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-200 cursor-pointer"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
