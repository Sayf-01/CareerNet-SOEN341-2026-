
import type { CSSProperties } from "react";
import type { ApplicationStatus } from "../types/application";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const statusStyles: Record<
  ApplicationStatus,
  CSSProperties
> = {
  Applied: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  "Under Review": {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  Interview: {
    backgroundColor: "#ede9fe",
    color: "#6d28d9",
  },
  Offered: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  Rejected: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const badgeStyle: CSSProperties = {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    ...statusStyles[status],
  };

  return (
    <span style={badgeStyle}>
      {status}
    </span>
  );
}

export default StatusBadge;
