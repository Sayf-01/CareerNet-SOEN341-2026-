import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import StatusBreakdown from "./StatusBreakdown";

afterEach(cleanup);

describe("StatusBreakdown", () => {
  it("shows the five statuses with their counts", () => {
    render(
      <StatusBreakdown
        total={4}
        by_status={{ Applied: 2, "Under Review": 1, Interview: 1, Offered: 0, Rejected: 0 }}
      />,
    );

    expect(screen.getByText("Total applications: 4")).toBeInTheDocument();
    const expected = { Applied: "2", "Under Review": "1", Interview: "1", Offered: "0", Rejected: "0" };
    for (const [status, count] of Object.entries(expected)) {
      const row = screen.getByTestId(`status-row-${status}`);
      expect(within(row).getByText(status)).toBeInTheDocument();
      expect(within(row).getByText(count)).toBeInTheDocument();
    }
  });

  it("does not crash when there are no applications", () => {
    render(
      <StatusBreakdown
        total={0}
        by_status={{ Applied: 0, "Under Review": 0, Interview: 0, Offered: 0, Rejected: 0 }}
      />,
    );

    expect(screen.getByText("Total applications: 0")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(5);
  });
});
