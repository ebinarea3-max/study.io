/**
 * study.io Service Worker
 * Handles background timer tracking and push notifications.
 *
 * Messages received from page:
 *   { type: 'TIMER_START',  startTime: <ms epoch>, elapsed: <s>, subject: <string>, mode: <string>, target: <seconds|null>, hidden: <bool> }
 *   { type: 'TIMER_PAUSE',  elapsed: <seconds> }
 *   { type: 'TIMER_RESUME', startTime: <ms epoch>, elapsed: <seconds>, hidden: <bool> }
 *   { type: 'TIMER_STOP' }
 *   { type: 'TIMER_TICK',   elapsed: <seconds>, subject: <string> }
 *   { type: 'APP_HIDDEN' }
 *   { type: 'APP_VISIBLE' }
 */

const NOTIF_TAG_TIMER = 'studyio-timer-running';
const ICON            = '/icon-192.png';
const BADGE           = '/icon-192.png';

let timerState = {
  running: false,
  startTime: null,
  elapsed: 0,
  subject: '',
  mode: 'stopwatch',
  target: null,
};

let notifInterval = null;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return h + 'h ' + String(m).padStart(2, '0') + 'm';
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function getLiveElapsed() {
  if (!timerState.running || timerState.startTime === null) return timerState.elapsed;
  return timerState.elapsed + Math.floor((Date.now() - timerState.startTime) / 1000);
}

async function showTimerNotification() {
  try {
    const elapsed = getLiveElapsed();
    const subject = timerState.subject || 'Study Session';
    let title, body;

    if (timerState.mode === 'countdown' && timerState.target) {
      const remaining = Math.max(0, timerState.target - elapsed);
      title = '\u23f1 ' + formatTime(remaining) + ' remaining';
      body  = 'Studying: ' + subject;
    } else if (timerState.mode === 'pomodoro' && timerState.target) {
      const remaining = Math.max(0, timerState.target - elapsed);
      title = '\ud83c\udf45 ' + formatTime(remaining) + ' remaining';
      body  = 'Pomodoro \u2022 ' + subject;
    } else {
      title = '\ud83d\udcda ' + formatTime(elapsed) + ' elapsed';
      body  = 'Studying: ' + subject;
    }

    await self.registration.showNotification(title, {
      body,
      icon: ICON,
      badge: BADGE,
      tag: NOTIF_TAG_TIMER,
      renotify: true,
      requireInteraction: false,
      silent: true,
      actions: [
        { action: 'open',  title: 'Open App' },
        { action: 'pause', title: 'Pause' },
      ],
      data: { url: '/' },
    });
  } catch (e) {
    console.warn('[SW] showTimerNotification error:', e);
  }
}

async function clearTimerNotification() {
  try {
    const ns = await self.registration.getNotifications({ tag: NOTIF_TAG_TIMER });
    ns.forEach(function(n) { n.close(); });
  } catch (e) {}
}

function startNotifLoop() {
  stopNotifLoop();
  showTimerNotification();
  notifInterval = setInterval(function() {
    if (timerState.running) {
      showTimerNotification();
    } else {
      stopNotifLoop();
    }
  }, 60000);
}

function stopNotifLoop() {
  if (notifInterval !== null) {
    clearInterval(notifInterval);
    notifInterval = null;
  }
}

self.addEventListener('message', function(event) {
  var data = event.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'TIMER_START':
      timerState = {
        running: true,
        startTime: data.startTime || Date.now(),
        elapsed: data.elapsed || 0,
        subject: data.subject || '',
        mode: data.mode || 'stopwatch',
        target: data.target || null,
      };
      if (data.hidden) startNotifLoop();
      break;

    case 'TIMER_RESUME':
      timerState.running = true;
      timerState.startTime = data.startTime || Date.now();
      if (data.elapsed !== undefined) timerState.elapsed = data.elapsed;
      if (data.subject) timerState.subject = data.subject;
      if (data.hidden) startNotifLoop();
      break;

    case 'TIMER_PAUSE':
      timerState.running = false;
      timerState.startTime = null;
      if (data.elapsed !== undefined) timerState.elapsed = data.elapsed;
      stopNotifLoop();
      clearTimerNotification();
      break;

    case 'TIMER_STOP':
      timerState.running = false;
      timerState.startTime = null;
      timerState.elapsed = 0;
      stopNotifLoop();
      clearTimerNotification();
      break;

    case 'TIMER_TICK':
      if (data.subject) timerState.subject = data.subject;
      if (data.startTime !== undefined) timerState.startTime = data.startTime;
      if (data.elapsed !== undefined) timerState.elapsed = data.elapsed;
      break;

    case 'APP_HIDDEN':
      if (timerState.running) startNotifLoop();
      break;

    case 'APP_VISIBLE':
      stopNotifLoop();
      clearTimerNotification();
      break;

    case 'PING':
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ type: 'PONG' });
      break;
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'pause') {
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      clients.forEach(function(c) { c.postMessage({ type: 'SW_PAUSE_TIMER' }); });
    });
    return;
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      var found = clients.find(function(c) { return c.url.indexOf(self.registration.scope) !== -1; });
      if (found) return found.focus();
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(self.clients.claim()); });
