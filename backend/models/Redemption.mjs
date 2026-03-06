import mongoose from "mongoose";
import crypto from "crypto";

const RedemptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    optionId: { type: mongoose.Schema.Types.ObjectId, ref: "RedemptionOption", required: true },
    coinsSpent: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "fulfilled"],
        default: "pending"
    },
    redemptionCode: {
        type: String,
        unique: true,
        default: () => "RH-" + crypto.randomBytes(4).toString("hex").toUpperCase()
    },
    // Snapshot of option at time of redemption
    optionTitle: { type: String },
    optionCategory: { type: String },
    optionPartner: { type: String },
}, { timestamps: true });

export default mongoose.model("Redemption", RedemptionSchema);
