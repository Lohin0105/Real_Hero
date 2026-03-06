// backend/models/User.mjs
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional if using firebase, required for OTP auth

  isVerified: { type: Boolean, default: false },

  otp: { type: String },
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  lastOtpSent: { type: Date },

  age: { type: String },
  phone: { type: String },
  blood: { type: String },
  bloodGroup: { type: String },
  profilePhoto: { type: String }, // base64 encoded image
  gender: { type: String, enum: ["Male", "Female", "Others", null] },
  dateOfBirth: { type: Date },
  weight: { type: Number },
  available: { type: Boolean, default: false },
  location: {
    lat: Number,
    lng: Number,
  },
  locationGeo: {
    // optional GeoJSON point for geospatial queries
    // NOTE: do NOT provide a default `type: 'Point'` — this can create a partial object
    // (e.g. { type: 'Point' } with missing coordinates) which MongoDB rejects for 2dsphere
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  lastDonation: { type: Date },
  donationsCount: { type: Number, default: 0 },
  heroCoins: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  leaderboardPoints: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 100 },
  bio: { type: String, maxlength: 500 },
  badges: { type: [String], default: [] },
  redeemedCoins: { type: Number, default: 0 },
  preferredLanguage: { type: String, default: 'en' } // Language preference
}, { timestamps: true });

// ensure 2dsphere index if locationGeo used
userSchema.index({ locationGeo: "2dsphere" });
userSchema.index({ leaderboardPoints: -1 }); // For leaderboard queries

export default mongoose.model("User", userSchema);
