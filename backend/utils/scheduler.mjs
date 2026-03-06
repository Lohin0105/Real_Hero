import Request from "../models/Request.mjs";
import DonorResponse from "../models/DonorResponse.mjs";
import User from "../models/User.mjs";
import mongoose from "mongoose";
import { sendMail } from "./emailNotifier.mjs";

export const initScheduler = () => {
    console.log("Scheduler initialized: Running every 5 minutes...");

    // Run immediately on startup
    checkTimeouts();
    cleanupOldRequests();
    checkWatchers();

    // Then every 5 minutes
    setInterval(() => {
        checkTimeouts();
        cleanupOldRequests();
        checkWatchers();
    }, 5 * 60 * 1000);
};

const checkTimeouts = async () => {
    try {
        if (mongoose.connection.readyState !== 1) return;
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        // Find requests where Primary assigned > 2 hours ago and NOT arrived
        const timedOutRequests = await Request.find({
            status: 'primary_assigned',
            'primaryDonor.acceptedAt': { $lt: twoHoursAgo },
            'primaryDonor.arrived': false
        });

        if (timedOutRequests.length > 0) {
            console.log(`Scheduler: Found ${timedOutRequests.length} timed-out requests.`);

            for (const req of timedOutRequests) {
                await handleTimeout(req);
            }
        }
    } catch (e) {
        console.error("Scheduler: checkTimeouts error", e);
    }
};

const handleTimeout = async (request) => {
    try {
        console.log(`Handling timeout for request ${request._id}`);

        // 1. Notify the failed Primary
        if (request.primaryDonor?.donorId) {
            const failedPrimary = await User.findById(request.primaryDonor.donorId);
            if (failedPrimary?.email) {
                sendMail({
                    to: failedPrimary.email,
                    subject: "Donation Time Limit Exceeded",
                    html: `<p>Hi ${failedPrimary.name},</p><p>Your 2-hour window to confirm arrival for the blood request at <b>${request.hospital}</b> has expired.</p><p>We have assigned this request to a backup donor. Thank you for your willingness to help.</p>`
                }).catch(console.error);
            }

            // Update DonorResponse for failed primary
            await DonorResponse.updateOne(
                { requestId: request._id, donorId: request.primaryDonor.donorId },
                { $set: { status: 'failed' } }
            );
        }

        // 2. Promote Backup if available
        // Find the first backup who hasn't failed/cancelled
        // We need to look at the backupDonors array in the Request or DonorResponse collection
        // The Request model has backupDonors array.

        // Sort backups by acceptedAt (FIFO)
        const backups = request.backupDonors || [];
        const nextBackup = backups.find(b => !b.promoted); // simplistic check

        if (nextBackup) {
            console.log(`Promoting backup donor ${nextBackup.donorId}`);

            // Update Request
            request.primaryDonor = {
                donorId: nextBackup.donorId,
                acceptedAt: new Date(),
                confirmedAt: null,
                arrived: false
            };

            // Mark this backup as promoted in the array
            // Note: Mongoose array update might be tricky, simpler to map
            request.backupDonors = request.backupDonors.map(b =>
                b.donorId.toString() === nextBackup.donorId.toString() ? { ...b, promoted: true } : b
            );

            // Update DonorResponse for new Primary
            await DonorResponse.updateOne(
                { requestId: request._id, donorId: nextBackup.donorId },
                { $set: { role: 'primary', status: 'promoted' } }
            );

            // Notify new Primary
            const newPrimaryUser = await User.findById(nextBackup.donorId);
            if (newPrimaryUser?.email) {
                sendMail({
                    to: newPrimaryUser.email,
                    subject: "URGENT: You are now the Primary Donor!",
                    html: `<p>Hi ${newPrimaryUser.name},</p><p>The previous donor could not make it. <b>You are now the Primary Donor</b> for the request at ${request.hospital}.</p><p>Please proceed to the hospital immediately. You have 2 hours.</p>`
                }).catch(console.error);
            }

        } else {
            // No backup available -> Re-open request
            console.log("No backup available. Re-opening request.");
            request.status = 'open';
            request.primaryDonor = null;
        }

        await request.save();

    } catch (e) {
        console.error(`Failed to handle timeout for req ${request._id}`, e);
    }
};

const cleanupOldRequests = async () => {
    try {
        if (mongoose.connection.readyState !== 1) return;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const res = await Request.deleteMany({ createdAt: { $lt: sevenDaysAgo } });
        if (res.deletedCount > 0) {
            console.log(`Scheduler: Cleaned up ${res.deletedCount} old requests.`);
        }
    } catch (e) {
        console.error("Scheduler: cleanupOldRequests error", e);
    }
};

const checkWatchers = async () => {
    try {
        if (mongoose.connection.readyState !== 1) return;
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        // Find open requests created > 6 hours ago with unnotified watchers
        const openRequests = await Request.find({
            status: 'open',
            createdAt: { $lt: sixHoursAgo },
            'watchers.notified': false
        });

        if (openRequests.length > 0) {
            console.log(`Scheduler: Found ${openRequests.length} requests older than 6h with unnotified watchers.`);

            for (const req of openRequests) {
                let notifiedCount = 0;

                for (const watcher of req.watchers) {
                    if (!watcher.notified) {
                        try {
                            if (watcher.email) {
                                await sendMail({
                                    to: watcher.email,
                                    subject: "Update: The Blood Request Still Needs a Donor",
                                    html: `<div>
                                           <p>Hi ${watcher.name},</p>
                                           <p>You previously tried to help with a blood request at <strong>${req.hospital}</strong>, but were in your cooldown period.</p>
                                           <p>It has been 6 hours and no donor has accepted the request yet. If you are feeling healthy and believe it's safe for you to donate now, please consider reaching out to them.</p>
                                           <p>Log in to the app to see the request and offer your help.</p>
                                           </div>`
                                });
                            }
                            watcher.notified = true;
                            notifiedCount++;
                        } catch (err) {
                            console.error(`Failed to email watcher ${watcher.email} for req ${req._id}:`, err);
                        }
                    }
                }

                if (notifiedCount > 0) {
                    req.watcherNotifiedAt = new Date();
                    await req.save();
                    console.log(`Scheduler: Notified ${notifiedCount} watchers for request ${req._id}`);
                }
            }
        }
    } catch (e) {
        console.error("Scheduler: checkWatchers error", e);
    }
};
