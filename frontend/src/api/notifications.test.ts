import { afterEach, describe, expect, it, vi } from "vitest";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "./notifications";
import { apiFetch } from "./client";

vi.mock("./client");

afterEach(() => vi.resetAllMocks());

describe("notifications API", () => {
  it("calls the right endpoints", async () => {
    vi.mocked(apiFetch).mockResolvedValue({});

    await getNotifications();
    expect(apiFetch).toHaveBeenLastCalledWith("/notifications?unread_only=false");

    await getNotifications(true);
    expect(apiFetch).toHaveBeenLastCalledWith("/notifications?unread_only=true");

    await markNotificationRead(4);
    expect(apiFetch).toHaveBeenLastCalledWith("/notifications/4/read", { method: "POST" });

    await markAllNotificationsRead();
    expect(apiFetch).toHaveBeenLastCalledWith("/notifications/read-all", { method: "POST" });
  });
});
