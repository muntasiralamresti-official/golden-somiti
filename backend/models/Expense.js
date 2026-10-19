import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'সাধারণ খরচ', trim: true },
    amount: { type: Number, required: true, min: 1 },
    year: { type: Number, required: true, index: true },
    date: { type: String, required: true },
    splitType: {
      type: String,
      enum: ['all_active', 'selected'],
      default: 'all_active'
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      }
    ],
    spentBy: { type: String, default: 'কমিটি', trim: true },
    voucherNo: { type: String, default: '' },
    voucherImage: { type: String, default: '' },
    voucherImageMeta: {
      originalSize: { type: Number, default: 0 },
      optimizedSize: { type: Number, default: 0 },
      format: { type: String, default: 'webp' }
    },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
