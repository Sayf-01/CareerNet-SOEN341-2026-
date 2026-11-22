import { apiFetch } from "./client";
import type { AppNotification, NotificationList } from "../types/notification";

export async function getNotifications(unreadOnly = false): Promise<NotificationList> {
  return apiFetch<NotificationList>(`/notifications?unread_only=${unreadOnly}`);
}

export async function markNotificationRead(id: number): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>("/notifications/read-all", { method: "POST" });
}

// Where clicking a notification should take the user.
export function notificationLink(notification: AppNotification): string {
  return notification.type === "application_received" ? "/recruiter" : "/applications";
}
