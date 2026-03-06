import RedemptionOption from "../models/RedemptionOption.mjs";
import Redemption from "../models/Redemption.mjs";
import User from "../models/User.mjs";


// ── Default catalog seeded on first request ──────────────────────────────────
const DEFAULT_OPTIONS = [
    {
        title: "Free Blood Test",
        description: "Redeem for a free Complete Blood Count (CBC) test at partnered diagnostic labs.",
        category: "healthcare",
        coinCost: 100,
        partner: "Real-Hero Diagnostic Partners",
        icon: "🩸",
    },
    {
        title: "Pharmacy Voucher ₹100",
        description: "Get a ₹100 discount at partnered pharmacies on medicines and health supplements.",
        category: "pharmacy",
        coinCost: 200,
        partner: "Generic Pharmacy Partners",
        icon: "💊",
    },
    {
        title: "Free Medical Consultation",
        description: "Book a free online consultation with a General Physician or Specialist.",
        category: "healthcare",
        coinCost: 300,
        partner: "Real-Hero Health Partners",
        icon: "👨‍⚕️",
    },
    {
        title: "Emergency Priority Request",
        description: "Your next blood request will be marked as Priority and broadcast to 3x more donors instantly.",
        category: "emergency",
        coinCost: 500,
        partner: "Real-Hero Platform",
        icon: "🚨",
    },
    {
        title: "Donate to NGO (50 coins)",
        description: "Donate 50 coins to blood donation awareness NGOs on your behalf. Make a social impact.",
        category: "charity",
        coinCost: 50,
        partner: "Real-Hero Foundation",
        icon: "🤝",
    },
    {
        title: "Health Check Package",
        description: "Full health checkup package including sugar, BP, and cholesterol tests at partner labs.",
        category: "healthcare",
        coinCost: 400,
        partner: "Real-Hero Diagnostic Partners",
        icon: "🏥",
    },
    {
        title: "Pharmacy Voucher ₹200",
        description: "Get a ₹200 discount at partnered pharmacies on medicines and health products.",
        category: "pharmacy",
        coinCost: 350,
        partner: "Generic Pharmacy Partners",
        icon: "💊",
    },
    {
        title: "Blood Group Profile Certificate",
        description: "Get an official blood group verification certificate useful for ID and medical records.",
        category: "healthcare",
        coinCost: 75,
        partner: "Real-Hero Platform",
        icon: "📋",
    },
];

async function ensureDefaultOptions() {
    const count = await RedemptionOption.countDocuments();
    if (count === 0) {
        await RedemptionOption.insertMany(DEFAULT_OPTIONS);
        console.log("[Redeem] Seeded default redemption options.");
    }
}

/**
 * GET /api/redeem/options
 * List all active redemption options
 */
export const getRedemptionOptions = async (req, res) => {
    try {
        await ensureDefaultOptions();
        const options = await RedemptionOption.find({ isActive: true }).sort({ coinCost: 1 });
        return res.json(options);
    } catch (e) {
        console.error("getRedemptionOptions error:", e);
        return res.status(500).json({ error: e.message });
    }
};

/**
 * POST /api/redeem/redeem
 * Body: { optionId }
 * Deducts coins and creates a Redemption record
 */

const NEXT_STEPS = {
    healthcare: "Our team will contact you within 48 hours with partner details to book your appointment. Simply show your redemption code when you visit.",
    pharmacy: "A voucher code valid at partnered pharmacies will be sent to you shortly. Present it at the counter to avail your discount.",
    emergency: "Your next submitted blood request will automatically be flagged as Priority and broadcast to 3x more donors. No further action is needed.",
    charity: "Your coins have been donated on your behalf to a blood donation awareness NGO. Thank you for your generosity!",
};

export const redeemOption = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { optionId } = req.body;
        if (!optionId) return res.status(400).json({ error: "optionId is required" });

        const option = await RedemptionOption.findById(optionId);
        if (!option || !option.isActive) {
            return res.status(404).json({ error: "Redemption option not found or inactive" });
        }

        // Check stock
        if (option.stock !== null && option.stock <= 0) {
            return res.status(400).json({ error: "This reward is out of stock" });
        }

        // Check user coin balance
        const currentUser = await User.findById(user._id);
        if ((currentUser.coins || 0) < option.coinCost) {
            return res.status(400).json({
                error: `Insufficient coins. You need ${option.coinCost} coins but have ${currentUser.coins || 0}.`
            });
        }

        // Deduct coins and increment redeemedCoins
        currentUser.coins -= option.coinCost;
        currentUser.redeemedCoins = (currentUser.redeemedCoins || 0) + option.coinCost;
        await currentUser.save();

        // Decrement stock if limited
        if (option.stock !== null) {
            option.stock -= 1;
        }
        option.redemptionCount += 1;
        await option.save();

        // Create Redemption record
        const redemption = await Redemption.create({
            userId: user._id,
            optionId: option._id,
            coinsSpent: option.coinCost,
            optionTitle: option.title,
            optionCategory: option.category,
            optionPartner: option.partner,
        });

        // Redemption stays as 'pending' until we have real partners onboarded.
        // No email is sent at this stage — coins are reserved and the user
        // can see the pending status in their History tab.
        console.log(`[Redeem] Pending redemption ${redemption.redemptionCode} for user ${currentUser.email} — "${option.title}" (${option.category})`);

        return res.status(201).json({
            message: "Redeemed successfully!",
            redemptionCode: redemption.redemptionCode,
            coinsSpent: option.coinCost,
            remainingCoins: currentUser.coins,
            redemption,
        });
    } catch (e) {
        console.error("redeemOption error:", e);
        return res.status(500).json({ error: e.message });
    }
};

/**
 * GET /api/redeem/history
 * Returns user's full redemption history
 */
export const getRedemptionHistory = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const history = await Redemption.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .populate("optionId", "title icon category coinCost partner");

        return res.json(history);
    } catch (e) {
        console.error("getRedemptionHistory error:", e);
        return res.status(500).json({ error: e.message });
    }
};
