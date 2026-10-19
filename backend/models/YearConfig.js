import mongoose from 'mongoose';

const yearConfigSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    defaultMonthlyAmount: { type: Number, required: true, default: 1000 },
    defaultYearlyTarget: { type: Number, required: true, default: 12000 },
    societyTitle: { type: String, default: 'গোল্ডেন সমিতি (Golden Somiti)' },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.YearConfig || mongoose.model('YearConfig', yearConfigSchema);
