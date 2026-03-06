import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    image: { type: String, default: null }, // Optional Base64 image
    timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Conversation" },
    messages: [messageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp before saving
chatSessionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
