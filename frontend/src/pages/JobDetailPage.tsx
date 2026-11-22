
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getJob } from "../api/jobs";
import type { JobDetail } from "../types/job";

import ApplyDialog from "../components/ApplyDialog";

function JobDetailPage() {
  // Read the job ID from the URL: /jobs/:id
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadJob() {
      setIsLoading(true);
      setError(null);
      setJob(null);

      const jobId = Number(id);

      // Reject invalid IDs such as /jobs/abc.
      if (
        !id ||
        !Number.isSafeInteger(jobId) ||
        jobId <= 0
      ) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getJob(jobId);

        if (!cancelled) {
          setJob(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load job details."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadJob();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const containerStyle = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 24px",
  };

  const backLinkStyle = {
    color: "#0969da",
    textDecoration: "none",
    fontWeight: 600,
  };

  if (isLoading) {
    return (
      <main style={containerStyle}>
        <p role="status">Loading job details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={containerStyle}>
        <h1>Unable to load job</h1>

        <p role="alert" style={{ color: "#b42318" }}>
          {error}
        </p>

        <Link to="/jobs" style={backLinkStyle}>
          Back to Jobs
        </Link>
      </main>
    );
  }

  if (!job) {
    return (
      <main style={containerStyle}>
        <h1>Job not found</h1>

        <p>
          The job you are looking for does not exist.
        </p>

        <Link to="/jobs" style={backLinkStyle}>
          Back to Jobs
        </Link>
      </main>
    );
  }

  const formattedDate = new Date(
    job.posted_at
  ).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isClosed = job.status !== "open";

  return (
    <main style={containerStyle}>
      <Link to="/jobs" style={backLinkStyle}>
        ← Back to Jobs
      </Link>

      <article
        style={{
          border: "1px solid #d0d7de",
          borderRadius: "8px",
          padding: "28px",
          marginTop: "24px",
          backgroundColor: "#ffffff",
          color: "#24292f",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            {job.title}
          </h1>

          <span
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              fontWeight: 600,
              backgroundColor: isClosed
                ? "#fef3f2"
                : "#dcfce7",
              color: isClosed
                ? "#b42318"
                : "#166534",
            }}
          >
            {isClosed ? "Closed" : "Open"}
          </span>
        </div>

        <h2
          style={{
            fontSize: "19px",
            marginBottom: "20px",
          }}
        >
          {job.company}
        </h2>

        <p>
          <strong>Location:</strong> {job.location}
        </p>

        <p>
          <strong>Category:</strong> {job.category}
        </p>

        <p>
          <strong>Posted:</strong> {formattedDate}
        </p>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #d0d7de",
            margin: "24px 0",
          }}
        />

        <h2>Job Description</h2>

        <p
          style={{
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {job.description}
        </p>

        <div style={{ marginTop: "28px" }}>
          {isClosed ? (
            <div
              role="status"
              style={{
                padding: "16px",
                backgroundColor: "#fef3f2",
                color: "#b42318",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              This job is closed.
            </div>
          ) : (
            <div
              style={{
                padding: "16px",
                border: "1px dashed #8c959f",
                borderRadius: "6px",
                backgroundColor: "#f6f8fa",
              }}
            >
              <strong>Apply for this job</strong>

              <p style={{ marginBottom: 0 }}>
                The Apply Dialog will be connected
                after KR-3 is integrated.
              </p>

              <div style={{ marginTop: "16px" }}>
                <ApplyDialog
                  jobId={job.id}
                  jobTitle={job.title}
                />
              </div>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}

export default JobDetailPage;
