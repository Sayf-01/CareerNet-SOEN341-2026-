
import { Link } from "react-router-dom";
import type { RecruiterPosting } from "../api/recruiter";

interface PostingsTableProps {
  jobs: RecruiterPosting[];
}

function PostingsTable({ jobs }: PostingsTableProps) {
  if (jobs.length === 0) {
    return <p>No postings yet.</p>;
  }

  return (
    <div style={{ overflowX: "auto", marginTop: "16px" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          minWidth: "750px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f6f8fa" }}>
            <th style={cellStyle}>Job Title</th>
            <th style={cellStyle}>Company</th>
            <th style={cellStyle}>Location</th>
            <th style={cellStyle}>Category</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Posted</th>
            <th style={cellStyle}>Applications</th>
            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td style={cellStyle}>{job.title}</td>
              <td style={cellStyle}>{job.company}</td>
              <td style={cellStyle}>{job.location}</td>
              <td style={cellStyle}>{job.category}</td>

              <td style={cellStyle}>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      job.status === "open"
                        ? "#1a7f37"
                        : "#57606a",
                  }}
                >
                  {job.status === "open"
                    ? "Open"
                    : "Archived"}
                </span>
              </td>

              <td style={cellStyle}>
                {new Date(job.posted_at).toLocaleDateString()}
              </td>

              <td style={cellStyle}>
                {job.application_count}
              </td>

              <td style={cellStyle}>
                <Link
                  to={`/recruiter/jobs/${job.id}`}
                  aria-label={`Manage ${job.title}`}
                  style={{
                    color: "#0969da",
                    fontWeight: 600,
                  }}
                >
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #d0d7de",
  fontSize: "14px",
};

export default PostingsTable;
