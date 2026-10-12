import api from '../../lib/api';

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export async function getNotifications(params?: {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<NotificationsResponse>('/notifications', {
    params,
  });
  return response.data;
}

export async function markNotificationRead(id: string) {
  const response = await api.patch<{
    success: boolean;
    data: { notification: NotificationItem };
  }>(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch<{
    success: boolean;
    message: string;
  }>('/notifications/read-all');
  return response.data;
}

export async function deleteNotificationItem(id: string) {
  const response = await api.delete<{
    success: boolean;
    message: string;
  }>(`/notifications/${id}`);
  return response.data;
}
