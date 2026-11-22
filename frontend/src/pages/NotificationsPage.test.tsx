import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import NotificationsPage from "./NotificationsPage";
import { getNotifications, markAllNotificationsRead } from "../api/notifications";
import type { AppNotification } from "../types/notification";

vi.mock("../api/notifications");

const INVITE: AppNotification = {
  id: 1, type: "interview_invited", message: "You are invited to an interview", is_read: false,
  created_at: "2026-11-14T10:00:00Z", application_id: 4, interview_at: "2026-11-20T15:00:00Z",
};
const OLD: AppNotification = {
  id: 2, type: "status_changed", message: "Your application is under review", is_read: true,
  created_at: "2026-11-10T10:00:00Z", application_id: 3, interview_at: null,
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("NotificationsPage", () => {
  it("lists notifications, highlights unread ones and shows the interview date", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ items: [INVITE, OLD], unread_count: 1 });
    render(<NotificationsPage />);

    expect(await screen.findByText("You are invited to an interview")).toBeInTheDocument();
    expect(screen.getByText("Your application is under review")).toBeInTheDocument();
    expect(screen.getByText(`Interview: ${new Date(INVITE.interview_at!).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByTestId("notification-1")).toHaveAttribute("data-unread", "true");
    expect(screen.getByTestId("notification-2")).toHaveAttribute("data-unread", "false");
  });

  it("Mark all as read calls the API and updates the list", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ items: [INVITE, OLD], unread_count: 1 });
    vi.mocked(markAllNotificationsRead).mockResolvedValue({ updated: 1 });
    render(<NotificationsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Mark all as read" }));

    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: "Mark all as read" })).toBeDisabled();
    expect(screen.getByTestId("notification-1")).toHaveAttribute("data-unread", "false");
  });

  it("shows the empty state", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ items: [], unread_count: 0 });
    render(<NotificationsPage />);

    expect(await screen.findByText("No notifications yet")).toBeInTheDocument();
  });

  it("shows the error when loading fails", async () => {
    vi.mocked(getNotifications).mockRejectedValue(new Error("Not authenticated"));
    render(<NotificationsPage />);

    expect(await screen.findByText("Not authenticated")).toBeInTheDocument();
  });
});
