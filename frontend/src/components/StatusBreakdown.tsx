import StatusBadge from "./StatusBadge";
import type { ApplicationStatus } from "../types/application";

interface StatusBreakdownProps {
  total: number;
  by_status: Record<ApplicationStatus, number>;
}

// One row per status: the badge, the count, and a bar showing its share of the total.
// The status names come from the backend answer, so they aren't typed again here.
function StatusBreakdown({ total, by_status }: StatusBreakdownProps) {
  const rows = Object.entries(by_status) as [ApplicationStatus, number][];

  return (
    <section aria-label="Applications by status">
      <p style={{ fontWeight: 600 }}>Total applications: {total}</p>

      {rows.map(([status, count]) => {
        // no division by zero when there are no applications yet
        const percent = total > 0 ? (count / total) * 100 : 0;

        return (
          <div
            key={status}
            data-testid={`status-row-${status}`}
            style={{
              display: "grid",
              gridTemplateColumns: "130px 40px 1fr",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <StatusBadge status={status} />
            <strong>{count}</strong>
            <div style={{ height: "10px", backgroundColor: "#eaeef2", borderRadius: "5px" }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  backgroundColor: "#0969da",
                  borderRadius: "5px",
                }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default StatusBreakdown;
