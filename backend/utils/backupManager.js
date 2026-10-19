import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import YearConfig from '../models/YearConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel Serverless, /var/task is read-only so we use os.tmpdir() for writable backups
export const BACKUP_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'golden-somiti-backups')
  : path.join(__dirname, '..', 'backups');

export async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch {
    // ignore on restricted environments
  }
}

export async function exportFullDatabaseJSON(label = 'Auto Backup') {
  const [members, payments, expenses, yearConfigs] = await Promise.all([
    Member.find().sort({ memberCode: 1, createdAt: 1 }).lean(),
    Payment.find().sort({ date: -1, createdAt: -1 }).lean(),
    Expense.find().sort({ date: -1, createdAt: -1 }).lean(),
    YearConfig.find().sort({ year: -1 }).lean()
  ]);

  return {
    appName: 'Golden Somiti (গোল্ডেন সমিতি)',
    version: '1.0.0',
    label,
    exportedAt: new Date().toISOString(),
    counts: {
      members: members.length,
      payments: payments.length,
      expenses: expenses.length,
      yearConfigs: yearConfigs.length
    },
    data: {
      members,
      payments,
      expenses,
      yearConfigs
    }
  };
}

export async function writeAutoBackupSnapshot(reason = 'auto-sync') {
  try {
    await ensureBackupDir();
    const payload = await exportFullDatabaseJSON(reason);
    const latestPath = path.join(BACKUP_DIR, 'latest-auto-backup.json');
    await fs.writeFile(latestPath, JSON.stringify(payload, null, 2), 'utf-8');

    const dateTag = new Date().toISOString().slice(0, 10);
    const dailyPath = path.join(BACKUP_DIR, `daily-backup-${dateTag}.json`);
    await fs.writeFile(dailyPath, JSON.stringify(payload, null, 2), 'utf-8');
    return payload;
  } catch (err) {
    console.warn('Auto backup write warning:', err.message);
    return null;
  }
}

export async function createNamedSnapshot(customLabel = 'Manual Snapshot') {
  await ensureBackupDir();
  const payload = await exportFullDatabaseJSON(customLabel);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `snapshot-${ts}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  await writeAutoBackupSnapshot(customLabel);
  return { fileName, payload };
}

export async function listSavedSnapshots() {
  await ensureBackupDir();
  let files = [];
  try {
    files = await fs.readdir(BACKUP_DIR);
  } catch {
    files = [];
  }
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const results = [];
  for (const fileName of jsonFiles) {
    try {
      const fullPath = path.join(BACKUP_DIR, fileName);
      const stat = await fs.stat(fullPath);
      const raw = await fs.readFile(fullPath, 'utf-8');
      const parsed = JSON.parse(raw);
      results.push({
        fileName,
        label: parsed.label || fileName,
        exportedAt: parsed.exportedAt || stat.mtime.toISOString(),
        sizeBytes: stat.size,
        counts: parsed.counts || {
          members: parsed.data?.members?.length || 0,
          payments: parsed.data?.payments?.length || 0,
          expenses: parsed.data?.expenses?.length || 0
        }
      });
    } catch {
      // skip invalid file
    }
  }

  return results.sort(
    (a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime()
  );
}

export async function restoreFromBackupPayload(payload) {
  if (!payload || !payload.data) {
    throw new Error('অবৈধ ব্যাকআপ ফাইল! ডাটা পাওয়া যায়নি।');
  }

  const { members = [], payments = [], expenses = [], yearConfigs = [] } = payload.data;

  try {
    await createNamedSnapshot('Pre-Restore Safety Backup');
  } catch {
    // ignore snapshot error on read-only
  }

  await Promise.all([
    Member.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    YearConfig.deleteMany({})
  ]);

  if (yearConfigs.length > 0) {
    await YearConfig.insertMany(yearConfigs);
  }
  if (members.length > 0) {
    await Member.insertMany(members);
  }
  if (payments.length > 0) {
    await Payment.insertMany(payments);
  }
  if (expenses.length > 0) {
    await Expense.insertMany(expenses);
  }

  await writeAutoBackupSnapshot('Restored Backup');

  return {
    members: members.length,
    payments: payments.length,
    expenses: expenses.length,
    yearConfigs: yearConfigs.length
  };
}
