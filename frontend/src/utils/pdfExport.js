import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { formatBDT, formatDateBn, getMonthNameBn, toBanglaNumber } from './formatters';

/**
 * Renders HTML with Bengali Unicode text inside an isolated offscreen iframe
 * using pure Hex/RGB styles (avoiding Tailwind v4 oklch parsing in html2canvas)
 * and exports a crisp multi-page A4 PDF.
 */
async function renderHtmlToPdf(bodyHtml, fileName) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '840px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
            background: #ffffff;
            color: #0f172a;
            padding: 32px;
            width: 820px;
            line-height: 1.5;
          }
          .header-banner {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #ffffff;
            padding: 24px 28px;
            border-radius: 14px;
            border-bottom: 4px solid #f59e0b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
          }
          .title-gold {
            color: #fbbf24;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.3px;
          }
          .subtitle {
            color: #cbd5e1;
            font-size: 13px;
            margin-top: 4px;
          }
          .badge-box {
            text-align: right;
            background: rgba(245, 158, 11, 0.16);
            border: 1px solid #f59e0b;
            padding: 10px 16px;
            border-radius: 10px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 22px;
          }
          .stat-box {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 10px;
            padding: 12px 14px;
          }
          .stat-label {
            font-size: 12px;
            color: #475569;
            font-weight: 600;
          }
          .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
          }
          .stat-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 18px 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 2px solid #f59e0b;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            font-size: 12px;
          }
          th {
            background: #1e293b;
            color: #f8fafc;
            text-align: left;
            padding: 8px 10px;
            font-weight: 600;
            border: 1px solid #334155;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #cbd5e1;
            color: #1e293b;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #047857; font-weight: 700; }
          .text-red { color: #b91c1c; font-weight: 700; }
          .text-amber { color: #b45309; font-weight: 700; }
          .footer-note {
            margin-top: 26px;
            padding-top: 12px;
            border-top: 1px dashed #94a3b8;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
      </html>
    `);
    doc.close();

    if (doc.fonts && doc.fonts.ready) {
      await doc.fonts.ready;
    }
    await new Promise((r) => setTimeout(r, 350));

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(iframe);
  }
}

export async function downloadFullSocietyReportPDF(dashboardData) {
  const { selectedYear, summary, members = [], expenses = [], yearlyComparison = [] } = dashboardData;
  const periodTitle =
    selectedYear === 'all'
      ? 'সর্বমোট সামগ্রিক হিসাব (সব বছর)'
      : `অর্থবছর: ${toBanglaNumber(selectedYear)}`;
  const todayStr = formatDateBn(new Date().toISOString().slice(0, 10));

  const memberRows = members
    .map(
      (m, i) => `
      <tr>
        <td class="text-center">${toBanglaNumber(i + 1)}</td>
        <td><strong>${m.name}</strong><br/><span style="font-size:10px;color:#64748b;">${m.memberCode} • ${m.designation || 'সদস্য'}</span></td>
        <td class="text-right">${formatBDT(m.monthlyAmountDisplay)}</td>
        <td class="text-right">${formatBDT(m.yearlyTargetDisplay)}</td>
        <td class="text-right text-green">${formatBDT(m.totalPaid)}</td>
        <td class="text-right ${m.totalDue > 0 ? 'text-red' : 'text-green'}">${formatBDT(m.totalDue)}</td>
        <td class="text-right text-amber">${formatBDT(m.expenseShare)}</td>
        <td class="text-right"><strong>${formatBDT(m.netFundStanding)}</strong></td>
      </tr>
    `
    )
    .join('');

  const expenseRows =
    expenses.length > 0
      ? expenses
          .map(
            (e, i) => `
        <tr>
          <td class="text-center">${toBanglaNumber(i + 1)}</td>
          <td>${formatDateBn(e.date)}</td>
          <td><strong>${e.title}</strong> ${e.note ? `<br/><span style="font-size:10px;color:#64748b;">${e.note}</span>` : ''}</td>
          <td>${e.category}</td>
          <td>${e.spentBy || 'কমিটি'}</td>
          <td class="text-right text-red">${formatBDT(e.amount)}</td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="6" class="text-center">এই সময়ে কোনো খরচের হিসাব নেই</td></tr>`;

  const comparisonRows = yearlyComparison
    .map(
      (yc) => `
      <tr>
        <td><strong>${toBanglaNumber(yc.year)} সাল</strong></td>
        <td class="text-center">${toBanglaNumber(yc.memberCount)} জন</td>
        <td class="text-right">${formatBDT(yc.totalTarget)}</td>
        <td class="text-right text-green">${formatBDT(yc.totalCollected)}</td>
        <td class="text-right text-red">${formatBDT(yc.totalDue)}</td>
        <td class="text-right text-amber">${formatBDT(yc.totalExpense)}</td>
        <td class="text-right"><strong>${formatBDT(yc.netYearBalance)}</strong></td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div class="header-banner">
      <div>
        <div class="title-gold">গোল্ডেন সমিতি (Golden Somiti)</div>
        <div class="subtitle">সমিতির বার্ষিক তহবিল, সদস্য কালেকশন, বকেয়া ও খরচের পূর্ণাঙ্গ অডিট রিপোর্ট</div>
      </div>
      <div class="badge-box">
        <div style="font-size:14px;font-weight:700;color:#fbbf24;">${periodTitle}</div>
        <div style="font-size:11px;color:#e2e8f0;margin-top:3px;">তারিখ: ${todayStr}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="stat-box">
        <div class="stat-label">ফান্ডে মোট জমা (${selectedYear === 'all' ? 'সর্বমোট' : toBanglaNumber(selectedYear)})</div>
        <div class="stat-value text-green">${formatBDT(summary.periodCollected)}</div>
        <div class="stat-sub">লক্ষ্যমাত্রা: ${formatBDT(summary.periodTarget)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">ফান্ড থেকে মোট খরচ</div>
        <div class="stat-value text-amber">${formatBDT(summary.periodExpense)}</div>
        <div class="stat-sub">মাথাপিছু খরচ: ${formatBDT(summary.perMemberEqualExpense)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">ফান্ডে বর্তমান স্থিতি (ক্যাশ)</div>
        <div class="stat-value" style="color:#0284c7;">${formatBDT(summary.periodNetBalance)}</div>
        <div class="stat-sub">সর্বমোট ফান্ড ক্যাশ: ${formatBDT(summary.allTimeCurrentFund)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">সদস্যদের মোট বকেয়া</div>
        <div class="stat-value text-red">${formatBDT(summary.periodDue)}</div>
        <div class="stat-sub">মোট সদস্য: ${toBanglaNumber(summary.totalMembers)} জন</div>
      </div>
    </div>

    <div class="section-title">
      <span>১. সদস্যদের জমা, বকেয়া ও খরচের অংশীদারিত্ব (${periodTitle})</span>
      <span>সদস্য সংখ্যা: ${toBanglaNumber(members.length)} জন</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;">ক্র.</th>
          <th>সদস্যের নাম ও আইডি</th>
          <th class="text-right">মাসিক হার</th>
          <th class="text-right">বার্ষিক ধার্য</th>
          <th class="text-right">মোট জমা</th>
          <th class="text-right">বকেয়া</th>
          <th class="text-right">খরচের অংশ</th>
          <th class="text-right">নিট ফান্ড শেয়ার</th>
        </tr>
      </thead>
      <tbody>
        ${memberRows}
      </tbody>
    </table>

    <div class="section-title">
      <span>২. ফান্ড হতে খরচের বিবরণী (${periodTitle})</span>
      <span>মোট খরচ: ${formatBDT(summary.periodExpense)}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;">ক্র.</th>
          <th>তারিখ</th>
          <th>খরচের বিবরণ</th>
          <th>ক্যাটাগরি</th>
          <th>মারফত</th>
          <th class="text-right">টাকার পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        ${expenseRows}
      </tbody>
    </table>

    <div class="section-title">
      <span>৩. বিগত বছরগুলোর তুলনামূলক ফান্ড ও হিসাব চিত্র</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>অর্থবছর</th>
          <th class="text-center">সদস্য</th>
          <th class="text-right">মোট ধার্য</th>
          <th class="text-right">মোট কালেকশন</th>
          <th class="text-right">বকেয়া</th>
          <th class="text-right">মোট খরচ</th>
          <th class="text-right">বর্ষশেষে নিট ফান্ড</th>
        </tr>
      </thead>
      <tbody>
        ${comparisonRows}
      </tbody>
    </table>

    <div class="footer-note">
      <span>গোল্ডেন সমিতি (Golden Somiti) — ডিজিটাল তহবিল ব্যবস্থাপনা</span>
      <span>স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত পিডিএফ রিপোর্ট • ${todayStr}</span>
    </div>
  `;

  await renderHtmlToPdf(html, `Golden-Somiti-Report-${selectedYear}.pdf`);
}

export async function downloadMemberProfilePDF(member, payments = [], selectedYear = 'all') {
  const todayStr = formatDateBn(new Date().toISOString().slice(0, 10));

  const yearlyRows = (member.yearlyHistory || [])
    .map(
      (yh) => `
      <tr>
        <td><strong>${toBanglaNumber(yh.year)} সাল</strong></td>
        <td class="text-right">${formatBDT(yh.monthlyAmount)}</td>
        <td class="text-right">${formatBDT(yh.yearlyTarget)}</td>
        <td class="text-right text-green">${formatBDT(yh.paid)}</td>
        <td class="text-right ${yh.due > 0 ? 'text-red' : 'text-green'}">${formatBDT(yh.due)}</td>
        <td class="text-right text-amber">${formatBDT(yh.expenseShare)}</td>
        <td class="text-right"><strong>${formatBDT(yh.netBalance)}</strong></td>
      </tr>
    `
    )
    .join('');

  const paymentRows =
    payments.length > 0
      ? payments
          .map(
            (p, idx) => `
        <tr>
          <td class="text-center">${toBanglaNumber(idx + 1)}</td>
          <td>${formatDateBn(p.date)}</td>
          <td>${toBanglaNumber(p.year)}</td>
          <td>${getMonthNameBn(p.month)}</td>
          <td>${p.paymentType || 'মাসিক কিস্তি'} (${p.method || 'নগদ'})</td>
          <td>${p.receiptNo || '-'}</td>
          <td class="text-right text-green">${formatBDT(p.amount)}</td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="7" class="text-center">কোনো জমার রেকর্ড পাওয়া যায়নি</td></tr>`;

  const totalAllYearsTarget = (member.yearlyHistory || []).reduce((s, h) => s + h.yearlyTarget, 0);
  const totalAllYearsPaid = (member.yearlyHistory || []).reduce((s, h) => s + h.paid, 0);
  const totalAllYearsDue = (member.yearlyHistory || []).reduce((s, h) => s + h.due, 0);
  const totalAllYearsExpense = (member.yearlyHistory || []).reduce((s, h) => s + h.expenseShare, 0);
  const totalAllYearsNet = totalAllYearsPaid - totalAllYearsExpense;

  const html = `
    <div class="header-banner">
      <div>
        <div class="title-gold">গোল্ডেন সমিতি (Golden Somiti)</div>
        <div class="subtitle">সদস্যের ব্যক্তিগত প্রোফাইল ও বহু-বার্ষিক হিসাব বিবরণী</div>
      </div>
      <div class="badge-box">
        <div style="font-size:15px;font-weight:700;color:#fbbf24;">${member.name}</div>
        <div style="font-size:11px;color:#e2e8f0;">আইডি: ${member.memberCode} • ${member.designation || 'সদস্য'}</div>
      </div>
    </div>

    <div style="border:1px solid #cbd5e1;border-radius:10px;padding:12px 16px;margin-bottom:18px;background:#f8fafc;display:flex;justify-content:space-between;font-size:13px;">
      <div><strong>নাম:</strong> ${member.name} (${member.memberCode})</div>
      <div><strong>মোবাইল:</strong> ${member.phone || 'উল্লেখ নেই'}</div>
      <div><strong>যোগদানের সাল:</strong> ${toBanglaNumber(member.joinYear)}</div>
      <div><strong>বর্তমান মাসিক হার:</strong> ${formatBDT(member.monthlyAmount)}</div>
    </div>

    <div class="summary-grid">
      <div class="stat-box">
        <div class="stat-label">সর্বমোট নির্ধারিত (সব বছর)</div>
        <div class="stat-value">${formatBDT(totalAllYearsTarget)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">সর্বমোট জমা দিয়েছেন</div>
        <div class="stat-value text-green">${formatBDT(totalAllYearsPaid)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">সর্বমোট বকেয়া</div>
        <div class="stat-value text-red">${formatBDT(totalAllYearsDue)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">খরচ বাদে নিট ফান্ড শেয়ার</div>
        <div class="stat-value" style="color:#0284c7;">${formatBDT(totalAllYearsNet)}</div>
        <div class="stat-sub">মোট খরচের অংশ: ${formatBDT(totalAllYearsExpense)}</div>
      </div>
    </div>

    <div class="section-title">
      <span>১. বছরভিত্তিক জমা, বকেয়া ও খরচের হিসাব (প্রত্যেক বছরের আলাদা চিত্র)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>অর্থবছর</th>
          <th class="text-right">মাসিক কিস্তি</th>
          <th class="text-right">বার্ষিক নির্ধারিত</th>
          <th class="text-right">মোট জমা</th>
          <th class="text-right">বকেয়া</th>
          <th class="text-right">সমিতির খরচের অংশ</th>
          <th class="text-right">নিট স্থিতি</th>
        </tr>
      </thead>
      <tbody>
        ${yearlyRows}
      </tbody>
    </table>

    <div class="section-title">
      <span>২. সকল জমার রশিদ ও লেনদেন বিবরণী</span>
      <span>মোট লেনদেন: ${toBanglaNumber(payments.length)} টি</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;">ক্র.</th>
          <th>তারিখ</th>
          <th>সাল</th>
          <th>মাস</th>
          <th>ধরন ও মাধ্যম</th>
          <th>রশিদ নং</th>
          <th class="text-right">জমার পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows}
      </tbody>
    </table>

    <div class="footer-note">
      <span>গোল্ডেন সমিতি (Golden Somiti) — সদস্য প্রোফাইল স্টেটমেন্ট</span>
      <span>প্রিন্ট তারিখ: ${todayStr}</span>
    </div>
  `;

  await renderHtmlToPdf(html, `Golden-Somiti-${member.memberCode}-Profile.pdf`);
}
