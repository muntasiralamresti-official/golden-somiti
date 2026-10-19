import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import YearConfig from '../models/YearConfig.js';
import { writeAutoBackupSnapshot } from './backupManager.js';

export async function ensureInitialData() {
  const existingCount = await Member.countDocuments();
  if (existingCount > 0) {
    await Member.updateMany(
      { note: /সোসাইটি/ },
      { $set: { note: 'গোল্ডেন সমিতির নিয়মিত সদস্য' } }
    );
    await Expense.updateMany(
      { note: 'গোল্ডেন সোসাইটি বার্ষিক ইফতার' },
      { $set: { note: 'গোল্ডেন সমিতি বার্ষিক ইফতার' } }
    );
    await YearConfig.updateMany(
      { societyTitle: /সোসাইটি/ },
      { $set: { societyTitle: 'গোল্ডেন সমিতি (Golden Somiti)' } }
    );
    return;
  }

  console.log('Initializing Golden Somiti database with 16 members & multi-year (2024-2026) ledger...');

  const yearConfigsData = [
    {
      year: 2024,
      defaultMonthlyAmount: 1000,
      defaultYearlyTarget: 12000,
      societyTitle: 'গোল্ডেন সমিতি (Golden Somiti)',
      note: '২০২৪ অর্থবছরের বার্ষিক হিসাব (মাসিক ১,০০০ টাকা)'
    },
    {
      year: 2025,
      defaultMonthlyAmount: 1200,
      defaultYearlyTarget: 14400,
      societyTitle: 'গোল্ডেন সমিতি (Golden Somiti)',
      note: '২০২৫ অর্থবছরের বার্ষিক হিসাব (মাসিক ১,২০০ টাকা)'
    },
    {
      year: 2026,
      defaultMonthlyAmount: 1500,
      defaultYearlyTarget: 18000,
      societyTitle: 'গোল্ডেন সমিতি (Golden Somiti)',
      note: '২০২৬ অর্থবছরের বার্ষিক হিসাব (মাসিক ১,৫০০ টাকা)'
    }
  ];

  await YearConfig.insertMany(yearConfigsData);

  const rawMembers = [
    { code: 'GS-01', name: 'মোঃ তানভীর আহমেদ', phone: '01711-234501', designation: 'সভাপতি', joinDate: '2024-01-01' },
    { code: 'GS-02', name: 'মোঃ রফিকুল ইসলাম', phone: '01711-234502', designation: 'সহ-সভাপতি', joinDate: '2024-01-01' },
    { code: 'GS-03', name: 'কাজী আরিফুল হক', phone: '01819-334503', designation: 'সাধারণ সম্পাদক', joinDate: '2024-01-01' },
    { code: 'GS-04', name: 'মোঃ নাজমুল হাসান', phone: '01912-445504', designation: 'কোষাধ্যক্ষ', joinDate: '2024-01-01' },
    { code: 'GS-05', name: 'মোঃ জাহিদুল ইসলাম', phone: '01615-556605', designation: 'সাংগঠনিক সম্পাদক', joinDate: '2024-01-05' },
    { code: 'GS-06', name: 'সৈয়দ মাহবুব আলম', phone: '01712-667706', designation: 'কার্যনির্বাহী সদস্য', joinDate: '2024-01-05' },
    { code: 'GS-07', name: 'মোঃ কামরুল হাসান', phone: '01814-778807', designation: 'সদস্য', joinDate: '2024-01-07' },
    { code: 'GS-08', name: 'আব্দুল্লাহ আল মামুন', phone: '01914-889908', designation: 'সদস্য', joinDate: '2024-01-10' },
    { code: 'GS-09', name: 'মোঃ সাইফুল ইসলাম', phone: '01715-990009', designation: 'সদস্য', joinDate: '2024-01-10' },
    { code: 'GS-10', name: 'মোঃ শাখাওয়াত হোসেন', phone: '01618-112210', designation: 'সদস্য', joinDate: '2024-01-12' },
    { code: 'GS-11', name: 'মোঃ আশরাফুল আলম', phone: '01716-223311', designation: 'সদস্য', joinDate: '2024-01-12' },
    { code: 'GS-12', name: 'মোঃ মেহেদী হাসান', phone: '01817-334412', designation: 'সদস্য', joinDate: '2024-01-15' },
    { code: 'GS-13', name: 'মোঃ তারেক রহমান', phone: '01918-445513', designation: 'সদস্য', joinDate: '2024-01-15' },
    { code: 'GS-14', name: 'মোঃ সোহেল রানা', phone: '01719-556614', designation: 'সদস্য', joinDate: '2024-01-18' },
    { code: 'GS-15', name: 'মোঃ ফয়সাল মাহমুদ', phone: '01812-667715', designation: 'সদস্য', joinDate: '2024-01-20' },
    { code: 'GS-16', name: 'মোঃ ইমরান হোসেন', phone: '01611-778816', designation: 'সদস্য', joinDate: '2024-01-20' }
  ];

  const memberDocs = await Member.insertMany(
    rawMembers.map((rm) => ({
      memberCode: rm.code,
      name: rm.name,
      phone: rm.phone,
      designation: rm.designation,
      joinYear: 2024,
      joinDate: rm.joinDate,
      monthlyAmount: 1500,
      yearlyTarget: 18000,
      yearlyPlans: {
        '2024': { monthlyAmount: 1000, yearlyTarget: 12000, note: '২০২৪ সালের নির্ধারিত হার' },
        '2025': { monthlyAmount: 1200, yearlyTarget: 14400, note: '২০২৫ সালের নির্ধারিত হার' },
        '2026': { monthlyAmount: 1500, yearlyTarget: 18000, note: '২০২৬ সালের নির্ধারিত হার' }
      },
      active: true,
      note: 'গোল্ডেন সমিতির নিয়মিত সদস্য'
    }))
  );

  const paymentsToInsert = [];
  let rcpCounter = 1001;
  const methods = ['নগদ (Cash)', 'বিকাশ (bKash)', 'নগদ অ্যাপ (Nagad)', 'ব্যাংক (Bank)'];

  // 2024 Payments (2 years ago): most members paid 11-12 months (1000/month)
  memberDocs.forEach((m, idx) => {
    const monthsPaid2024 = idx % 5 === 4 ? 10 : idx % 3 === 2 ? 11 : 12;
    for (let month = 1; month <= monthsPaid2024; month++) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(5 + (idx % 10)).padStart(2, '0');
      paymentsToInsert.push({
        memberId: m._id,
        year: 2024,
        month,
        amount: 1000,
        date: `2024-${mStr}-${dStr}`,
        paymentType: 'মাসিক কিস্তি',
        method: methods[(idx + month) % methods.length],
        receiptNo: `RCP-24-${rcpCounter++}`,
        note: `২০২৪ সালের মাসিক জমা`
      });
    }
  });

  // 2025 Payments (1 year ago): members paid 10-12 months (1200/month)
  memberDocs.forEach((m, idx) => {
    const monthsPaid2025 = idx % 4 === 3 ? 10 : idx % 3 === 1 ? 11 : 12;
    for (let month = 1; month <= monthsPaid2025; month++) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(4 + (idx % 12)).padStart(2, '0');
      paymentsToInsert.push({
        memberId: m._id,
        year: 2025,
        month,
        amount: 1200,
        date: `2025-${mStr}-${dStr}`,
        paymentType: 'মাসিক কিস্তি',
        method: methods[(idx + month) % methods.length],
        receiptNo: `RCP-25-${rcpCounter++}`,
        note: `২০২৫ সালের মাসিক জমা`
      });
    }
  });

  // 2026 Payments (Current year up to October): members paid between 7 and 10 months (1500/month)
  memberDocs.forEach((m, idx) => {
    const monthsPaid2026 = 10 - (idx % 4); // 7, 8, 9, or 10 months paid
    for (let month = 1; month <= monthsPaid2026; month++) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(3 + (idx % 14)).padStart(2, '0');
      paymentsToInsert.push({
        memberId: m._id,
        year: 2026,
        month,
        amount: 1500,
        date: `2026-${mStr}-${dStr}`,
        paymentType: 'মাসিক কিস্তি',
        method: methods[(idx + month) % methods.length],
        receiptNo: `RCP-26-${rcpCounter++}`,
        note: `২০২৬ সালের মাসিক কিস্তি জমা`
      });
    }
  });

  await Payment.insertMany(paymentsToInsert);

  const expensesToInsert = [
    // 2024 Expenses
    {
      title: 'সমিতি উদ্বোধন ও রেজিস্ট্রেশন খাতা ক্রয়',
      category: 'স্টেশনারি ও অফিস',
      amount: 3200,
      year: 2024,
      date: '2024-01-25',
      splitType: 'all_active',
      spentBy: 'কাজী আরিফুল হক',
      voucherNo: 'VCH-24-001',
      note: 'লেজার বই, রশিদ বই ও কলম ক্রয়'
    },
    {
      title: 'বার্ষিক ইফতার ও দোয়া মাহফিল ২০২৪',
      category: 'ইভেন্ট ও অনুষ্ঠান',
      amount: 12800,
      year: 2024,
      date: '2024-03-28',
      splitType: 'all_active',
      spentBy: 'মোঃ নাজমুল হাসান',
      voucherNo: 'VCH-24-002',
      note: 'সকল সদস্যদের নিয়ে ইফতার আয়োজন'
    },
    {
      title: 'বার্ষিক সাধারণ সভা ও নৈশভোজ ২০২৪',
      category: 'ইভেন্ট ও অনুষ্ঠান',
      amount: 16000,
      year: 2024,
      date: '2024-12-20',
      splitType: 'all_active',
      spentBy: 'মোঃ তানভীর আহমেদ',
      voucherNo: 'VCH-24-003',
      note: 'বার্ষিক হিসাব সমাপনী ও মিলনমেলা'
    },
    // 2025 Expenses
    {
      title: 'রমজান ইফতার মাহফিল ও আলোচনা সভা ২০২৫',
      category: 'ইভেন্ট ও অনুষ্ঠান',
      amount: 14400,
      year: 2025,
      date: '2025-03-18',
      splitType: 'all_active',
      spentBy: 'মোঃ নাজমুল হাসান',
      voucherNo: 'VCH-25-001',
      note: '১৬ জন সদস্যের ইফতার ও আপ্যায়ন খরচ'
    },
    {
      title: 'অসুস্থ সদস্যের চিকিৎসা সহায়তা অনুদান',
      category: 'সদস্য সহায়তা/কল্যাণ',
      amount: 8000,
      year: 2025,
      date: '2025-07-14',
      splitType: 'all_active',
      spentBy: 'মোঃ রফিকুল ইসলাম',
      voucherNo: 'VCH-25-002',
      note: 'সমিতির কল্যাণ তহবিল হতে এককালীন সহায়তা'
    },
    {
      title: 'বার্ষিক আনন্দ ভ্রমণ ও পিকনিক ২০২৫',
      category: 'ইভেন্ট ও অনুষ্ঠান',
      amount: 22400,
      year: 2025,
      date: '2025-12-12',
      splitType: 'all_active',
      spentBy: 'কাজী আরিফুল হক',
      voucherNo: 'VCH-25-003',
      note: 'গাজীপুর রিসোর্ট ডে-লং ট্যুর'
    },
    // 2026 Expenses
    {
      title: 'নতুন বছরের ডায়েরি ও ফাইল ফোল্ডার ছাপানো',
      category: 'স্টেশনারি ও অফিস',
      amount: 4000,
      year: 2026,
      date: '2026-01-15',
      splitType: 'all_active',
      spentBy: 'কাজী আরিফুল হক',
      voucherNo: 'VCH-26-001',
      note: '২০২৬ সালের সদস্যদের ডায়েরি ও হিসাব ফাইল'
    },
    {
      title: 'ইফতার ও প্রীতিভোজ আয়োজন ২০২৬',
      category: 'ইভেন্ট ও অনুষ্ঠান',
      amount: 16000,
      year: 2026,
      date: '2026-03-10',
      splitType: 'all_active',
      spentBy: 'মোঃ নাজমুল হাসান',
      voucherNo: 'VCH-26-002',
      note: 'গোল্ডেন সমিতি বার্ষিক ইফতার'
    },
    {
      title: 'ষান্মাসিক মিটিং ও আপ্যায়ন খরচ',
      category: 'আপ্যায়ন',
      amount: 4800,
      year: 2026,
      date: '2026-08-22',
      splitType: 'all_active',
      spentBy: 'মোঃ জাহিদুল ইসলাম',
      voucherNo: 'VCH-26-003',
      note: 'মাসিক/ষান্মাসিক সমন্বয় সভার নাস্তা ও চা'
    }
  ];

  await Expense.insertMany(expensesToInsert);
  await writeAutoBackupSnapshot('Initial Seed Data');
  console.log('Golden Somiti database initialized and backed up!');
}
