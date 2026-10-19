export const BENGALI_MONTHS = [
  { num: 1, name: 'জানুয়ারি', short: 'জানু' },
  { num: 2, name: 'ফেব্রুয়ারি', short: 'ফেব্রু' },
  { num: 3, name: 'মার্চ', short: 'মার্চ' },
  { num: 4, name: 'এপ্রিল', short: 'এপ্রিল' },
  { num: 5, name: 'মে', short: 'মে' },
  { num: 6, name: 'জুন', short: 'জুন' },
  { num: 7, name: 'জুলাই', short: 'জুলাই' },
  { num: 8, name: 'আগস্ট', short: 'আগস্ট' },
  { num: 9, name: 'সেপ্টেম্বর', short: 'সেপ্টে' },
  { num: 10, name: 'অক্টোবর', short: 'অক্টো' },
  { num: 11, name: 'নভেম্বর', short: 'নভে' },
  { num: 12, name: 'ডিসেম্বর', short: 'ডিসে' }
];

export function getMemberYearPlan(member, year, yearConfig) {
  const yearKey = String(year);
  let plansObj = {};
  if (member.yearlyPlans) {
    if (typeof member.yearlyPlans.get === 'function') {
      const plan = member.yearlyPlans.get(yearKey);
      if (plan) {
        return {
          monthlyAmount: Number(plan.monthlyAmount ?? member.monthlyAmount ?? 1000),
          yearlyTarget: Number(plan.yearlyTarget ?? (plan.monthlyAmount ?? member.monthlyAmount ?? 1000) * 12),
          note: plan.note || ''
        };
      }
    } else if (member.yearlyPlans[yearKey]) {
      const plan = member.yearlyPlans[yearKey];
      return {
        monthlyAmount: Number(plan.monthlyAmount ?? member.monthlyAmount ?? 1000),
        yearlyTarget: Number(plan.yearlyTarget ?? (plan.monthlyAmount ?? member.monthlyAmount ?? 1000) * 12),
        note: plan.note || ''
      };
    }
  }

  const monthlyAmount = Number(
    member.monthlyAmount ?? yearConfig?.defaultMonthlyAmount ?? 1000
  );
  const yearlyTarget = Number(
    member.yearlyTarget ?? monthlyAmount * 12
  );

  return {
    monthlyAmount,
    yearlyTarget,
    note: ''
  };
}

export function computeDashboardData({
  members,
  payments,
  expenses,
  yearConfigs,
  selectedYear
}) {
  const isAllYears = selectedYear === 'all';
  const numericYear = isAllYears ? null : Number(selectedYear);

  // Collect all distinct years available in system
  const yearSet = new Set([
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2
  ]);
  members.forEach((m) => {
    if (m.joinYear) yearSet.add(Number(m.joinYear));
    if (m.yearlyPlans) {
      const keys =
        typeof m.yearlyPlans.keys === 'function'
          ? Array.from(m.yearlyPlans.keys())
          : Object.keys(m.yearlyPlans);
      keys.forEach((k) => {
        if (!Number.isNaN(Number(k))) yearSet.add(Number(k));
      });
    }
  });
  payments.forEach((p) => {
    if (p.year) yearSet.add(Number(p.year));
  });
  expenses.forEach((e) => {
    if (e.year) yearSet.add(Number(e.year));
  });
  yearConfigs.forEach((yc) => {
    if (yc.year) yearSet.add(Number(yc.year));
  });

  const availableYears = Array.from(yearSet)
    .filter((y) => !Number.isNaN(y) && y >= 2000 && y <= 2100)
    .sort((a, b) => b - a);

  const yearConfigMap = new Map();
  yearConfigs.forEach((yc) => yearConfigMap.set(Number(yc.year), yc));

  // Filter active members for a given year
  const getEligibleMembersForYear = (yr) => {
    return members.filter((m) => {
      const mId = String(m._id);
      const hasPaymentInYear = payments.some(
        (p) => String(p.memberId?._id || p.memberId) === mId && Number(p.year) === yr
      );
      if (hasPaymentInYear) return true;
      if (!m.active) return false;
      const joinYr = Number(m.joinYear || yr);
      return joinYr <= yr;
    });
  };

  // Pre-compute expense shares per member per year
  // Map: `${year}_${memberId}` -> number
  const memberExpenseShareByYear = new Map();
  const addExpenseShare = (yr, mId, amount) => {
    const key = `${yr}_${mId}`;
    memberExpenseShareByYear.set(key, (memberExpenseShareByYear.get(key) || 0) + amount);
  };

  expenses.forEach((exp) => {
    const yr = Number(exp.year);
    const amt = Number(exp.amount || 0);
    if (amt <= 0) return;

    let targetMemberIds = [];
    if (exp.splitType === 'selected' && Array.isArray(exp.participants) && exp.participants.length > 0) {
      targetMemberIds = exp.participants.map((id) => String(id?._id || id));
    } else {
      const eligible = getEligibleMembersForYear(yr);
      targetMemberIds = eligible.map((m) => String(m._id));
    }

    if (targetMemberIds.length > 0) {
      const perHead = amt / targetMemberIds.length;
      targetMemberIds.forEach((mId) => addExpenseShare(yr, mId, perHead));
    }
  });

  // Compute year-by-year summary table (useful for multi-year comparison: 2 years ago, 1 year ago, current year)
  const yearlyComparison = availableYears
    .slice()
    .sort((a, b) => a - b)
    .map((yr) => {
      const yrPayments = payments.filter((p) => Number(p.year) === yr);
      const yrExpenses = expenses.filter((e) => Number(e.year) === yr);
      const eligibleMembers = getEligibleMembersForYear(yr);
      const yc = yearConfigMap.get(yr);

      let totalTarget = 0;
      eligibleMembers.forEach((m) => {
        const plan = getMemberYearPlan(m, yr, yc);
        totalTarget += plan.yearlyTarget;
      });

      const totalCollected = yrPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const totalExpense = yrExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const netYearBalance = totalCollected - totalExpense;
      const totalDue = Math.max(0, totalTarget - totalCollected);
      const perMemberExpense =
        eligibleMembers.length > 0 ? totalExpense / eligibleMembers.length : 0;

      return {
        year: yr,
        memberCount: eligibleMembers.length,
        totalTarget,
        totalCollected,
        totalDue,
        totalExpense,
        netYearBalance,
        perMemberExpense: Math.round(perMemberExpense * 100) / 100,
        paymentCount: yrPayments.length,
        expenseCount: yrExpenses.length
      };
    });

  // Running carry-over balance across years
  let runningCarry = 0;
  yearlyComparison.forEach((item) => {
    item.openingCarryOver = runningCarry;
    item.closingCumulativeBalance = runningCarry + item.netYearBalance;
    runningCarry = item.closingCumulativeBalance;
  });

  // Build detailed member stats for selectedYear (or 'all')
  const memberStats = members.map((m) => {
    const mId = String(m._id);
    const memberPaymentsAll = payments.filter(
      (p) => String(p.memberId?._id || p.memberId) === mId
    );

    // Per-year history for this member across all available years
    const yearlyHistory = availableYears.map((yr) => {
      const yc = yearConfigMap.get(yr);
      const plan = getMemberYearPlan(m, yr, yc);
      const yrPayments = memberPaymentsAll.filter((p) => Number(p.year) === yr);
      const paid = yrPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const isMemberInYear =
        Number(m.joinYear || yr) <= yr || yrPayments.length > 0;
      const effectiveTarget = isMemberInYear ? plan.yearlyTarget : 0;
      const due = Math.max(0, effectiveTarget - paid);
      const extra = Math.max(0, paid - effectiveTarget);
      const expenseShare =
        Math.round((memberExpenseShareByYear.get(`${yr}_${mId}`) || 0) * 100) / 100;
      const netBalance = Math.round((paid - expenseShare) * 100) / 100;

      const months = BENGALI_MONTHS.map((bm) => {
        const mPayments = yrPayments.filter((p) => Number(p.month) === bm.num);
        const mPaid = mPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
        let status = 'unpaid';
        if (mPaid >= plan.monthlyAmount && plan.monthlyAmount > 0) {
          status = 'paid';
        } else if (mPaid > 0) {
          status = 'partial';
        }
        return {
          month: bm.num,
          monthName: bm.name,
          shortName: bm.short,
          target: isMemberInYear ? plan.monthlyAmount : 0,
          paid: mPaid,
          due: isMemberInYear ? Math.max(0, plan.monthlyAmount - mPaid) : 0,
          status,
          payments: mPayments
        };
      });

      const oneTimePayments = yrPayments.filter((p) => Number(p.month) === 0);
      const oneTimePaid = oneTimePayments.reduce((s, p) => s + Number(p.amount || 0), 0);

      return {
        year: yr,
        isMemberInYear,
        monthlyAmount: plan.monthlyAmount,
        yearlyTarget: effectiveTarget,
        paid,
        due,
        extra,
        expenseShare,
        netBalance,
        oneTimePaid,
        paymentCount: yrPayments.length,
        months
      };
    });

    if (isAllYears) {
      const totalTarget = yearlyHistory.reduce((s, h) => s + h.yearlyTarget, 0);
      const totalPaid = yearlyHistory.reduce((s, h) => s + h.paid, 0);
      const totalDue = yearlyHistory.reduce((s, h) => s + h.due, 0);
      const totalExtra = yearlyHistory.reduce((s, h) => s + h.extra, 0);
      const totalExpenseShare =
        Math.round(yearlyHistory.reduce((s, h) => s + h.expenseShare, 0) * 100) / 100;
      const netFundStanding =
        Math.round((totalPaid - totalExpenseShare) * 100) / 100;

      return {
        ...m.toObject(),
        selectedYear: 'all',
        isMemberInSelectedPeriod: true,
        monthlyAmountDisplay: m.monthlyAmount,
        yearlyTargetDisplay: totalTarget,
        totalPaid,
        totalDue,
        totalExtra,
        expenseShare: totalExpenseShare,
        netFundStanding,
        completionPercent:
          totalTarget > 0 ? Math.min(100, Math.round((totalPaid / totalTarget) * 100)) : 100,
        monthsBreakdown: [],
        yearlyHistory
      };
    } else {
      const yrHist =
        yearlyHistory.find((h) => h.year === numericYear) || {
          year: numericYear,
          isMemberInYear: true,
          monthlyAmount: m.monthlyAmount,
          yearlyTarget: m.yearlyTarget,
          paid: 0,
          due: m.yearlyTarget,
          extra: 0,
          expenseShare: 0,
          netBalance: 0,
          months: []
        };

      return {
        ...m.toObject(),
        selectedYear: numericYear,
        isMemberInSelectedPeriod: yrHist.isMemberInYear,
        monthlyAmountDisplay: yrHist.monthlyAmount,
        yearlyTargetDisplay: yrHist.yearlyTarget,
        totalPaid: yrHist.paid,
        totalDue: yrHist.due,
        totalExtra: yrHist.extra,
        expenseShare: yrHist.expenseShare,
        netFundStanding: yrHist.netBalance,
        completionPercent:
          yrHist.yearlyTarget > 0
            ? Math.min(100, Math.round((yrHist.paid / yrHist.yearlyTarget) * 100))
            : 0,
        monthsBreakdown: yrHist.months,
        yearlyHistory
      };
    }
  });

  // Overall Fund Summary
  const allTimeCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const allTimeExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const allTimeCurrentFund = allTimeCollected - allTimeExpense;

  const filteredPayments = isAllYears
    ? payments
    : payments.filter((p) => Number(p.year) === numericYear);
  const filteredExpenses = isAllYears
    ? expenses
    : expenses.filter((e) => Number(e.year) === numericYear);

  const periodTarget = memberStats.reduce((s, m) => s + (m.yearlyTargetDisplay || 0), 0);
  const periodCollected = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const periodDue = memberStats.reduce((s, m) => s + (m.totalDue || 0), 0);
  const periodExpense = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const periodNetBalance = periodCollected - periodExpense;

  const activeEligibleCount = memberStats.filter(
    (m) => m.active && m.isMemberInSelectedPeriod
  ).length;
  const perMemberEqualExpense =
    activeEligibleCount > 0
      ? Math.round((periodExpense / activeEligibleCount) * 100) / 100
      : 0;

  const selectedYearComparison = !isAllYears
    ? yearlyComparison.find((c) => c.year === numericYear)
    : null;

  return {
    selectedYear: isAllYears ? 'all' : numericYear,
    availableYears,
    summary: {
      totalMembers: members.length,
      activeMembers: activeEligibleCount,
      periodTarget,
      periodCollected, // ফান্ডে কত টাকা ছিল (নির্বাচিত বছরে জমা)
      periodDue, // কত টাকা বকেয়া আছে
      periodExpense, // ফান্ড থেকে কত টাকা খরচ হয়েছে
      periodNetBalance, // নির্বাচিত বছরের অবশিষ্ট ফান্ড
      perMemberEqualExpense, // মাথাপিছু খরচের অংশ
      openingCarryOver: selectedYearComparison ? selectedYearComparison.openingCarryOver : 0,
      closingCumulativeBalance: selectedYearComparison
        ? selectedYearComparison.closingCumulativeBalance
        : allTimeCurrentFund,
      allTimeCollected, // সর্বমোট ফান্ডে জমা ছিল
      allTimeExpense, // সর্বমোট খরচ হয়েছে
      allTimeCurrentFund // বর্তমানে ফান্ডে মোট ক্যাশ আছে
    },
    yearlyComparison: yearlyComparison.slice().sort((a, b) => b - a),
    members: memberStats,
    payments: filteredPayments,
    expenses: filteredExpenses
  };
}
