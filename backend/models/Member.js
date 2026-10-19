import mongoose from 'mongoose';

const yearlyPlanSchema = new mongoose.Schema(
  {
    monthlyAmount: { type: Number, required: true },
    yearlyTarget: { type: Number, required: true },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema(
  {
    memberCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    designation: { type: String, default: 'সদস্য', trim: true },
    joinYear: { type: Number, default: () => new Date().getFullYear() },
    joinDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    monthlyAmount: { type: Number, required: true, default: 1000 },
    yearlyTarget: { type: Number, required: true, default: 12000 },
    yearlyPlans: {
      type: Map,
      of: yearlyPlanSchema,
      default: {}
    },
    photoUrl: { type: String, default: '' },
    photoMeta: {
      originalSize: { type: Number, default: 0 },
      optimizedSize: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      format: { type: String, default: 'webp' }
    },
    active: { type: Boolean, default: true },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Member || mongoose.model('Member', memberSchema);
