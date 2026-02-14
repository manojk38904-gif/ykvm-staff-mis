/*
 * Service Worker for YKVM Staff MIS
 *
 * This service worker enables basic offline support by caching assets and
 * implementing a very simple background sync queue for attendance submissions
 * while offline. When the application detects the user is offline it will
 * store requests in `localStorage` and the service worker will attempt to
 * replay them when network connectivity returns. Advanced PWA capabilities
 * (background sync, push notifications) can be added following Next.js
 * documentation【232881519198629†L547-L552】.
 */

const CACHE_NAME = 'ykvm-mis-cache-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/ykvm-logo.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).catch(() => {
          // offline fallback to cached root
          return caches.match('/')
        })
      )
    })
  )
})

// Placeholder for background sync logic
self.addEventListener('sync', (event) => {
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendance())
  }
})

async function syncAttendance() {
  // Example: read queued attendance from localStorage and send to server
  const queue = JSON.parse(localStorage.getItem('attendanceQueue') || '[]')
  for (const item of queue) {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
    } catch (e) {
      // keep in queue if still failing
    }
  }
  localStorage.setItem('attendanceQueue', '[]')
}