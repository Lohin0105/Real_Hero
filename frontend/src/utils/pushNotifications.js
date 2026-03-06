/**
 * Utility functions for Web Push Notifications
 */

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

/**
 * Converts VAPID public key from base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
}

/**
 * Subscribes the user to push notifications
 */
export async function subscribeUserToPush(userId) {
    try {
        if (!("serviceWorker" in navigator)) return;

        const registration = await navigator.serviceWorker.ready;

        // Check if subscription already exists
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Get public key from server
            const res = await fetch(`${API_BASE}/api/push/public-key`);
            const { publicKey } = await res.json();

            if (!publicKey) throw new Error("VAPID public key not found");

            // Subscribe user
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
        }

        // Send subscription to backend
        await fetch(`${API_BASE}/api/push/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                subscription,
                userId
            })
        });

        console.log("User subscribed to push notifications");
        return true;
    } catch (error) {
        console.error("Failed to subscribe to push:", error);
        return false;
    }
}
