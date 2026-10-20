const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BN_TO_EN = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export function toBanglaNumber(val) {
  if (val === null || val === undefined) return '০';
  return String(val).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function toEnglishNumber(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[০-৯]/g, (d) => BN_TO_EN[d] || d);
}

export function formatBDT(amount, showSymbol = true) {
  const num = Number(amount || 0);
  const rounded = Math.round(num);
  const formattedEn = rounded.toLocaleString('en-IN');
  const formattedBn = toBanglaNumber(formattedEn);
  return showSymbol ? `৳ ${formattedBn}` : formattedBn;
}

export function formatDateBn(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-');
    const monthObj = BENGALI_MONTHS.find((bm) => bm.num === Number(m));
    if (!monthObj) return toBanglaNumber(dateStr);
    return `${toBanglaNumber(Number(d))} ${monthObj.name}, ${toBanglaNumber(y)}`;
  } catch {
    return toBanglaNumber(dateStr);
  }
}

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

export function getMonthNameBn(monthNum) {
  if (Number(monthNum) === 0) return 'এককালীন / বিশেষ';
  const found = BENGALI_MONTHS.find((m) => m.num === Number(monthNum));
  return found ? found.name : 'অন্যান্য';
}
