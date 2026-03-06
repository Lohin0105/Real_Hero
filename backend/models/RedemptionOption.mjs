import mongoose from "mongoose";

const RedemptionOptionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ["healthcare", "pharmacy", "emergency", "charity"],
        required: true
    },
    coinCost: { type: Number, required: true },
    partner: { type: String, default: "Real-Hero Partners" },
    icon: { type: String, default: "🎁" },
    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // null = unlimited
    redemptionCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("RedemptionOption", RedemptionOptionSchema);
