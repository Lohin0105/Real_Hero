import mongoose from "mongoose";

function isDnsSrvError(err) {
  return (
    err &&
    (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") &&
    (err.syscall === "querySrv" || String(err.message || "").includes("querySrv"))
  );
}

const connectDB = async (mongoUri = process.env.MONGO_URI) => {
  try {
    if (!mongoUri) throw new Error("MONGO_URI not set in .env");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully");
  } catch (err) {
    // If SRV DNS is blocked (common on restricted networks), allow a fallback URI.
    if (
      mongoUri?.startsWith("mongodb+srv://") &&
      isDnsSrvError(err) &&
      process.env.MONGO_URI_FALLBACK
    ) {
      console.warn(
        "MongoDB SRV lookup failed; retrying with MONGO_URI_FALLBACK..."
      );
      await mongoose.connect(process.env.MONGO_URI_FALLBACK, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("MongoDB connected successfully (fallback)");
      return;
    }

    console.error("DB connection error:", err);
    throw err;
  }
};

export default connectDB;
