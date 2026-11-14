import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getApplicationActivity, getApplicationSummary } from "../api/analytics";
import { getMyApplications } from "../api/myApplications";
import ActivityChart from "../components/ActivityChart";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import StatusBreakdown from "../components/StatusBreakdown";
import { useAuth } from "../context/useAuth";
import type { ApplicationActivity, ApplicationSummary } from "../types/analytics";
import type { MyApplication } from "../types/application";

const cardStyle = {
  border: "1px solid #d0d7de",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  backgroundColor: "#ffffff",
};

function JobSeekerDashboard() {
  const [summary, setSummary] = useState<ApplicationSummary | null>(null);
  const [activity, setActivity] = useState<ApplicationActivity | null>(null);
  const [latest, setLatest] = useState<MyApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // the three requests don't depend on each other, so send them together
        const [summaryData, activityData, applications] = await Promise.all([
          getApplicationSummary(),
          getApplicationActivity(30),
          getMyApplications(),
        ]);
        if (cancelled) return;

        setSummary(summaryData);
        setActivity(activityData);
        // newest first, keep 5
        const newest = [...applications]
          .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
          .slice(0, 5);
        setLatest(newest);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <Alert type="error" message={error} />;
  if (!summary || !activity) return null;

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Applications by status</h2>
        <StatusBreakdown total={summary.total} by_status={summary.by_status} />
        {summary.total === 0 && (
          <p>
            You haven't applied to any jobs yet. <Link to="/jobs">Browse jobs</Link>
          </p>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Activity</h2>
        <ActivityChart points={activity.points} />
      </section>

      {latest.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Latest applications</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {latest.map((application) => (
              <li
                key={application.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: "1px solid #eaeef2",
                }}
              >
                <span>
                  <strong>{application.job_title}</strong> · {application.company}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <StatusBadge status={application.status} />
                  <span style={{ color: "#57606a", fontSize: "14px" }}>
                    {new Date(application.applied_at).toLocaleDateString("en-CA")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p>
            <Link to="/applications">See all applications</Link>
          </p>
        </section>
      )}
    </>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const isRecruiter = user?.role === "RECRUITER";

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>
      <h1>Dashboard</h1>

      {isRecruiter ? (
        // this dashboard is for job seekers; recruiters manage things on their own page
        <p>
          Your postings and applicants are on the <Link to="/recruiter">Recruiter Dashboard</Link>.
        </p>
      ) : (
        <JobSeekerDashboard />
      )}
    </main>
  );
}

export default DashboardPage;
