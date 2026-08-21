// Pure, framework-free helpers shared by the domain contexts so their state
// logic can be unit-tested in isolation (see contextHelpers.test.js).

/**
 * Derive the approved and pending course id lists from the raw purchase
 * records returned by GET /purchases/user/:userId.
 */
export function derivePurchaseState(records) {
  const list = Array.isArray(records) ? records : [];
  return {
    approved: list
      .filter((p) => p.status === 'APPROVED')
      .map((p) => p.course?.id)
      .filter(Boolean),
    pending: list
      .filter((p) => p.status === 'PENDING')
      .map((p) => p.course?.id)
      .filter(Boolean),
  };
}

/**
 * Number of unread notifications in a list fetched from GET /notifications.
 */
export function unreadCountOf(list) {
  return (Array.isArray(list) ? list : []).filter((n) => !n.read).length;
}

/**
 * Mark a single notification as read, returning a new list.
 */
export function applyNotificationRead(list, notificationId) {
  return (Array.isArray(list) ? list : []).map((n) =>
    n.id === notificationId ? { ...n, read: true } : n,
  );
}

/**
 * Remove a notification, returning a new list.
 */
export function applyNotificationDelete(list, notificationId) {
  return (Array.isArray(list) ? list : []).filter((n) => n.id !== notificationId);
}

/**
 * Extract course ids from the records returned by GET /favorites.
 */
export function favoriteIdsFromRecords(records) {
  return (Array.isArray(records) ? records : [])
    .map((r) => r.course?.id ?? r.courseId)
    .filter(Boolean);
}

/**
 * Pure toggle over a list of course ids (used to update state only after the
 * backend confirms the mutation).
 */
export function toggleFavoritesState(ids, courseId) {
  const list = Array.isArray(ids) ? ids : [];
  return list.includes(courseId)
    ? list.filter((id) => id !== courseId)
    : [...list, courseId];
}

/**
 * Read-only sessionStorage fallback used while the backend rollout is in
 * progress (see task 6.1: remove after staging validation). Returns the stored
 * favorite course ids for the user, or null when nothing usable is stored.
 * The storage object is injected so the helper can be unit-tested without a
 * browser environment.
 */
export function readFavoritesFromSession(storage, userId) {
  if (!storage || !userId) return null;
  try {
    const stored = JSON.parse(storage.getItem(`costura_data_${userId}`) || '{}');
    return Array.isArray(stored.favorites) ? stored.favorites : null;
  } catch {
    return null;
  }
}

/**
 * Returns an error message when the user cannot toggle favorites, or null when
 * the toggle is allowed.
 */
export function assertAuthenticated(user) {
  return user ? null : 'Debes iniciar sesión para guardar favoritos.';
}