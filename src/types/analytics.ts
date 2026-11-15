// Shapes returned by the analytics endpoints (LA-4 and LA-5)

import type { ApplicationStatus } from "./application";

// GET /applications/me/summary
export interface ApplicationSummary {
  total: number;
  by_status: Record<ApplicationStatus, number>;
}

// one day in the activity chart
export interface ActivityPoint {
  date: string; // "YYYY-MM-DD"
  count: number;
}

// GET /applications/me/activity?days=30
export interface ApplicationActivity {
  days: number;
  points: ActivityPoint[];
}
