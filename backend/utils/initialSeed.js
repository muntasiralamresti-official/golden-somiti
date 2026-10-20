import YearConfig from '../models/YearConfig.js';

export async function ensureInitialData() {
  try {
    const defaultConfigs = [
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

    for (const cfg of defaultConfigs) {
      await YearConfig.updateOne(
        { year: cfg.year },
        { $setOnInsert: cfg },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('YearConfig initialization check warning:', err.message);
  }
}
