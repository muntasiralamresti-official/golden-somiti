import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import dns from 'dns';
import Member from './models/Member.js';
import Payment from './models/Payment.js';
import Expense from './models/Expense.js';
import YearConfig from './models/YearConfig.js';
import { computeDashboardData } from './utils/calculator.js';
import {
  BACKUP_DIR,
  createNamedSnapshot,
  exportFullDatabaseJSON,
  listSavedSnapshots,
  restoreFromBackupPayload,
  writeAutoBackupSnapshot
} from './utils/backupManager.js';
import { ensureInitialData } from './utils/initialSeed.js';

// Resolve MongoDB Atlas SRV query ECONNREFUSED on local ISP DNS
if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // fallback
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/golden-somiti';

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Cached MongoDB Connection for Vercel Serverless & Local Server
let cachedDbPromise = null;
let seededOnce = false;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    if (!seededOnce) {
      await ensureInitialData();
      seededOnce = true;
    }
    return mongoose.connection;
  }

  if (!cachedDbPromise) {
    cachedDbPromise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 8000
      })
      .then(async (conn) => {
        console.log('Connected to MongoDB');
        if (!seededOnce) {
          await ensureInitialData();
          seededOnce = true;
        }
        return conn;
      })
      .catch((err) => {
        cachedDbPromise = null;
        throw err;
      });
  }

  return cachedDbPromise;
}

// Middleware to ensure DB connection on every API call (crucial for Vercel Serverless)
app.use('/api', async (req, res, next) => {
  if (req.path === '/network-info') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(500).json({
      error:
        'মঙ্গোডিবি ডাটাবেস সংযোগ পাওয়া যায়নি। Vercel-এ ডিপ্লয় করলে Environment Variable-এ MONGO_URI (MongoDB Atlas URI) যুক্ত করুন।',
      details: err.message
    });
  }
});

app.get('/api/network-info', (req, res) => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({
          interface: name,
          ip: net.address,
          url: `http://${net.address}:5173`
        });
      }
    }
  }
  res.json({ ips, isVercel: Boolean(process.env.VERCEL) });
});

async function buildDashboardResponse(selectedYear = new Date().getFullYear()) {
  const [members, payments, expenses, yearConfigs] = await Promise.all([
    Member.find().sort({ memberCode: 1, createdAt: 1 }),
    Payment.find()
      .populate('memberId', 'name memberCode phone designation photoUrl')
      .sort({ date: -1, createdAt: -1 }),
    Expense.find()
      .populate('participants', 'name memberCode')
      .sort({ date: -1, createdAt: -1 }),
    YearConfig.find().sort({ year: -1 })
  ]);

  const computed = computeDashboardData({
    members,
    payments,
    expenses,
    yearConfigs,
    selectedYear
  });

  return {
    ...computed,
    yearConfigs
  };
}

// 1. Main Dashboard Endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const yearParam = req.query.year || String(new Date().getFullYear());
    const selectedYear = yearParam === 'all' ? 'all' : Number(yearParam);
    const data = await buildDashboardResponse(selectedYear);
    res.json(data);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Single Member Full Multi-Year Profile
app.get('/api/members/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const dashboardData = await buildDashboardResponse('all');
    const memberStat = dashboardData.members.find((m) => String(m._id) === String(id));
    if (!memberStat) {
      return res.status(404).json({ error: 'সদস্য খুঁজে পাওয়া যায়নি' });
    }

    const memberPayments = dashboardData.payments.filter(
      (p) => String(p.memberId?._id || p.memberId) === String(id)
    );

    res.json({
      member: memberStat,
      payments: memberPayments,
      availableYears: dashboardData.availableYears
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Member
app.post('/api/members', async (req, res) => {
  try {
    const {
      memberCode,
      name,
      phone,
      designation,
      joinYear,
      joinDate,
      monthlyAmount,
      yearlyTarget,
      selectedYear,
      photoUrl,
      photoMeta,
      note
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'সদস্যের নাম প্রদান করা আবশ্যক' });
    }

    let finalCode = memberCode ? String(memberCode).trim() : '';
    if (!finalCode) {
      const count = await Member.countDocuments();
      finalCode = `GS-${String(count + 1).padStart(2, '0')}`;
    }

    const mAmt = Number(monthlyAmount) || 1500;
    const yTarget = Number(yearlyTarget) || mAmt * 12;
    const jYear = Number(joinYear) || Number(selectedYear) || new Date().getFullYear();

    const yearlyPlans = {};
    const targetYr = Number(selectedYear) || new Date().getFullYear();
    yearlyPlans[String(targetYr)] = {
      monthlyAmount: mAmt,
      yearlyTarget: yTarget,
      note: ''
    };

    const created = await Member.create({
      memberCode: finalCode,
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : '',
      designation: designation ? String(designation).trim() : 'সদস্য',
      joinYear: jYear,
      joinDate: joinDate || new Date().toISOString().slice(0, 10),
      monthlyAmount: mAmt,
      yearlyTarget: yTarget,
      yearlyPlans,
      photoUrl: photoUrl || '',
      photoMeta: photoMeta || {},
      active: true,
      note: note || ''
    });

    await writeAutoBackupSnapshot(`Added Member: ${created.name}`);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Member
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      memberCode,
      name,
      phone,
      designation,
      joinYear,
      joinDate,
      monthlyAmount,
      yearlyTarget,
      planYear,
      photoUrl,
      photoMeta,
      active,
      note
    } = req.body;

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ error: 'সদস্য পাওয়া যায়নি' });
    }

    if (memberCode !== undefined) member.memberCode = String(memberCode).trim();
    if (name !== undefined) member.name = String(name).trim();
    if (phone !== undefined) member.phone = String(phone).trim();
    if (designation !== undefined) member.designation = String(designation).trim();
    if (joinYear !== undefined) member.joinYear = Number(joinYear);
    if (joinDate !== undefined) member.joinDate = joinDate;
    if (active !== undefined) member.active = Boolean(active);
    if (note !== undefined) member.note = note;
    if (photoUrl !== undefined) member.photoUrl = photoUrl;
    if (photoMeta !== undefined) member.photoMeta = photoMeta;

    if (monthlyAmount !== undefined) {
      const mAmt = Number(monthlyAmount);
      const yTarget = yearlyTarget !== undefined ? Number(yearlyTarget) : mAmt * 12;
      member.monthlyAmount = mAmt;
      member.yearlyTarget = yTarget;

      if (planYear && planYear !== 'all') {
        if (!member.yearlyPlans) member.yearlyPlans = new Map();
        member.yearlyPlans.set(String(planYear), {
          monthlyAmount: mAmt,
          yearlyTarget: yTarget,
          note: note || ''
        });
      }
    }

    await member.save();
    await writeAutoBackupSnapshot(`Updated Member: ${member.name}`);
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Member
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      return res.status(404).json({ error: 'সদস্য পাওয়া যায়নি' });
    }
    await Payment.deleteMany({ memberId: id });
    await writeAutoBackupSnapshot(`Deleted Member: ${member.name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Create Payment / Collection
app.post('/api/payments', async (req, res) => {
  try {
    const {
      memberId,
      year,
      month,
      months,
      amount,
      date,
      paymentType,
      method,
      note
    } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'সদস্য নির্বাচন করুন' });
    }

    const yr = Number(year) || new Date().getFullYear();
    const dt = date || new Date().toISOString().slice(0, 10);
    const countExisting = await Payment.countDocuments({ year: yr });

    if (Array.isArray(months) && months.length > 1) {
      const perMonthAmount = Math.round((Number(amount) / months.length) * 100) / 100;
      const docs = months.map((mNum, idx) => ({
        memberId,
        year: yr,
        month: Number(mNum),
        amount: perMonthAmount,
        date: dt,
        paymentType: paymentType || 'মাসিক কিস্তি',
        method: method || 'নগদ (Cash)',
        receiptNo: `RCP-${String(yr).slice(-2)}-${countExisting + 1001 + idx}`,
        note: note || ''
      }));
      const inserted = await Payment.insertMany(docs);
      await writeAutoBackupSnapshot('Recorded Multi-Month Collection');
      return res.status(201).json(inserted);
    }

    const totalAmt = Number(amount);
    if (!totalAmt || totalAmt <= 0) {
      return res.status(400).json({ error: 'সঠিক টাকার পরিমাণ লিখুন' });
    }

    const created = await Payment.create({
      memberId,
      year: yr,
      month: month !== undefined ? Number(month) : new Date().getMonth() + 1,
      amount: totalAmt,
      date: dt,
      paymentType: paymentType || 'মাসিক কিস্তি',
      method: method || 'নগদ (Cash)',
      receiptNo: `RCP-${String(yr).slice(-2)}-${countExisting + 1001}`,
      note: note || ''
    });

    await writeAutoBackupSnapshot(`Payment Added: ${totalAmt} BDT`);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Payment
app.put('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Payment.findByIdAndUpdate(
      id,
      {
        $set: {
          memberId: req.body.memberId,
          year: Number(req.body.year),
          month: Number(req.body.month),
          amount: Number(req.body.amount),
          date: req.body.date,
          paymentType: req.body.paymentType,
          method: req.body.method,
          note: req.body.note
        }
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'লেনদেন পাওয়া যায়নি' });
    }
    await writeAutoBackupSnapshot('Updated Payment');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete Payment
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Payment.findByIdAndDelete(id);
    await writeAutoBackupSnapshot('Deleted Payment');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Create Expense
app.post('/api/expenses', async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      year,
      date,
      splitType,
      participants,
      spentBy,
      voucherImage,
      voucherImageMeta,
      note
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'খরচের বিবরণ লিখুন' });
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: 'খরচের সঠিক পরিমাণ লিখুন' });
    }

    const yr = Number(year) || new Date().getFullYear();
    const countExp = await Expense.countDocuments({ year: yr });

    const created = await Expense.create({
      title: String(title).trim(),
      category: category || 'সাধারণ খরচ',
      amount: amt,
      year: yr,
      date: date || new Date().toISOString().slice(0, 10),
      splitType: splitType || 'all_active',
      participants: Array.isArray(participants) ? participants : [],
      spentBy: spentBy || 'কমিটি',
      voucherNo: `VCH-${String(yr).slice(-2)}-${String(countExp + 1).padStart(3, '0')}`,
      voucherImage: voucherImage || '',
      voucherImageMeta: voucherImageMeta || {},
      note: note || ''
    });

    await writeAutoBackupSnapshot(`Expense Added: ${created.title}`);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Update Expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        $set: {
          title: req.body.title,
          category: req.body.category,
          amount: Number(req.body.amount),
          year: Number(req.body.year),
          date: req.body.date,
          splitType: req.body.splitType || 'all_active',
          participants: Array.isArray(req.body.participants) ? req.body.participants : [],
          spentBy: req.body.spentBy,
          voucherImage: req.body.voucherImage || '',
          voucherImageMeta: req.body.voucherImageMeta || {},
          note: req.body.note
        }
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'খরচের হিসাব পাওয়া যায়নি' });
    }
    await writeAutoBackupSnapshot('Updated Expense');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Delete Expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    await writeAutoBackupSnapshot('Deleted Expense');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Create or Update Year Configuration & Apply to Members
app.post('/api/year-configs', async (req, res) => {
  try {
    const { year, defaultMonthlyAmount, defaultYearlyTarget, note, applyToAllMembers } = req.body;
    const yr = Number(year);
    if (!yr || yr < 2000 || yr > 2100) {
      return res.status(400).json({ error: 'সঠিক সাল প্রদান করুন' });
    }

    const mAmt = Number(defaultMonthlyAmount) || 1000;
    const yTarget = Number(defaultYearlyTarget) || mAmt * 12;

    const config = await YearConfig.findOneAndUpdate(
      { year: yr },
      {
        $set: {
          year: yr,
          defaultMonthlyAmount: mAmt,
          defaultYearlyTarget: yTarget,
          note: note || ''
        }
      },
      { upsert: true, new: true }
    );

    if (applyToAllMembers) {
      const allMembers = await Member.find();
      for (const m of allMembers) {
        if (!m.yearlyPlans) m.yearlyPlans = new Map();
        m.yearlyPlans.set(String(yr), {
          monthlyAmount: mAmt,
          yearlyTarget: yTarget,
          note: `${yr} সালের নির্ধারিত হার`
        });
        if (yr === new Date().getFullYear()) {
          m.monthlyAmount = mAmt;
          m.yearlyTarget = yTarget;
        }
        await m.save();
      }
    }

    await writeAutoBackupSnapshot(`Configured Year ${yr}`);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Backup & Restore Endpoints
app.get('/api/backups', async (req, res) => {
  try {
    const snapshots = await listSavedSnapshots();
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/snapshot', async (req, res) => {
  try {
    const label = req.body?.label || 'ম্যানুয়াল ব্যাকআপ';
    const result = await createNamedSnapshot(label);
    res.json({
      success: true,
      fileName: result.fileName,
      exportedAt: result.payload.exportedAt,
      counts: result.payload.counts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/export', async (req, res) => {
  try {
    const payload = await exportFullDatabaseJSON('Direct Download Backup');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/file/:fileName', async (req, res) => {
  try {
    const safeName = path.basename(req.params.fileName);
    const fullPath = path.join(BACKUP_DIR, safeName);
    const raw = await fs.readFile(fullPath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(raw);
  } catch (err) {
    res.status(404).json({ error: 'ব্যাকআপ ফাইল পাওয়া যায়নি' });
  }
});

app.post('/api/backups/restore', async (req, res) => {
  try {
    let payload = req.body.payload;
    if (!payload && req.body.fileName) {
      const safeName = path.basename(req.body.fileName);
      const fullPath = path.join(BACKUP_DIR, safeName);
      const raw = await fs.readFile(fullPath, 'utf-8');
      payload = JSON.parse(raw);
    }
    const counts = await restoreFromBackupPayload(payload);
    res.json({ success: true, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
// Reset all transactions (Zero out collections & expenses, retain members & settings)
app.post('/api/backups/reset-transactions', async (req, res) => {
  try {
    const pCount = await Payment.countDocuments();
    const eCount = await Expense.countDocuments();

    // Auto-create snapshot backup before wiping, so user can always restore if needed
    try {
      await exportFullDatabaseJSON('Pre-Zero Reset Snapshot');
    } catch (e) {
      console.warn('Auto snapshot before reset skipped:', e.message);
    }

    await Payment.deleteMany({});
    await Expense.deleteMany({});

    res.json({
      success: true,
      message: 'সকল জমা ও খরচ হিসাব জিরো (Zero) করা হয়েছে। সদস্য তালিকা সংরক্ষিত রয়েছে।',
      deleted: {
        payments: pCount,
        expenses: eCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start standalone server only when not running inside Vercel Serverless
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Golden Somiti Backend Server running on http://127.0.0.1:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

export default app;
