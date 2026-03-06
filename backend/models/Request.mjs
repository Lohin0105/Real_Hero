import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for now to support legacy
  uid: String, // Keep for legacy support
  name: { type: String, required: true },
  age: { type: Number },
  bloodGroup: { type: String, required: true },
  hospital: { type: String, required: true },
  phone: { type: String, required: true },
  description: { type: String },
  units: { type: Number, default: 1 },
  urgency: {
    type: String,
    enum: ["low", "normal", "high", "critical"],
    default: "normal"
  },
  location: {
    lat: Number,
    lng: Number
  },
  locationGeo: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined },
  },
  status: {
    type: String,
    enum: ["open", "primary_assigned", "backup_assigned", "pending_verification", "fulfilled", "failed", "cancelled"],
    default: "open"
  },
  primaryDonor: {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: Date,
    confirmedAt: Date,
    arrived: Boolean,
    slipUrl: String
  },
  backupDonors: [
    {
      donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      acceptedAt: Date,
      promoted: Boolean,
      reachedHospital: Boolean,
      gpsVerified: Boolean
    }
  ],
  // Donors in cooldown period who want to be notified if no one accepts within 6 hours
  watchers: [
    {
      donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      name: String,
      addedAt: { type: Date, default: Date.now },
      notified: { type: Boolean, default: false }
    }
  ],
  watcherNotifiedAt: { type: Date, default: null }, // when the 6-hr notification was last sent
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 } // 1 week from now

}, { timestamps: true });

RequestSchema.index({ locationGeo: "2dsphere" });

export default mongoose.model("Request", RequestSchema);
