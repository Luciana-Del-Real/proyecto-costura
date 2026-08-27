// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../context/NotificationsContext', () => ({
  useNotifications: vi.fn(),
}));

import { useNotifications } from '../context/NotificationsContext';
import NotificationsInbox from './NotificationsInbox';

const notification = (id, overrides = {}) => ({
  id,
  title: `Título ${id}`,
  message: 'Mensaje',
  createdAt: '2024-01-01T10:00:00.000Z',
  read: false,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockContext = (overrides = {}) => {
  useNotifications.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    notificationsLoading: false,
    notificationsError: null,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    ...overrides,
  });
};

describe('NotificationsInbox', () => {
  it('shows the loading state', () => {
    mockContext({ notificationsLoading: true });
    render(<NotificationsInbox />);
    expect(screen.getByText('Cargando notificaciones...')).toBeTruthy();
  });

  it('shows the error state without the list', () => {
    mockContext({ notificationsError: 'boom' });
    render(<NotificationsInbox />);
    expect(screen.getByText(/No se pudieron cargar las notificaciones/)).toBeTruthy();
    expect(screen.queryByText('Eliminar')).toBeNull();
  });

  it('shows the empty state', () => {
    mockContext();
    render(<NotificationsInbox />);
    expect(screen.getByText('Todavía no tenés notificaciones.')).toBeTruthy();
  });

  it('lists notifications and marks one as read', () => {
    const markAsRead = vi.fn();
    mockContext({ notifications: [notification('n1'), notification('n2', { read: true })], unreadCount: 1, markAsRead });
    render(<NotificationsInbox />);

    expect(screen.getByText('Título n1')).toBeTruthy();
    expect(screen.getByText('Título n2')).toBeTruthy();

    fireEvent.click(screen.getByText('Marcar como leída'));
    expect(markAsRead).toHaveBeenCalledWith('n1');
    // Read notifications do not show the mark-read button.
    expect(screen.getAllByText('Marcar como leída')).toHaveLength(1);
  });

  it('marks all as read when there are unread notifications', () => {
    const markAllAsRead = vi.fn();
    mockContext({ notifications: [notification('n1')], unreadCount: 1, markAllAsRead });
    render(<NotificationsInbox />);
    fireEvent.click(screen.getByText('Marcar todas como leídas'));
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it('hides mark-all when everything is read', () => {
    mockContext({ notifications: [notification('n1', { read: true })], unreadCount: 0 });
    render(<NotificationsInbox />);
    expect(screen.queryByText('Marcar todas como leídas')).toBeNull();
  });

  it('deletes a notification', () => {
    const deleteNotification = vi.fn();
    mockContext({ notifications: [notification('n1')], unreadCount: 1, deleteNotification });
    render(<NotificationsInbox />);
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    expect(deleteNotification).toHaveBeenCalledWith('n1');
  });
});