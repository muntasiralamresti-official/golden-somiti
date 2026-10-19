import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true
    },
    year: { type: Number, required: true, index: true },
    month: { type: Number, required: true, min: 0, max: 12 },
    amount: { type: Number, required: true, min: 1 },
    date: { type: String, required: true },
    paymentType: {
      type: String,
      default: 'মাসিক কিস্তি'
    },
    method: {
      type: String,
      default: 'নগদ (Cash)'
    },
    receiptNo: { type: String, default: '' },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
