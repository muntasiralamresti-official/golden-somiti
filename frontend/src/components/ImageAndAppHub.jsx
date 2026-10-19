import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Smartphone,
  Download,
  Sliders,
  Sparkles,
  CheckCircle2,
  Upload,
  UserCheck,
  Package,
  Share2,
  Copy,
  Check,
  ExternalLink,
  X
} from 'lucide-react';
import { optimizeImageFile, formatBytes } from '../utils/imageOptimizer';
import { toBanglaNumber } from '../utils/formatters';

export default function ImageAndAppHub({
  members = [],
  deferredPrompt,
  onClearDeferredPrompt,
  onAssignPhotoToMember,
  isModal = false,
  onCloseModal
}) {
  // Image Optimizer State
  const [rawFile, setRawFile] = useState(null);
  const [maxWidth, setMaxWidth] = useState(600);
  const [quality, setQuality] = useState(0.75);
  const [format, setFormat] = useState('image/webp');
  const [optimizedResult, setOptimizedResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?._id || '');
  const [assignSuccess, setAssignSuccess] = useState('');
  const fileInputRef = useRef(null);

  // App / APK Download State
  const [networkIps, setNetworkIps] = useState([]);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0]._id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    fetch('/api/network-info')
      .then((r) => (r.ok ? r.json() : { ips: [] }))
      .then((d) => setNetworkIps(d.ips || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!rawFile) return;
    let active = true;
    setOptimizing(true);
    optimizeImageFile(rawFile, {
      maxWidth: Number(maxWidth),
      maxHeight: Number(maxWidth),
      quality: Number(quality),
      format
    })
      .then((res) => {
        if (active) setOptimizedResult(res);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setOptimizing(false);
      });
    return () => {
      active = false;
    };
  }, [rawFile, maxWidth, quality, format]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setRawFile(f);
      setAssignSuccess('');
    }
  };

  const handleDownloadOptimizedImage = () => {
    if (!optimizedResult) return;
    const a = document.createElement('a');
    a.href = optimizedResult.dataUrl;
    const baseName = optimizedResult.originalName.replace(/\.[^.]+$/, '');
    a.download = `${baseName}-optimized.${optimizedResult.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAssignToMember = async () => {
    if (!optimizedResult || !selectedMemberId || !onAssignPhotoToMember) return;
    await onAssignPhotoToMember(selectedMemberId, {
      photoUrl: optimizedResult.dataUrl,
      photoMeta: {
        originalSize: optimizedResult.originalSize,
        optimizedSize: optimizedResult.optimizedSize,
        width: optimizedResult.width,
        height: optimizedResult.height,
        format: optimizedResult.format
      }
    });
    const m = members.find((x) => String(x._id) === String(selectedMemberId));
    setAssignSuccess(`"${m?.name || 'সদস্য'}"-এর প্রোফাইলে অপটিমাইজড ছবি যুক্ত হয়েছে!`);
  };

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const mobileAccessUrl =
    networkIps.length > 0 && currentOrigin.includes('localhost')
      ? networkIps[0].url
      : currentOrigin;

  const handleDirectLauncherDownload = () => {
    const launcherHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>গোল্ডেন সমিতি (Golden Somiti App)</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; background: #090d16; color: #fbbf24; font-family: sans-serif; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="${mobileAccessUrl}" allow="clipboard-write"></iframe>
</body>
</html>`;
    const blob = new Blob([launcherHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Golden-Somiti-Mobile-App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted' && onClearDeferredPrompt) {
        onClearDeferredPrompt();
      }
    } else {
      handleDirectLauncherDownload();
    }
  };

  const handleCopy = (txt) => {
    navigator.clipboard?.writeText(txt);
    setCopiedText(txt);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const content = (
    <div className="space-y-6">
      {/* SECTION 1: APK & MOBILE APP DOWNLOAD CENTER */}
      <div className="rounded-3xl golden-card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300">
                মোবাইল অ্যাপ ডাউনলোড ও Android APK ভার্সন সেন্টার
              </h2>
              <p className="text-xs text-slate-400">
                সরাসরি মোবাইল অ্যাপ ইনস্টল, APK বিল্ড এবং Vercel ডিপ্লয়মেন্ট রেডি প্যাকেজ
              </p>
            </div>
          </div>

          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: 1-Click Direct App Install / Launcher */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 p-4 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 mb-2">
                সবচেয়ে সহজ (১-ক্লিক ইনস্টল)
              </span>
              <h3 className="text-sm font-bold text-white">
                সরাসরি মোবাইল অ্যাপ ডাউনলোড / ইনস্টল
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                প্লে-স্টোর বা ঝামেলা ছাড়াই এক ক্লিকে আপনার মোবাইলে অ্যাপটি ইনস্টল করুন অথবা ওয়ান-ট্যাপ লঞ্চার ফাইল ডাউনলোড করুন।
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleNativeInstall}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-lg cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>
                  {deferredPrompt
                    ? 'মোবাইলে অ্যাপ ইনস্টল করুন (Direct)'
                    : 'মোবাইল অ্যাপ লঞ্চার ডাউনলোড করুন'}
                </span>
              </button>
            </div>
          </div>

          {/* Option 2: Native Android APK Builder (Capacitor + PWABuilder for Vercel) */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-500/40 p-4 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 mb-2">
                <Package className="h-3 w-3" />
                Native Android .APK ভার্সন
              </span>
              <h3 className="text-sm font-bold text-white">
                Android `.APK` ফাইল তৈরি ও ডাউনলোড
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                প্রজেক্টে <strong>Capacitor Android (`com.goldensomiti.app`)</strong> এবং <strong>GitHub Actions Auto-APK Builder</strong> যুক্ত করা হয়েছে। এছাড়া Vercel-এ ডিপ্লয় করার পর নিচের বাটনে ক্লিক করে ৩০ সেকেন্ডে `.APK` ডাউনলোড করতে পারবেন:
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <a
                href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentOrigin)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 px-3 text-xs font-bold text-slate-950 shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Vercel লিংক থেকে সরাসরি .APK বানান</span>
              </a>
            </div>
          </div>

          {/* Option 3: Share / Copy Mobile Link */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300 mb-2">
                <Share2 className="h-3 w-3" />
                মোবাইল লিংক ও শেয়ার
              </span>
              <h3 className="text-sm font-bold text-white">
                সদস্যদের মোবাইলে অ্যাপ লিংক পাঠান
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                বর্তমান অ্যাপ লিংক:
              </p>
              <div className="mt-1.5 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-emerald-400 truncate">
                {mobileAccessUrl}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleCopy(mobileAccessUrl)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 px-3 text-xs font-semibold text-amber-300 cursor-pointer"
              >
                {copiedText === mobileAccessUrl ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>লিংক কপি</span>
                  </>
                )}
              </button>

              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() =>
                    navigator.share({
                      title: 'গোল্ডেন সমিতি (Golden Somiti)',
                      text: 'গোল্ডেন সমিতির তহবিল ও সদস্য ড্যাশবোর্ড অ্যাপ:',
                      url: mobileAccessUrl
                    })
                  }
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2.5 text-xs font-bold text-white cursor-pointer"
                >
                  শেয়ার
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BUILT-IN IMAGE OPTIMIZER STUDIO */}
      <div className="rounded-3xl golden-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ইমেজ অপটিমাইজার স্টুডিও (Image Optimizer)</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  WebP / মেগাবাইট কম্প্রেসর
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                যেকোনো বড় সাইজের ছবি বা ভাউচার ৮৫%–৯৫% পর্যন্ত সাইজ কমিয়ে (অপটিমাইজ করে) ডাউনলোড করুন অথবা সদস্যের প্রোফাইলে যুক্ত করুন
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>ছবি নির্বাচন করুন</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Optimizer Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              আউটপুট ফরম্যাট
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            >
              <option value="image/webp">WebP (সবচেয়ে কম সাইজ ও শার্প)</option>
              <option value="image/jpeg">JPEG (স্ট্যান্ডার্ড ফটো)</option>
              <option value="image/png">PNG (গ্রাফিক্স)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              সর্বোচ্চ রেজোলিউশন (Max Width/Height)
            </label>
            <select
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            >
              <option value={300}>300px (অ্যাভাটার / ছোট আইকন)</option>
              <option value={600}>600px (প্রোফাইল ও কার্ড - সেরা)</option>
              <option value={1000}>1000px (রশিদ ও ভাউচার)</option>
              <option value={1400}>1400px (এইচডি ডকুমেন্ট)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>কম্প্রেশন কোয়ালিটি:</span>
              <span className="text-amber-300">{toBanglaNumber(Math.round(quality * 100))}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Result Preview */}
        {!optimizedResult ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-900/40 p-8 text-center cursor-pointer transition"
          >
            <Sliders className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-200">
              অপটিমাইজ করার জন্য এখানে ক্লিক করে যেকোনো ছবি আপলোড করুন
            </div>
            <div className="text-xs text-slate-400 mt-1">
              JPG, PNG, WebP বা ক্যামেরা ছবি সাপোর্ট করে (স্বয়ংক্রিয়ভাবে মেগাবাইট কমিয়ে দেবে)
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="md:col-span-4 flex flex-col items-center">
              <img
                src={optimizedResult.dataUrl}
                alt="Optimized preview"
                className="max-h-48 rounded-2xl border border-amber-500/30 object-contain shadow-lg"
              />
              <span className="text-[11px] text-slate-400 mt-2">
                ডাইমেনশন: {optimizedResult.width} × {optimizedResult.height} px ({optimizedResult.format.toUpperCase()})
              </span>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                  <div className="text-[11px] text-slate-400">আগের মূল সাইজ</div>
                  <div className="text-sm sm:text-base font-bold text-rose-400 mt-0.5">
                    {formatBytes(optimizedResult.originalSize)}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-3">
                  <div className="text-[11px] text-emerald-300">অপটিমাইজড সাইজ</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                    {formatBytes(optimizedResult.optimizedSize)}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-500/15 border border-amber-400/40 p-3">
                  <div className="text-[11px] text-amber-300">সাইজ কমেছে</div>
                  <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                    {toBanglaNumber(optimizedResult.savedPercent)}% সাশ্রয়
                  </div>
                </div>
              </div>

              {assignSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadOptimizedImage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>অপটিমাইজড ছবি ডাউনলোড করুন</span>
                </button>

                {members.length > 0 && onAssignPhotoToMember && (
                  <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white"
                    >
                      {members.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.memberCode} — {m.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignToMember}
                      className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2.5 text-xs font-bold text-slate-950 cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>সদস্যে যুক্ত করুন</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-amber-500/40 p-4 sm:p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
