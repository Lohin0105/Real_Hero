import crypto from "crypto";

/**
 * Generates a secure random 6-digit OTP as a string.
 */
export function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}
