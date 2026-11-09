
import { useEffect, useState } from "react";

import { getMyApplications } from "../api/myApplications";
import StatusBadge from "../components/StatusBadge";
import type { MyApplication } from "../types/application";

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MyApplicationsPage() {
  const [applications, setApplications] = useState<
    MyApplication[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMyApplications();

        if (!cancelled) {
          // Show most recently submitted applications first.
          const sorted = [...data].sort((a, b) =>
            b.applied_at.localeCompare(a.applied_at)
          );

          setApplications(sorted);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load your applications. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <section
        className="container"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        <h1>My Applications</h1>

        <p>
          Track the jobs you have applied for and view
          their current application status.
        </p>

        {isLoading ? (
          <p role="status">Loading your applications...</p>
        ) : error ? (
          <div role="alert" style={{ color: "#b42318" }}>
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div
            style={{
              marginTop: "24px",
              padding: "32px",
              border: "1px solid #d0d7de",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h2>No applications yet</h2>
            <p>
              Once you apply for jobs, you will be able
              to track your applications here.
            </p>
          </div>
        ) : (
          <>
            <p style={{ marginTop: "24px" }}>
              <strong>
                Total Applications: {applications.length}
              </strong>
            </p>

            <div
              style={{
                overflowX: "auto",
                marginTop: "20px",
                border: "1px solid #d0d7de",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "750px",
                  color: "#24292f",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f6f8fa",
                      textAlign: "left",
                    }}
                  >
                    <th style={headerStyle}>Job Title</th>
                    <th style={headerStyle}>Company</th>
                    <th style={headerStyle}>Applied Date</th>
                    <th style={headerStyle}>Last Updated</th>
                    <th style={headerStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td style={cellStyle}>
                        <strong>
                          {application.job_title}
                        </strong>
                      </td>

                      <td style={cellStyle}>
                        {application.company}
                      </td>

                      <td style={cellStyle}>
                        {formatDate(application.applied_at)}
                      </td>

                      <td style={cellStyle}>
                        {formatDate(application.updated_at)}
                      </td>

                      <td style={cellStyle}>
                        <StatusBadge
                          status={application.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </section>
    </main>
  );
}

const headerStyle = {
  padding: "16px",
  borderBottom: "1px solid #d0d7de",
  fontSize: "14px",
};

const cellStyle = {
  padding: "16px",
  borderBottom: "1px solid #eaeef2",
  fontSize: "14px",
  verticalAlign: "middle" as const,
};

export default MyApplicationsPage;
