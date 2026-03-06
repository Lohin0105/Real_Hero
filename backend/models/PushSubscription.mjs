import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
