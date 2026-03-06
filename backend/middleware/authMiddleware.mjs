import jwt from "jsonwebtoken";
import User from "../models/User.mjs";

/**
 * Middleware to authenticate requests using custom JWT tokens.
 * Attaches the user object to req.user.
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or invalid" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify as custom JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        const user = await User.findById(decoded.id);
        if (user) {
            req.user = user;
            return next();
        }
        return res.status(401).json({ message: "User not found" });
    } catch (error) {
        console.error("Auth Middleware Error:", error?.message || error);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
