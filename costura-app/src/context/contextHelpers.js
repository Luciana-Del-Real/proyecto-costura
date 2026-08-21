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