
import { Link } from "react-router-dom";
import type { Job } from "../types/job";

interface JobCardProps {
  job: Job;
}

function JobCard({ job }: JobCardProps) {
  const formattedDate = new Date(
    job.posted_at
  ).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article
      style={{
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "16px",
        backgroundColor: "#ffffff",
        color: "#24292f",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
      }}
    >
      <h3
        style={{
          fontSize: "20px",
          marginTop: 0,
          marginBottom: "8px",
        }}
      >
        {job.title}
      </h3>

      <p style={{ margin: "6px 0", fontWeight: 600 }}>
        {job.company}
      </p>

      <p style={{ margin: "6px 0", color: "#57606a" }}>
        Location: {job.location}
      </p>

      <p style={{ margin: "6px 0", color: "#57606a" }}>
        Category: {job.category}
      </p>

      <p
        style={{
          margin: "6px 0 16px",
          fontSize: "14px",
          color: "#57606a",
        }}
      >
        Posted: {formattedDate}
      </p>

      <Link
        to={`/jobs/${job.id}`}
        style={{
          display: "inline-block",
          padding: "10px 16px",
          borderRadius: "6px",
          backgroundColor: "#0969da",
          color: "#ffffff",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        View Details
      </Link>
    </article>
  );
}

export default JobCard;
