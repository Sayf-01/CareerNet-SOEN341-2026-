// Matches the backend's NotificationItem / NotificationList (LA-7).
export type NotificationType =
  | "application_received"
  | "status_changed"
  | "interview_invited"
  | "interview_reminder";

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
  application_id: number | null;
  interview_at: string | null;
}

export interface NotificationList {
  items: AppNotification[];
  unread_count: number;
}
