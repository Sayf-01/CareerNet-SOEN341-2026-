import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { getRecommendations } from "../api/recommendations";
import { useAuth } from "../context/useAuth";
import type {
  JobRecommendation,
  RecommendationList,
  RecommendationMode,
} from "../types/recommendation";
import Alert from "./Alert";

// What went wrong, so each case gets its own message
type Problem =
  | { kind: "no-profile" } // 409
  | { kind: "limit" } // 429
  | { kind: "error"; message: string }; // anything else

const cardStyle = {
  border: "1px solid #d0d7de",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  backgroundColor: "#ffffff",
};

const smallButton = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid #d0d7de",
  backgroundColor: "#f6f8fa",
  fontWeight: 600,
  cursor: "pointer",
};

function toProblem(err: unknown): Problem {
  if (err instanceof ApiError && err.status === 409) return { kind: "no-profile" };
  if (err instanceof ApiError && err.status === 429) return { kind: "limit" };
  return {
    kind: "error",
    message: err instanceof Error ? err.message : "Unable to load recommendations.",
  };
}

// ai and fake both come from the matching service; fallback is plain keyword matching
function modeLabel(mode: RecommendationMode): string {
  return mode === "fallback" ? "Keyword match" : "AI match";
}

// green for strong matches, yellow for medium, grey for weak
function scoreColors(score: number) {
  if (score >= 70) return { backgroundColor: "#dafbe1", color: "#1a7f37" };
  if (score >= 40) return { backgroundColor: "#fff8c5", color: "#9a6700" };
  return { backgroundColor: "#eaeef2", color: "#57606a" };
}

function RecommendationCard({ job, mode }: { job: JobRecommendation; mode: RecommendationMode }) {
  return (
    <li style={{ padding: "14px 0", borderBottom: "1px solid #eaeef2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <h3 style={{ fontSize: "17px", margin: 0 }}>{job.title}</h3>
        <span
          aria-label={`Match score ${job.score} out of 100`}
          style={{
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            ...scoreColors(job.score),
          }}
        >
          {job.score}% match
        </span>
      </div>

      <p style={{ margin: "4px 0", color: "#57606a" }}>
        {job.company} · {job.location}
      </p>

      <span
        style={{
          display: "inline-block",
          padding: "1px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          backgroundColor: mode === "fallback" ? "#eaeef2" : "#ddf4ff",
          color: mode === "fallback" ? "#57606a" : "#0969da",
        }}
      >
        {modeLabel(mode)}
      </span>

      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
        {job.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <Link to={`/jobs/${job.job_id}`} aria-label={`View job: ${job.title}`}>
        View job
      </Link>
    </li>
  );
}

// grey placeholder boxes while the AI is thinking
function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading recommendations">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{ height: "64px", borderRadius: "6px", backgroundColor: "#eaeef2", margin: "10px 0" }}
        />
      ))}
    </div>
  );
}

function RecommendationsContent() {
  const [data, setData] = useState<RecommendationList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);

  // false once the panel is gone, so a late answer doesn't update a closed panel
  const isMounted = useRef(true);
  // React's StrictMode runs effects twice in development; this makes sure
  // opening the panel sends ONE request (the limit is 5 per hour)
  const requestedOnOpen = useRef(false);

  // Sends the request. The screen only changes once the answer comes back.
  const fetchRecommendations = useCallback(() => {
    getRecommendations()
      .then((result) => {
        if (!isMounted.current) return;
        setData(result);
        setProblem(null);
      })
      .catch((err: unknown) => {
        if (!isMounted.current) return;
        setData(null);
        setProblem(toProblem(err));
      })
      .finally(() => {
        if (isMounted.current) setIsLoading(false);
      });
  }, []);

  // Fetch once when the panel opens. No other automatic requests.
  useEffect(() => {
    isMounted.current = true;
    if (!requestedOnOpen.current) {
      requestedOnOpen.current = true;
      fetchRecommendations();
    }
    return () => {
      isMounted.current = false;
    };
  }, [fetchRecommendations]);

  // Refresh and "Try again" both ask the backend again, one request per click
  function handleRefresh() {
    if (isLoading) return;
    setIsLoading(true);
    setProblem(null);
    fetchRecommendations();
  }

  function renderBody() {
    if (isLoading) return <LoadingSkeleton />;

    if (problem?.kind === "no-profile") {
      return (
        <p>
          Add skills or a headline to your profile first. <Link to="/profile">Go to your profile</Link>
        </p>
      );
    }

    if (problem?.kind === "limit") {
      return <Alert type="info" message="AI request limit reached. Try again later." />;
    }

    if (problem?.kind === "error") {
      return (
        <>
          <Alert type="error" message={problem.message} />
          <button type="button" style={smallButton} onClick={handleRefresh}>
            Try again
          </button>
        </>
      );
    }

    if (!data || data.items.length === 0) {
      return (
        <>
          <p style={{ fontWeight: 600 }}>No matches yet</p>
          {data?.message && <p style={{ color: "#57606a" }}>{data.message}</p>}
        </>
      );
    }

    return (
      <>
        {data.message && <Alert type="info" message={data.message} />}
        <p style={{ color: "#57606a", fontSize: "14px", margin: "0 0 4px" }}>
          {data.resume_used ? "Based on your profile and latest resume." : "Based on your profile."}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.items.map((job) => (
            <RecommendationCard key={job.job_id} job={job} mode={data.mode} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <section aria-labelledby="recommended-jobs-heading" style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 id="recommended-jobs-heading" style={{ margin: 0 }}>
          Recommended jobs
        </h2>
        <button
          type="button"
          style={{ ...smallButton, cursor: isLoading ? "not-allowed" : "pointer" }}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>
      {renderBody()}
    </section>
  );
}

// Recommended jobs for job seekers (DA-11). Recruiters never see it,
// and no request is sent for them.
function RecommendedJobs() {
  const { user } = useAuth();
  if (user?.role !== "JOB_SEEKER") return null;
  return <RecommendationsContent />;
}

export default RecommendedJobs;
