import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Wallet,
  Receipt,
  History,
  Search,
  PlusCircle,
  Download,
  Edit3,
  Trash2,
  Phone,
  Calculator,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  Smartphone,
  Image as ImageIcon,
  Settings,
  Home
} from 'lucide-react';
import ArtisticHeader from './components/ArtisticHeader';
import FundOverviewCards from './components/FundOverviewCards';
import MemberProfileModal from './components/MemberProfileModal';
import {
  MemberModal,
  PaymentModal,
  ExpenseModal,
  YearConfigModal
} from './components/ActionModals';
import BackupAndHistoryView from './components/BackupAndHistoryView';
import ImageAndAppHub from './components/ImageAndAppHub';
import { InstallBanner, InstallGuideModal } from './components/InstallPrompt';
import {
  BENGALI_MONTHS,
  formatBDT,
  formatDateBn,
  getMonthNameBn,
  toBanglaNumber
} from './utils/formatters';
import {
  downloadFullSocietyReportPDF,
  downloadMemberProfilePDF
} from './utils/pdfExport';

export default function App() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'transactions' | 'members' | 'history' | 'apphub'
  const [transactionSubTab, setTransactionSubTab] = useState('collections'); // 'collections' | 'expenses'
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('golden_somiti_font_size') || 'md';
  });

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('golden_somiti_font_size', size);
  };

  // Filters & View Modes
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [collectionMonthFilter, setCollectionMonthFilter] = useState('all');
  const [collectionMethodFilter, setCollectionMethodFilter] = useState('all');

  // Modals State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isYearConfigOpen, setIsYearConfigOpen] = useState(false);
  const [activeProfileMemberId, setActiveProfileMemberId] = useState(null);
  const [isAppHubModalOpen, setIsAppHubModalOpen] = useState(false);

  // PWA Deferred Prompt & Mobile Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // PDF Downloading State
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadingMemberId, setDownloadingMemberId] = useState(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setIsInstallGuideOpen(true);
      }
    } else {
      setIsInstallGuideOpen(true);
    }
  };

  const fetchDashboard = useCallback(
    async (yr = selectedYear) => {
      try {
        const res = await fetch(`/api/dashboard?year=${yr}`);
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear, fetchDashboard]);

  // Handlers for CRUD operations
  const handleSaveMember = async (payload) => {
    const url = editingMember ? `/api/members/${editingMember._id}` : '/api/members';
    const method = editingMember ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = 'সদস্য সংরক্ষণে ত্রুটি হয়েছে';
      try {
        const err = await res.json();
        if (err?.error) msg = err.error;
      } catch {
        // Fallback for non-JSON server error responses
      }
      alert(msg);
      return;
    }
    setEditingMember(null);
    await fetchDashboard(selectedYear);
  };

  const handleAssignPhotoToMember = async (memberId, photoPayload) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photoPayload)
    });
    if (res.ok) {
      await fetchDashboard(selectedYear);
    }
  };

  const handleDeleteMember = async (member) => {
    const ok = window.confirm(
      `আপনি কি নিশ্চিত যে "${member.name}" (${member.memberCode})-কে তালিকা থেকে মুছে ফেলতে চান?`
    );
    if (!ok) return;
    await fetch(`/api/members/${member._id}`, { method: 'DELETE' });
    if (activeProfileMemberId === member._id) setActiveProfileMemberId(null);
    await fetchDashboard(selectedYear);
  };

  const handleSavePayment = async (payload) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = 'জমা সংরক্ষণে ত্রুটি হয়েছে';
      try {
        const err = await res.json();
        if (err?.error) msg = err.error;
      } catch {
        // Fallback for non-JSON server error responses
      }
      alert(msg);
      return;
    }
    setPaymentPrefill(null);
    await fetchDashboard(selectedYear);
  };

  const handleDeletePayment = async (paymentId) => {
    const ok = window.confirm('এই জমার রশিদটি মুছে ফেলতে চান?');
    if (!ok) return;
    await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
    await fetchDashboard(selectedYear);
  };

  const handleSaveExpense = async (payload) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = 'খরচ সংরক্ষণে ত্রুটি হয়েছে';
      try {
        const err = await res.json();
        if (err?.error) msg = err.error;
      } catch {
        // Fallback for non-JSON server error responses
      }
      alert(msg);
      return;
    }
    await fetchDashboard(selectedYear);
  };

  const handleDeleteExpense = async (expenseId) => {
    const ok = window.confirm('এই খরচের ভাউচারটি মুছে ফেলতে চান?');
    if (!ok) return;
    await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
    await fetchDashboard(selectedYear);
  };

  const handleSaveYearConfig = async (payload) => {
    const res = await fetch('/api/year-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setSelectedYear(payload.year);
      await fetchDashboard(payload.year);
    }
  };

  const handleDownloadFullPDF = async () => {
    if (!dashboardData) return;
    try {
      setIsDownloadingPDF(true);
      await downloadFullSocietyReportPDF(dashboardData);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadSingleMemberPDF = async (member) => {
    try {
      setDownloadingMemberId(member._id);
      const res = await fetch(`/api/members/${member._id}/profile`);
      if (res.ok) {
        const profileData = await res.json();
        await downloadMemberProfilePDF(
          profileData.member,
          profileData.payments,
          selectedYear
        );
      } else {
        const mPayments = (dashboardData?.payments || []).filter(
          (p) => String(p.memberId?._id || p.memberId) === String(member._id)
        );
        await downloadMemberProfilePDF(member, mPayments, selectedYear);
      }
    } finally {
      setDownloadingMemberId(null);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen golden-art-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center animate-pulse mb-3">
          <Wallet className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-300">গোল্ডেন সমিতি লোড হচ্ছে...</h2>
        <p className="text-xs text-slate-400 mt-1">
          মঙ্গোডিবি ডাটাবেস থেকে সদস্য ও তহবিলের হিসাব আনা হচ্ছে
        </p>
      </div>
    );
  }

  const members = dashboardData?.members || [];
  const payments = dashboardData?.payments || [];
  const expenses = dashboardData?.expenses || [];
  const summary = dashboardData?.summary || {};
  const availableYears = dashboardData?.availableYears || [2026, 2025, 2024];
  const yearlyComparison = dashboardData?.yearlyComparison || [];

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.memberCode?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.designation?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (memberFilter === 'due') return (m.totalDue || 0) > 0;
    if (memberFilter === 'paid') return (m.totalDue || 0) === 0;
    return true;
  });

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    const memberName = p.memberId?.name || '';
    const memberCode = p.memberId?.memberCode || '';
    const matchesSearch =
      !q ||
      memberName.toLowerCase().includes(q) ||
      memberCode.toLowerCase().includes(q) ||
      (p.receiptNo || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (
      collectionMonthFilter !== 'all' &&
      Number(p.month) !== Number(collectionMonthFilter)
    ) {
      return false;
    }
    if (
      collectionMethodFilter !== 'all' &&
      p.method !== collectionMethodFilter
    ) {
      return false;
    }
    return true;
  });

  const activeProfileMember = members.find(
    (m) => String(m._id) === String(activeProfileMemberId)
  );

  const periodTitle =
    selectedYear === 'all'
      ? 'সর্বমোট সব বছর'
      : `${toBanglaNumber(selectedYear)} অর্থবছর`;

  return (
    <div className={`min-h-screen golden-art-bg pb-32 sm:pb-16 font-scale-${fontSize}`}>
      {/* Mobile Install Banner */}
      {!isInstalled && showInstallBanner && (
        <InstallBanner
          onInstall={handleTriggerInstall}
          onDismiss={() => setShowInstallBanner(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-3 sm:pt-5">
        {/* Top Artistic Header */}
        <ArtisticHeader
          selectedYear={selectedYear}
          availableYears={availableYears}
          onSelectYear={(yr) => setSelectedYear(yr)}
          onOpenAddMember={() => {
            setEditingMember(null);
            setIsMemberModalOpen(true);
          }}
          onOpenAddPayment={() => {
            setPaymentPrefill(null);
            setIsPaymentModalOpen(true);
          }}
          onOpenAddExpense={() => setIsExpenseModalOpen(true)}
          onOpenYearConfig={() => setIsYearConfigOpen(true)}
          onDownloadPDF={handleDownloadFullPDF}
          isDownloadingPDF={isDownloadingPDF}
        />

        {/* Fund & Expense Summary Cards - ONLY ON HOME TAB */}
        {activeTab === 'home' && (
          <FundOverviewCards
            summary={summary}
            selectedYear={selectedYear}
            yearlyComparison={yearlyComparison}
            onSelectYear={(yr) => setSelectedYear(yr)}
          />
        )}

        {/* Navigation Tabs */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/90 border border-slate-800 p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>হোম ড্যাশবোর্ড</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('transactions');
                setTransactionSubTab('collections');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'transactions' || activeTab === 'collections' || activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>জমা-খরচ হিসাব ({toBanglaNumber(payments.length + expenses.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>সদস্য ও প্রোফাইল ({toBanglaNumber(members.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              <span>বিগত বছর ও ব্যাকআপ</span>
            </button>

            <button
              onClick={() => setActiveTab('apphub')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'apphub'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>APK ও ইমেজ</span>
            </button>
          </div>

          {activeTab === 'members' && (
            <div className="relative w-full sm:w-60">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="নাম, কোড (GS-01) বা মোবাইল খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* TAB 0: HOME OVERVIEW & DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Quick Action Hub */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentPrefill(null);
                  setIsPaymentModalOpen(true);
                }}
                className="rounded-2xl p-4 bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition text-left flex flex-col justify-between shadow-lg cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-xl p-2.5 bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <PlusCircle className="h-4 w-4 text-emerald-400/60" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">কিস্তি জমা নিন</h4>
                  <p className="text-[11px] text-slate-400">সদস্যের চাঁদা আদায় এন্ট্রি করুন</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="rounded-2xl p-4 bg-gradient-to-br from-orange-950/80 to-slate-900 border border-orange-500/40 hover:border-orange-400 transition text-left flex flex-col justify-between shadow-lg cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-xl p-2.5 bg-orange-500/20 text-orange-400 group-hover:scale-110 transition">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <PlusCircle className="h-4 w-4 text-orange-400/60" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">খরচ লিপিবদ্ধ</h4>
                  <p className="text-[11px] text-slate-400">ভাউচার ও সমবণ্টন হিসাব করুন</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setIsMemberModalOpen(true);
                }}
                className="rounded-2xl p-4 bg-gradient-to-br from-teal-950/80 to-slate-900 border border-teal-500/40 hover:border-teal-400 transition text-left flex flex-col justify-between shadow-lg cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-xl p-2.5 bg-teal-500/20 text-teal-400 group-hover:scale-110 transition">
                    <Users className="h-5 w-5" />
                  </div>
                  <PlusCircle className="h-4 w-4 text-teal-400/60" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">নতুন সদস্য যোগ</h4>
                  <p className="text-[11px] text-slate-400">সমিতিতে নতুন সদস্য অন্তর্ভুক্ত করুন</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDownloadFullPDF}
                disabled={isDownloadingPDF}
                className="rounded-2xl p-4 bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 transition text-left flex flex-col justify-between shadow-lg cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-xl p-2.5 bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition">
                    <Download className="h-5 w-5" />
                  </div>
                  <Download className="h-4 w-4 text-indigo-400/60" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">পূর্ণাঙ্গ PDF রিপোর্ট</h4>
                  <p className="text-[11px] text-slate-400">বাংলা অডিট ও রেজুলেশন ডাউনলোড</p>
                </div>
              </button>
            </div>

            {/* Quick Status and Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Collections */}
              <div className="rounded-3xl golden-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">সাম্প্রতিক কিস্তি আদায়</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('transactions');
                      setTransactionSubTab('collections');
                      window.scrollTo(0, 0);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    সব দেখুন ({toBanglaNumber(payments.length)}) →
                  </button>
                </div>
                {payments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">কোনো কালেকশন পাওয়া যায়নি</p>
                ) : (
                  <div className="space-y-2">
                    {payments.slice(0, 5).map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/30 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {p.memberId?.memberCode?.slice(-2) || 'GS'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block">{p.memberId?.name || 'সদস্য'}</span>
                            <span className="text-[10.5px] text-slate-400">{formatDateBn(p.date)} • {getMonthNameBn(p.month)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400 block">{formatBDT(p.amount)}</span>
                          <span className="text-[10px] text-slate-400">{p.method}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Expenses */}
              <div className="rounded-3xl golden-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">সাম্প্রতিক খরচসমূহ</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('transactions');
                      setTransactionSubTab('expenses');
                      window.scrollTo(0, 0);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    সব দেখুন ({toBanglaNumber(expenses.length)}) →
                  </button>
                </div>
                {expenses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">কোনো খরচের এন্ট্রি নেই</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.slice(0, 5).map((e) => (
                      <div
                        key={e._id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-orange-500/30 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                            ৳
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block">{e.title}</span>
                            <span className="text-[10.5px] text-slate-400">{formatDateBn(e.date)} • {e.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-orange-400 block">{formatBDT(e.amount)}</span>
                          <span className="text-[10px] text-slate-400">সমবণ্টন</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MEMBERS & PROFILES */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl golden-card px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  ফিল্টার ({periodTitle}):
                </span>
                <button
                  onClick={() => setMemberFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    memberFilter === 'all'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  সকল সদস্য ({toBanglaNumber(members.length)})
                </button>
                <button
                  onClick={() => setMemberFilter('due')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    memberFilter === 'due'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-900 text-rose-300 border border-slate-800'
                  }`}
                >
                  বকেয়া আছে ({toBanglaNumber(members.filter((m) => m.totalDue > 0).length)})
                </button>
                <button
                  onClick={() => setMemberFilter('paid')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    memberFilter === 'paid'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-emerald-300 border border-slate-800'
                  }`}
                >
                  সম্পূর্ণ পরিশোধিত ({toBanglaNumber(members.filter((m) => m.totalDue === 0).length)})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>কার্ড ভিউ</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span>টেবিল ভিউ</span>
                </button>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="rounded-3xl golden-card p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                  সমিতিতে এখনও কোনো সদস্য যুক্ত করা হয়নি
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-5">
                  আপনার কাস্টমার এখন একদম ফ্রেশভাবে তাদের সমিতির সদস্যদের নাম, মোবাইল ও মাসিক কিস্তির পরিমাণ দিয়ে প্রথম সদস্য যুক্ত করতে পারবেন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null);
                    setIsMemberModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>প্রথম সদস্য যুক্ত করুন</span>
                </button>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMembers.map((m) => {
                  const hasDue = (m.totalDue || 0) > 0;
                  return (
                    <div
                      key={m._id}
                      className="rounded-3xl golden-card p-4 sm:p-5 flex flex-col justify-between hover:border-amber-400/50 transition"
                    >
                      <div>
                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => setActiveProfileMemberId(m._id)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            {m.photoUrl ? (
                              <img
                                src={m.photoUrl}
                                alt={m.name}
                                className="h-12 w-12 shrink-0 rounded-2xl object-cover border border-amber-400/50"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/40 text-amber-300 font-bold text-sm group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                                {m.memberCode}
                              </div>
                            )}
                            <div>
                              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                                {m.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="text-amber-300/90 font-medium">
                                  {m.memberCode} • {m.designation || 'সদস্য'}
                                </span>
                                {m.phone && (
                                  <a
                                    href={`tel:${m.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 hover:text-emerald-300"
                                  >
                                    • <Phone className="h-3 w-3 text-emerald-400" />
                                    {m.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              hasDue
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {hasDue ? 'বকেয়া আছে' : 'পরিশোধিত'}
                          </span>
                        </div>

                        {/* Financial Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="rounded-xl bg-slate-900/90 border border-slate-800/90 p-2.5">
                            <div className="text-[10px] text-slate-400">
                              মাসিক / বার্ষিক ধার্য
                            </div>
                            <div className="text-xs font-bold text-slate-200 mt-0.5">
                              {formatBDT(m.monthlyAmountDisplay)} /মাস
                            </div>
                            <div className="text-[10px] text-amber-300 font-semibold">
                              বার্ষিক: {formatBDT(m.yearlyTargetDisplay)}
                            </div>
                          </div>

                          <div className="rounded-xl bg-emerald-950/25 border border-emerald-500/25 p-2.5">
                            <div className="text-[10px] text-emerald-300">মোট কালেকশন</div>
                            <div className="text-sm font-bold text-emerald-400 mt-0.5">
                              {formatBDT(m.totalPaid)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              আদায়: {toBanglaNumber(m.completionPercent)}%
                            </div>
                          </div>

                          <div
                            className={`rounded-xl p-2.5 border ${
                              hasDue
                                ? 'bg-rose-950/25 border-rose-500/25'
                                : 'bg-slate-900/90 border-slate-800'
                            }`}
                          >
                            <div className="text-[10px] text-rose-300">বকেয়া টাকা</div>
                            <div
                              className={`text-sm font-bold mt-0.5 ${
                                hasDue ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {formatBDT(m.totalDue)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {hasDue ? 'পরিশোধযোগ্য' : 'কোনো বকেয়া নেই'}
                            </div>
                          </div>
                        </div>

                        {/* Shared Expense & Net Fund Share Strip */}
                        <div className="mt-2.5 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400">সমিতির খরচে অংশ: </span>
                            <span className="font-bold text-orange-400">
                              {formatBDT(m.expenseShare)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">ফান্ডে নিট অংশ: </span>
                            <span className="font-bold text-amber-300">
                              {formatBDT(m.netFundStanding)}
                            </span>
                          </div>
                        </div>

                        {/* 12-Month Visual Mini Grid */}
                        {selectedYear !== 'all' &&
                          Array.isArray(m.monthsBreakdown) &&
                          m.monthsBreakdown.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span>
                                  {toBanglaNumber(selectedYear)} সালের ১২ মাসের কিস্তি চিত্র (ক্লিক করে জমা নিন):
                                </span>
                              </div>
                              <div className="grid grid-cols-6 gap-1">
                                {m.monthsBreakdown.map((mb) => {
                                  const isPaid = mb.status === 'paid';
                                  const isPartial = mb.status === 'partial';
                                  return (
                                    <button
                                      key={mb.month}
                                      onClick={() => {
                                        if (!isPaid) {
                                          setPaymentPrefill({
                                            memberId: m._id,
                                            year: selectedYear,
                                            month: mb.month,
                                            amount: mb.due || m.monthlyAmountDisplay
                                          });
                                          setIsPaymentModalOpen(true);
                                        } else {
                                          setActiveProfileMemberId(m._id);
                                        }
                                      }}
                                      className={`rounded-lg py-1 text-[10px] font-semibold border transition cursor-pointer ${
                                        isPaid
                                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                          : isPartial
                                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-rose-500/40 hover:text-rose-300'
                                      }`}
                                      title={`${mb.monthName}: জমা ${formatBDT(mb.paid)} | বকেয়া ${formatBDT(mb.due)}`}
                                    >
                                      {mb.shortName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => setActiveProfileMemberId(m._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 py-2 px-2.5 text-xs font-bold text-amber-300 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>প্রোফাইল ও সব বছর</span>
                        </button>

                        <button
                          onClick={() => {
                            const firstUnpaid = m.monthsBreakdown?.find(
                              (mb) => mb.status !== 'paid'
                            );
                            setPaymentPrefill({
                              memberId: m._id,
                              year:
                                selectedYear === 'all'
                                  ? new Date().getFullYear()
                                  : selectedYear,
                              month: firstUnpaid ? firstUnpaid.month : new Date().getMonth() + 1,
                              amount: m.monthlyAmountDisplay
                            });
                            setIsPaymentModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2 px-3 text-xs font-bold text-slate-950 cursor-pointer"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>জমা নিন</span>
                        </button>

                        <button
                          onClick={() => handleDownloadSingleMemberPDF(m)}
                          disabled={downloadingMemberId === m._id}
                          className="inline-flex items-center justify-center rounded-xl bg-indigo-600/80 hover:bg-indigo-500 p-2 text-white cursor-pointer"
                          title="সদস্যের পিডিএফ ডাউনলোড"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setIsMemberModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 cursor-pointer"
                          title="তথ্য ও কিস্তি এডিট"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMember(m)}
                          className="inline-flex items-center justify-center rounded-xl bg-rose-500/15 hover:bg-rose-500/30 p-2 text-rose-400 cursor-pointer"
                          title="সদস্য মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View of All Members */
              <div className="overflow-x-auto rounded-3xl golden-card">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900/95 text-amber-300 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">কোড ও নাম</th>
                      <th className="py-3.5 px-3 text-right">মাসিক হার</th>
                      <th className="py-3.5 px-3 text-right">বার্ষিক ধার্য</th>
                      <th className="py-3.5 px-3 text-right">মোট কালেকশন</th>
                      <th className="py-3.5 px-3 text-right">বকেয়া</th>
                      <th className="py-3.5 px-3 text-right">খরচের অংশ</th>
                      <th className="py-3.5 px-3 text-right">নিট ফান্ড শেয়ার</th>
                      <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredMembers.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-800/40">
                        <td
                          onClick={() => setActiveProfileMemberId(m._id)}
                          className="py-3 px-4 cursor-pointer"
                        >
                          <div className="font-bold text-white hover:text-amber-300">
                            {m.memberCode} — {m.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {m.designation} • {m.phone}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {formatBDT(m.monthlyAmountDisplay)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200 font-medium">
                          {formatBDT(m.yearlyTargetDisplay)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {formatBDT(m.totalPaid)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold ${
                            m.totalDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatBDT(m.totalDue)}
                        </td>
                        <td className="py-3 px-3 text-right text-orange-400 font-semibold">
                          {formatBDT(m.expenseShare)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-300">
                          {formatBDT(m.netFundStanding)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setActiveProfileMemberId(m._id)}
                              className="rounded-lg bg-amber-400/15 hover:bg-amber-400/30 px-2.5 py-1 text-xs font-semibold text-amber-300 cursor-pointer"
                            >
                              প্রোফাইল
                            </button>
                            <button
                              onClick={() => {
                                setPaymentPrefill({
                                  memberId: m._id,
                                  year:
                                    selectedYear === 'all'
                                      ? new Date().getFullYear()
                                      : selectedYear,
                                  month: new Date().getMonth() + 1,
                                  amount: m.monthlyAmountDisplay
                                });
                                setIsPaymentModalOpen(true);
                              }}
                              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950 cursor-pointer"
                            >
                              জমা
                            </button>
                            <button
                              onClick={() => handleDownloadSingleMemberPDF(m)}
                              className="rounded-lg bg-indigo-600/80 p-1.5 text-white cursor-pointer"
                              title="পিডিএফ"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRANSACTIONS (জমা-খরচ পূর্ণাঙ্গ খতিয়ান) */}
        {(activeTab === 'transactions' || activeTab === 'collections' || activeTab === 'expenses') && (
          <div className="space-y-4">
            {/* Top Compact Cashbook Overview Banner */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 rounded-3xl golden-card p-3 sm:p-5">
              <div className="rounded-2xl bg-slate-950/80 border border-emerald-500/30 p-2.5 sm:p-4 text-center sm:text-left">
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">মোট কিস্তি আদায় (জমা)</span>
                <span className="text-sm sm:text-2xl font-bold text-emerald-400 mt-0.5 sm:mt-1 block">
                  {formatBDT(summary.periodCollected)}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                  {toBanglaNumber(payments.length)} টি লেনদেন
                </span>
              </div>

              <div className="rounded-2xl bg-slate-950/80 border border-orange-500/30 p-2.5 sm:p-4 text-center sm:text-left">
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">সমিতির মোট ব্যয় (খরচ)</span>
                <span className="text-sm sm:text-2xl font-bold text-orange-400 mt-0.5 sm:mt-1 block">
                  {formatBDT(summary.periodExpense)}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                  {toBanglaNumber(expenses.length)} টি ভাউচার
                </span>
              </div>

              <div className="rounded-2xl bg-slate-950/80 border border-amber-500/30 p-2.5 sm:p-4 text-center sm:text-left">
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">অবশিষ্ট ফান্ড স্থিতি</span>
                <span className="text-sm sm:text-2xl font-bold text-amber-300 mt-0.5 sm:mt-1 block">
                  {formatBDT(summary.periodNetBalance)}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                  {periodTitle}
                </span>
              </div>
            </div>

            {/* Sub-tab Switcher Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 p-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTransactionSubTab('collections')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    transactionSubTab === 'collections'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  <span>জমার খতিয়ান ({toBanglaNumber(payments.length)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionSubTab('expenses')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    transactionSubTab === 'expenses'
                      ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                  <span>খরচ ও সমবণ্টন ({toBanglaNumber(expenses.length)})</span>
                </button>
              </div>

              {transactionSubTab === 'collections' ? (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentPrefill(null);
                    setIsPaymentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>নতুন জমা যোগ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>নতুন খরচ যোগ</span>
                </button>
              )}
            </div>

            {/* Sub-view: Collections Register */}
            {transactionSubTab === 'collections' && (
              <div className="rounded-3xl golden-card p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-emerald-400">
                      দৈনন্দিন ও মাসিক কিস্তি আদায় খতিয়ান ({periodTitle})
                    </h2>
                    <p className="text-xs text-slate-400">
                    মোট আদায়কৃত লেনদেন: {toBanglaNumber(filteredPayments.length)} টি • মোট কালেকশন:{' '}
                    <span className="text-emerald-300 font-bold">
                      {formatBDT(
                        filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
                      )}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={collectionMonthFilter}
                    onChange={(e) => setCollectionMonthFilter(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="all">সকল মাস</option>
                    {BENGALI_MONTHS.map((bm) => (
                      <option key={bm.num} value={bm.num}>
                        {bm.name}
                      </option>
                    ))}
                    <option value="0">এককালীন / বিশেষ</option>
                  </select>

                  <select
                    value={collectionMethodFilter}
                    onChange={(e) => setCollectionMethodFilter(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="all">সকল মাধ্যম</option>
                    <option value="নগদ (Cash)">নগদ (Cash)</option>
                    <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                    <option value="নগদ অ্যাপ (Nagad)">নগদ অ্যাপ (Nagad)</option>
                    <option value="ব্যাংক (Bank)">ব্যাংক (Bank)</option>
                  </select>

                  <button
                    onClick={() => {
                      setPaymentPrefill(null);
                      setIsPaymentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>নতুন জমা যোগ করুন</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5">রশিদ ও তারিখ</th>
                      <th className="py-3 px-3.5">সদস্যের নাম</th>
                      <th className="py-3 px-3.5">সাল ও মাস</th>
                      <th className="py-3 px-3.5">ধরন ও মাধ্যম</th>
                      <th className="py-3 px-3.5 text-right">জমার পরিমাণ</th>
                      <th className="py-3 px-3.5 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-slate-200">
                            {formatDateBn(p.date)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.receiptNo || 'রশিদ'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-white">
                            {p.memberId?.name || 'সদস্য'}
                          </div>
                          <div className="text-[10px] text-amber-300">
                            {p.memberId?.memberCode}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs font-semibold text-amber-300">
                            {getMonthNameBn(p.month)}, {toBanglaNumber(p.year)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-300">
                          <div>{p.paymentType}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.method} {p.note ? `• ${p.note}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-emerald-400">
                          {formatBDT(p.amount)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => handleDeletePayment(p._id)}
                            className="rounded-lg bg-rose-500/15 hover:bg-rose-500/30 p-1.5 text-rose-400 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Expenses Register & Shared Calculation */}
          {transactionSubTab === 'expenses' && (
          <div className="space-y-5">
            <div className="rounded-3xl golden-card p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    <span>খরচের হিসাব ও সকল সদস্যের মাঝে সমবণ্টন ক্যালকুলেশন ({periodTitle})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ফান্ডে কত টাকা ছিল, কত টাকা খরচ হয়েছে, সবার ভিতরে ক্যালকুলেট করার পর কার ভাগে কত খরচ পড়েছে এবং ফান্ডে কত টাকা অবশিষ্ট আছে
                  </p>
                </div>

                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>নতুন খরচ যোগ করুন</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-3.5">
                  <div className="text-xs text-slate-400">ফান্ডে মোট জমা ছিল</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {formatBDT(summary.periodCollected)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 border border-orange-500/30 p-3.5">
                  <div className="text-xs text-slate-400">ফান্ড থেকে মোট খরচ হয়েছে</div>
                  <div className="text-xl font-bold text-orange-400 mt-1">
                    {formatBDT(summary.periodExpense)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 border border-amber-500/30 p-3.5">
                  <div className="text-xs text-slate-400">
                    মাথাপিছু খরচের অংশ ({toBanglaNumber(summary.activeMembers)} জন)
                  </div>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {formatBDT(summary.perMemberEqualExpense)}
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400 p-3.5">
                  <div className="text-xs text-amber-200">খরচ বাদে ফান্ডে আছে</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {formatBDT(summary.periodNetBalance)}
                  </div>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-white mb-2.5">
                খরচের ভাউচার তালিকা ({toBanglaNumber(expenses.length)} টি)
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 mb-6">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5">তারিখ ও ভাউচার</th>
                      <th className="py-3 px-3.5">খরচের বিবরণ</th>
                      <th className="py-3 px-3.5">ক্যাটাগরি ও মারফত</th>
                      <th className="py-3 px-3.5 text-right">মোট খরচ</th>
                      <th className="py-3 px-3.5 text-right">মাথাপিছু অংশ</th>
                      <th className="py-3 px-3.5 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {expenses.map((exp) => {
                      const splitCount =
                        exp.splitType === 'selected' && exp.participants?.length > 0
                          ? exp.participants.length
                          : Math.max(1, summary.activeMembers || members.length);
                      const perPerson = Math.round((exp.amount / splitCount) * 100) / 100;
                      return (
                        <tr key={exp._id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3.5">
                            <div className="font-semibold text-slate-200">
                              {formatDateBn(exp.date)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {exp.voucherNo || 'ভাউচার'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2">
                              {exp.voucherImage && (
                                <a
                                  href={exp.voucherImage}
                                  download={`${exp.voucherNo || 'voucher'}.webp`}
                                  title="অপটিমাইজড রশিদ ডাউনলোড"
                                >
                                  <img
                                    src={exp.voucherImage}
                                    alt="Voucher"
                                    className="h-8 w-8 rounded-lg object-cover border border-amber-400/50"
                                  />
                                </a>
                              )}
                              <div>
                                <div className="font-bold text-white">{exp.title}</div>
                                {exp.note && (
                                  <div className="text-[11px] text-slate-400">{exp.note}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-300">
                            <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs text-amber-300">
                              {exp.category}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              মারফত: {exp.spentBy || 'কমিটি'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-bold text-orange-400">
                            {formatBDT(exp.amount)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-amber-300 font-semibold">
                            {formatBDT(perPerson)}{' '}
                            <span className="text-[10px] text-slate-400">
                              ({toBanglaNumber(splitCount)} জন)
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              onClick={() => handleDeleteExpense(exp._id)}
                              className="rounded-lg bg-rose-500/15 hover:bg-rose-500/30 p-1.5 text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-amber-300 mb-2.5">
                খরচ বাদে প্রত্যেক সদস্যের ফান্ডে নিট হিসাব তফসিল ({periodTitle})
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3.5">সদস্যের নাম</th>
                      <th className="py-2.5 px-3.5 text-right">মোট জমা দিয়েছেন</th>
                      <th className="py-2.5 px-3.5 text-right">বাদ: খরচের অংশ</th>
                      <th className="py-2.5 px-3.5 text-right">ফান্ডে নিট স্থিতি</th>
                      <th className="py-2.5 px-3.5 text-right">কিস্তি বকেয়া</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {members.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3.5 font-bold text-white">
                          {m.memberCode} — {m.name}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-400">
                          {formatBDT(m.totalPaid)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-orange-400">
                          - {formatBDT(m.expenseShare)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-amber-300">
                          {formatBDT(m.netFundStanding)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-rose-400">
                          {formatBDT(m.totalDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {/* TAB 4: MULTI-YEAR ARCHIVE & BACKUP */}
        {activeTab === 'history' && (
          <BackupAndHistoryView
            yearlyComparison={yearlyComparison}
            members={members}
            availableYears={availableYears}
            onSelectYear={(yr) => {
              setSelectedYear(yr);
              setActiveTab('members');
            }}
            onOpenMemberProfile={(m) => setActiveProfileMemberId(m._id)}
            onDataRestored={() => fetchDashboard(selectedYear)}
          />
        )}

        {/* TAB 5: APK APP DOWNLOAD & IMAGE OPTIMIZER STUDIO */}
        {activeTab === 'apphub' && (
          <ImageAndAppHub
            members={members}
            deferredPrompt={deferredPrompt}
            onClearDeferredPrompt={() => setDeferredPrompt(null)}
            onAssignPhotoToMember={handleAssignPhotoToMember}
          />
        )}
      </div>

      {/* Floating Bottom-Right App / APK & Image Optimizer Pill */}
      {/* Floating Bottom-Right App / APK & Image Optimizer Pill (Desktop/Tablet only, to keep mobile nav clean) */}
      {activeTab !== 'apphub' && (
        <button
          onClick={() => setIsAppHubModalOpen(true)}
          className="hidden sm:inline-flex fixed bottom-5 right-4 z-40 items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Smartphone className="h-4 w-4" />
          <span>APK অ্যাপ ও ইমেজ অপটিমাইজ</span>
        </button>
      )}

      {/* Mobile Bottom Navigation Bar (Elevated Safe-Area, Instant Tap, 4 Spacious Tabs) */}
      <nav 
        role="navigation"
        aria-label="মোবাইল নেভিগেশন"
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-amber-500/30 px-2 mobile-bottom-nav grid grid-cols-4 gap-2 select-none pointer-events-auto shadow-2xl"
      >
        {/* 1. Home (হোম) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('home');
            window.scrollTo(0, 0);
          }}
          className={`mobile-nav-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition active:scale-95 cursor-pointer ${
            activeTab === 'home'
              ? 'text-amber-300 bg-amber-500/25 border border-amber-400/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 active:bg-slate-900/60'
          }`}
        >
          <Home className="h-5 w-5 mb-1 shrink-0" />
          <span className="leading-tight">হোম</span>
        </button>

        {/* 2. Transactions (জমা-খরচ) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('transactions');
            window.scrollTo(0, 0);
          }}
          className={`mobile-nav-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition active:scale-95 cursor-pointer ${
            activeTab === 'transactions' || activeTab === 'collections' || activeTab === 'expenses'
              ? 'text-emerald-300 bg-emerald-500/25 border border-emerald-400/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 active:bg-slate-900/60'
          }`}
        >
          <Wallet className="h-5 w-5 mb-1 shrink-0" />
          <span className="leading-tight">জমা-খরচ</span>
        </button>

        {/* 3. Members (সদস্য) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('members');
            window.scrollTo(0, 0);
          }}
          className={`mobile-nav-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition active:scale-95 cursor-pointer ${
            activeTab === 'members'
              ? 'text-teal-300 bg-teal-500/25 border border-teal-400/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 active:bg-slate-900/60'
          }`}
        >
          <Users className="h-5 w-5 mb-1 shrink-0" />
          <span className="leading-tight">সদস্য</span>
        </button>

        {/* 4. Settings (সেটিংস) */}
        <button
          type="button"
          onClick={() => {
            setIsYearConfigOpen(true);
          }}
          className={`mobile-nav-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition active:scale-95 cursor-pointer ${
            isYearConfigOpen
              ? 'text-amber-300 bg-amber-500/25 border border-amber-400/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 active:bg-slate-900/60'
          }`}
        >
          <Settings className="h-5 w-5 mb-1 shrink-0" />
          <span className="leading-tight">সেটিংস</span>
        </button>
      </nav>

      {/* Modals */}
      {isAppHubModalOpen && (
        <ImageAndAppHub
          members={members}
          deferredPrompt={deferredPrompt}
          onClearDeferredPrompt={() => setDeferredPrompt(null)}
          onAssignPhotoToMember={handleAssignPhotoToMember}
          isModal={true}
          onCloseModal={() => setIsAppHubModalOpen(false)}
        />
      )}

      <MemberProfileModal
        member={activeProfileMember}
        allPayments={payments}
        availableYears={availableYears}
        initialYear={selectedYear}
        onClose={() => setActiveProfileMemberId(null)}
        onQuickPayMonth={(prefill) => {
          setPaymentPrefill(prefill);
          setIsPaymentModalOpen(true);
        }}
        onEditMember={(m) => {
          setEditingMember(m);
          setIsMemberModalOpen(true);
        }}
        onDeletePayment={handleDeletePayment}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        editingMember={editingMember}
        selectedYear={selectedYear}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        members={members}
        selectedYear={selectedYear}
        prefillData={paymentPrefill}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentPrefill(null);
        }}
        onSave={handleSavePayment}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        members={members}
        selectedYear={selectedYear}
        currentFundBalance={summary.periodNetBalance || 0}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />

      <YearConfigModal
        isOpen={isYearConfigOpen}
        selectedYear={selectedYear}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenAppHub={() => setIsAppHubModalOpen(true)}
        onOpenBackup={() => {
          setActiveTab('history');
          window.scrollTo(0, 0);
        }}
        onClose={() => setIsYearConfigOpen(false)}
        onSave={handleSaveYearConfig}
      />

      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
      />
    </div>
  );
}
