import type { ActivityPoint } from "../types/analytics";

interface ActivityChartProps {
  points: ActivityPoint[];
}

// Bar chart drawn with plain SVG: one rectangle per day, height = that day's count.
function ActivityChart({ points }: ActivityChartProps) {
  const width = 600;
  const height = 160;
  const pad = 24;

  const total = points.reduce((sum, p) => sum + p.count, 0);
  // at least 1 so a chart with only zeros doesn't divide by zero
  const max = Math.max(1, ...points.map((p) => p.count));
  const barWidth = points.length > 0 ? (width - pad * 2) / points.length : 0;

  const first = points[0]?.date;
  const last = points[points.length - 1]?.date;

  return (
    <section aria-label="Applications over time">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Applications sent per day, ${total} in total`}
        style={{ width: "100%", height: "auto", color: "#0969da" }}
      >
        {points.map((p, i) => {
          const barHeight = (p.count / max) * (height - pad * 2);
          return (
            <rect
              key={p.date}
              x={pad + i * barWidth + 1}
              y={height - pad - barHeight}
              width={Math.max(barWidth - 2, 1)}
              height={barHeight}
              fill="currentColor"
            >
              <title>{`${p.date}: ${p.count}`}</title>
            </rect>
          );
        })}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#8c959f" />
      </svg>

      {first && last && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#57606a" }}>
          <span>{first}</span>
          <span>{last}</span>
        </div>
      )}

      {/* text version of the chart, so the number can be read without the picture */}
      <p>
        {total} {total === 1 ? "application" : "applications"} in the last {points.length} days
      </p>
    </section>
  );
}

export default ActivityChart;
