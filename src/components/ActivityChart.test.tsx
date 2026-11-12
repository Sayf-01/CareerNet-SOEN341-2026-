import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ActivityChart from "./ActivityChart";

afterEach(cleanup);

const POINTS = [
  { date: "2026-11-10", count: 2 },
  { date: "2026-11-11", count: 0 },
  { date: "2026-11-12", count: 3 },
];

describe("ActivityChart", () => {
  it("draws one bar per day", () => {
    const { container } = render(<ActivityChart points={POINTS} />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("shows the total as text and in the chart label", () => {
    render(<ActivityChart points={POINTS} />);
    expect(screen.getByText("5 applications in the last 3 days")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Applications sent per day, 5 in total" })).toBeInTheDocument();
  });

  it("shows the first and last date", () => {
    render(<ActivityChart points={POINTS} />);
    expect(screen.getByText("2026-11-10")).toBeInTheDocument();
    expect(screen.getByText("2026-11-12")).toBeInTheDocument();
  });

  it("still renders when every day is zero", () => {
    const zeros = POINTS.map((p) => ({ ...p, count: 0 }));
    const { container } = render(<ActivityChart points={zeros} />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    expect(screen.getByText("0 applications in the last 3 days")).toBeInTheDocument();
  });
});
