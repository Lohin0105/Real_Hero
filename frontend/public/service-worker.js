/* eslint-disable no-restricted-globals */

// Service Worker for Blood Donation Push Notifications
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Blood Donation Alert',
            body: event.data.text()
        };
    }

    const title = data.title || '🩸 Blood Donation Alert';
    const options = {
        body: data.body || 'New request matching your blood group',
        icon: data.icon || '/logo192.png',
        badge: data.badge || '/logo192.png',
        data: data.data || {},
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        actions: [
            {
                action: 'view-request',
                title: 'View Details'
            },
            {
                action: 'close',
                title: 'Dismiss'
            }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    if (event.action === 'close') return;

    // Default action: open the app
    const urlToOpen = event.notification.data.url || '/donate';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
