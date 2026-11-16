import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NotificationBell from "./NotificationBell";
import { getNotifications, markNotificationRead } from "../api/notifications";
import type { AppNotification } from "../types/notification";

// keep the real notificationLink, fake only the API calls
vi.mock("../api/notifications", async (importOriginal) => {
  const real = await importOriginal<typeof import("../api/notifications")>();
  return { ...real, getNotifications: vi.fn(), markNotificationRead: vi.fn() };
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const real = await importOriginal<typeof import("react-router-dom")>();
  return { ...real, useNavigate: () => mockNavigate };
});

function note(id: number, extra: Partial<AppNotification> = {}): AppNotification {
  return {
    id, type: "status_changed", message: `Notification ${id}`, is_read: false,
    created_at: "2026-11-14T10:00:00Z", application_id: 1, interview_at: null, ...extra,
  };
}

function renderBell() {
  return render(<MemoryRouter><NotificationBell /></MemoryRouter>);
}

beforeEach(() => {
  vi.mocked(markNotificationRead).mockResolvedValue(note(1, { is_read: true }));
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.useRealTimers();
});

describe("NotificationBell", () => {
  it("shows the unread count", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ items: [note(1), note(2), note(3)], unread_count: 3 });
    renderBell();

    expect(await screen.findByLabelText("Notifications, 3 unread")).toBeInTheDocument();
    expect(screen.getByTestId("unread-badge")).toHaveTextContent("3");
  });

  it("hides the badge at 0 and shows 9+ above 9", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ items: [], unread_count: 0 });
    renderBell();
    await screen.findByLabelText("Notifications, 0 unread");
    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument();
    cleanup();

    vi.mocked(getNotifications).mockResolvedValue({ items: [], unread_count: 12 });
    renderBell();
    expect(await screen.findByTestId("unread-badge")).toHaveTextContent("9+");
  });

  it("marks a notification read and goes to the right page", async () => {
    vi.mocked(getNotifications).mockResolvedValue({
      items: [note(7), note(8, { type: "application_received" })], unread_count: 2,
    });
    renderBell();
    fireEvent.click(await screen.findByLabelText("Notifications, 2 unread"));

    fireEvent.click(screen.getByText("Notification 7"));
    expect(await screen.findByLabelText("Notifications, 1 unread")).toBeInTheDocument();
    expect(markNotificationRead).toHaveBeenCalledWith(7);
    expect(mockNavigate).toHaveBeenCalledWith("/applications");

    fireEvent.click(screen.getByLabelText("Notifications, 1 unread"));
    fireEvent.click(screen.getByText("Notification 8"));
    expect(await screen.findByLabelText("Notifications, 0 unread")).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenLastCalledWith("/recruiter");
  });

  it("only shows the 5 newest and a View all link", async () => {
    const items = [1, 2, 3, 4, 5, 6].map((id) => note(id));
    vi.mocked(getNotifications).mockResolvedValue({ items, unread_count: 6 });
    renderBell();
    fireEvent.click(await screen.findByLabelText("Notifications, 6 unread"));

    expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    expect(screen.queryByText("Notification 6")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/notifications");
  });

  it("refreshes the count every 60 seconds and keeps it if a refresh fails", async () => {
    vi.useFakeTimers();
    vi.mocked(getNotifications).mockResolvedValueOnce({ items: [note(1)], unread_count: 1 });
    renderBell();
    await act(async () => {});
    expect(screen.getByLabelText("Notifications, 1 unread")).toBeInTheDocument();

    vi.mocked(getNotifications).mockResolvedValueOnce({ items: [note(1), note(2)], unread_count: 2 });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(screen.getByLabelText("Notifications, 2 unread")).toBeInTheDocument();

    vi.mocked(getNotifications).mockRejectedValueOnce(new Error("offline"));
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(screen.getByLabelText("Notifications, 2 unread")).toBeInTheDocument();
    expect(getNotifications).toHaveBeenCalledTimes(3);
  });
});
