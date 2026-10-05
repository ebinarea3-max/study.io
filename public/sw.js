/**
 * study.io Service Worker
 * Handles background timer tracking and persistent (non-dismissable) notifications.
 *
 * Messages received from page:
 *   { type: 'TIMER_START',  startTime: <ms epoch anchor>, subject: <string>, mode: <string>, target: <seconds|null>, hidden: <bool> }
 *   { type: 'TIMER_PAUSE',  elapsed: <seconds> }
 *   { type: 'TIMER_RESUME', startTime: <ms epoch anchor>, subject: <string>, hidden: <bool> }
 *   { type: 'TIMER_STOP' }
 *   { type: 'TIMER_TICK',   startTime: <ms epoch anchor>, elapsed: <seconds>, subject: <string> }
 *   { type: 'APP_HIDDEN' }
 *   { type: 'APP_VISIBLE' }
 *
 * startTime is the epoch anchor: Date.now() - elapsedSeconds * 1000
 * So live elapsed = Math.floor((Date.now() - startTime) / 1000)
 */

const NOTIF_TAG = 'studyio-timer-running';
const ICON      = '/icon-192.png';
const BADGE     = '/icon-192.png';

let state = {
  running:   false,
  startTime: null,   // epoch anchor in ms
  elapsed:   0,      // used only when paused
  subject:   '',
  mode:      'stopwatch',
  target:    null,
};

let notifInterval = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + 'h ' + pad(m) + 'm ' + pad(sec) + 's';
  return pad(m) + ':' + pad(sec);
}

function getLiveElapsed() {
  if (state.running && state.startTime !== null) {
    return Math.floor((Date.now() - state.startTime) / 1000);
  }
  return state.elapsed;
}

// ─── Notification ────────────────────────────────────────────────────────────

async function showNotif() {
  try {
    const elapsed = getLiveElapsed();
    const subject = state.subject || 'Study Session';
    let title, body;

    if ((state.mode === 'countdown' || state.mode === 'pomodoro') && state.target) {
      const remaining = Math.max(0, state.target - elapsed);
      const emoji = state.mode === 'pomodoro' ? '🍅' : '⏱';
      title = emoji + ' ' + formatTime(remaining) + ' remaining';
      body  = (state.mode === 'pomodoro' ? 'Pomodoro • ' : 'Countdown • ') + subject;
    } else {
      title = '📚 ' + formatTime(elapsed) + ' elapsed';
      body  = 'Studying: ' + subject;
    }

    await self.registration.showNotification(title, {
      body,
      icon:             ICON,
      badge:            BADGE,
      tag:              NOTIF_TAG,
      renotify:         true,
      // Non-dismissable: requires explicit interaction (won't auto-dismiss)
      requireInteraction: true,
      // sticky: true is a Chrome-specific hint to prevent swipe-dismiss
      sticky:           true,
      silent:           true,
      actions: [
        { action: 'open',  title: '📖 Open App' },
        { action: 'pause', title: '⏸ Pause' },
      ],
      data: { url: '/' },
    });
  } catch (e) {
    console.warn('[SW] showNotif error:', e);
  }
}

async function clearNotif() {
  try {
    const ns = await self.registration.getNotifications({ tag: NOTIF_TAG });
    ns.forEach(function(n) { n.close(); });
  } catch (e) {}
}

// ─── Interval loop — updates every second while running ─────────────────────

function startLoop() {
  stopLoop();
  showNotif(); // show immediately
  notifInterval = setInterval(function() {
    if (state.running) {
      showNotif();
    } else {
      stopLoop();
    }
  }, 1000); // update every second
}

function stopLoop() {
  if (notifInterval !== null) {
    clearInterval(notifInterval);
    notifInterval = null;
  }
}

// ─── Message handler ─────────────────────────────────────────────────────────

self.addEventListener('message', function(event) {
  var d = event.data;
  if (!d || !d.type) return;

  switch (d.type) {
    case 'TIMER_START':
      state = {
        running:   true,
        startTime: d.startTime || Date.now(),
        elapsed:   0,
        subject:   d.subject || '',
        mode:      d.mode || 'stopwatch',
        target:    d.target || null,
      };
      // Always start the notification loop when timer starts, regardless of visibility
      startLoop();
      break;

    case 'TIMER_RESUME':
      state.running   = true;
      state.startTime = d.startTime || Date.now();
      if (d.subject) state.subject = d.subject;
      // Always restart notification loop on resume
      startLoop();
      break;

    case 'TIMER_PAUSE':
      state.running   = false;
      state.startTime = null;
      if (d.elapsed !== undefined) state.elapsed = d.elapsed;
      stopLoop();
      // Show a static "paused" notification (still non-dismissable)
      (async function() {
        try {
          await self.registration.showNotification('⏸ Timer Paused — ' + formatTime(state.elapsed), {
            body:               'Studying: ' + (state.subject || 'Study Session'),
            icon:               ICON,
            badge:              BADGE,
            tag:                NOTIF_TAG,
            renotify:           true,
            requireInteraction: true,
            sticky:             true,
            silent:             true,
            actions: [
              { action: 'open',   title: '📖 Open App' },
              { action: 'resume', title: '▶ Resume' },
            ],
            data: { url: '/' },
          });
        } catch(e) {}
      })();
      break;

    case 'TIMER_STOP':
      state.running   = false;
      state.startTime = null;
      state.elapsed   = 0;
      stopLoop();
      clearNotif();
      break;

    case 'TIMER_TICK':
      // Keep state fresh from the page
      if (d.startTime !== undefined) state.startTime = d.startTime;
      if (d.subject) state.subject = d.subject;
      // Don't update elapsed here — we compute it from startTime
      break;

    case 'APP_HIDDEN':
      // App went to background — loop should already be running, ensure it is
      if (state.running && notifInterval === null) startLoop();
      break;

    case 'APP_VISIBLE':
      // App came back to foreground — keep notification running (user requested it stays)
      // We just continue the loop unchanged
      break;

    case 'PING':
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ type: 'PONG' });
      break;
  }
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'pause') {
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      clients.forEach(function(c) { c.postMessage({ type: 'SW_PAUSE_TIMER' }); });
    });
    return;
  }

  if (event.action === 'resume') {
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      clients.forEach(function(c) { c.postMessage({ type: 'SW_RESUME_TIMER' }); });
    });
    return;
  }

  // 'open' action or tap on notification body → focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      var found = clients.find(function(c) {
        return c.url.indexOf(self.registration.scope) !== -1;
      });
      if (found) return found.focus();
      return self.clients.openWindow('/');
    })
  );
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────

self.addEventListener('install',  function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(self.clients.claim()); });
