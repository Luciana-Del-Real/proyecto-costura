# PWA Installability and Subscription Lifecycle Specification

## Purpose

Makes the app installable as a PWA (iOS Safari 16.4+ home screen included) and manages the client-side Web Push subscription lifecycle: service worker registration, consent from a user gesture, subscribe/upsert against the backend, and best-effort unsubscribe on logout.

## Requirements

### Requirement: PWA Manifest and Icons

The system MUST ship a `manifest.json` (name, short_name, icons, start_url, display standalone, theme_color) linked from `index.html`, with icons that satisfy iOS home-screen installability.

#### Scenario: Manifest served and linked

- GIVEN the deployed frontend
- WHEN the browser fetches the manifest and icons
- THEN they resolve successfully and add-to-home-screen is enabled

### Requirement: Service Worker Registration

The system MUST register a service worker (`sw.js`) on app boot (from `main.jsx` or the PushProvider) that handles `push` and `notificationclick` events.

#### Scenario: Push while app closed

- GIVEN a registered service worker and a push received with the app closed
- WHEN the push event fires
- THEN a notification is shown with the payload title and message

#### Scenario: Push while app open

- GIVEN a push received while the app is open
- WHEN the push event fires
- THEN a notification is shown and clicking it focuses the existing window

#### Scenario: Notification click opens target

- GIVEN a displayed push notification with `data.url`
- WHEN the user clicks it
- THEN the app window opens or focuses at the URL, prepending the app origin when the link is app-relative

### Requirement: Gesture-Wired Consent and Subscribe

The system MUST request notification permission only from a user gesture — a post-login consent banner, never silently on boot — and MUST subscribe only for an authenticated user, POSTing the subscription to the backend.

#### Scenario: Logged-in user consents

- GIVEN a logged-in user whose permission is not yet granted
- WHEN the user accepts the consent banner (a click gesture)
- THEN PushManager.subscribe runs with the public VAPID key and the result is POSTed to the backend

#### Scenario: Not logged in

- GIVEN no authenticated user on boot
- WHEN the app loads
- THEN no permission prompt or subscription attempt occurs

#### Scenario: Permission denied

- GIVEN the user dismisses or denies permission
- WHEN the banner is declined
- THEN no subscription is created and the app continues normally

### Requirement: Login Upsert Reconciliation

The system MUST upsert the current device subscription against the backend when a logged-in user gains or restores a subscription, covering stale endpoints left by raced logouts.

#### Scenario: Stale endpoint healed on next login

- GIVEN a stale backend subscription for this device after a raced logout
- WHEN the user logs in and the device resubscribes
- THEN the backend upserts by endpoint and the stale row is replaced

### Requirement: Best-Effort Logout Unsubscribe

The system MUST attempt to DELETE the device subscription on logout; failure MUST NOT block logout and MAY be healed by the login upsert.

#### Scenario: Logout DELETE races session clear

- GIVEN the user logs out while the DELETE request is in flight
- WHEN sessionStorage is cleared synchronously
- THEN the request completes best-effort, logout is unaffected, and any orphan is healed on next login

### Requirement: Frontend VAPID Public Key

The system MUST load `VITE_VAPID_PUBLIC_KEY` from `.env.local` / `.env.production` and pass it as `applicationServerKey`. The VAPID private key MUST NOT appear in frontend configuration.

#### Scenario: Public key configured

- GIVEN `VITE_VAPID_PUBLIC_KEY` set in frontend env
- WHEN the app subscribes
- THEN the public key is used as `applicationServerKey`

### Requirement: Spanish Consent and Install UI Copy

The system MUST ship the consent banner and install-hint UI strings in Spanish (neutral register): banner title "Activa las notificaciones"; banner text "Recibe avisos de respuestas, compras y novedades incluso sin estar en la página."; accept button "Activar"; dismiss button "Ahora no"; install hint "Instala la aplicación en tu pantalla de inicio para recibir notificaciones.".

#### Scenario: Banner shows Spanish copy

- GIVEN a logged-in user eligible for push
- WHEN the consent banner renders
- THEN it shows the Spanish strings above

### Requirement: jsdom Test Constraints

Frontend tests MUST guard `navigator.serviceWorker` in smoke tests and MUST mock `PushManager` and `Notification` for push tests, since jsdom lacks them.

#### Scenario: Smoke test without service worker

- GIVEN a jsdom environment lacking navigator.serviceWorker
- WHEN a smoke test mounts the app
- THEN registration code is guarded and the test does not throw