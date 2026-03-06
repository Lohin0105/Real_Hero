// Script to check all users in MongoDB
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.mjs";

dotenv.config();

async function checkUsers() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("MONGO_URI not set in .env");
            process.exit(1);
        }

        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB\n");

        // Get collection stats
        const stats = await User.collection.stats();
        console.log("📊 Collection Stats:");
        console.log(`   Total documents: ${stats.count}`);
        console.log(`   Total size: ${(stats.size / 1024).toFixed(2)} KB\n`);

        // Get all indexes
        const indexes = await User.collection.getIndexes();
        console.log("🔍 Indexes on User collection:");
        Object.keys(indexes).forEach((indexName) => {
            console.log(`   ${indexName}:`, JSON.stringify(indexes[indexName], null, 2));
        });
        console.log("");

        // Get all users
        const users = await User.find({}).lean();
        console.log(`👥 Found ${users.length} users:\n`);

        users.forEach((user, idx) => {
            console.log(`User ${idx + 1}:`);
            console.log(`   _id: ${user._id}`);
            console.log(`   uid: ${user.uid || 'N/A'}`);
            console.log(`   name: ${user.name || 'N/A'}`);
            console.log(`   email: ${user.email || 'N/A'}`);
            console.log(`   bloodGroup: ${user.bloodGroup || user.blood || 'N/A'}`);
            console.log(`   createdAt: ${user.createdAt}`);
            console.log("");
        });

        // Check for duplicate uids or emails
        const uids = users.map(u => u.uid).filter(Boolean);
        const emails = users.map(u => u.email).filter(Boolean);

        const duplicateUids = uids.filter((uid, index) => uids.indexOf(uid) !== index);
        const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);

        if (duplicateUids.length > 0) {
            console.log("⚠️  Duplicate UIDs found:", duplicateUids);
        }
        if (duplicateEmails.length > 0) {
            console.log("⚠️  Duplicate emails found:", duplicateEmails);
        }

        if (users.length === 0) {
            console.log("❌ No users found in the database!");
        } else if (users.length === 1) {
            console.log("⚠️  Only 1 user found. This might indicate an issue if multiple users have registered.");
        } else {
            console.log(`✅ ${users.length} users successfully stored in the database.`);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

checkUsers();
