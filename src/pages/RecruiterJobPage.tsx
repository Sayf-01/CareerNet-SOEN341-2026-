
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getApplicationsForJob,
  type RecruiterApplication,
} from "../api/recruiter";

import Alert from "../components/Alert";
import Loader from "../components/Loader";

function RecruiterJobPage() {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);

  const isValidJobId =
    Number.isSafeInteger(jobId) && jobId > 0;

  const [applications, setApplications] = useState<
    RecruiterApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidJobId) return;

    let cancelled = false;

    async function loadApplications() {
      try {
        const data = await getApplicationsForJob(jobId);

        if (!cancelled) {
          setApplications(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load applications."
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
  }, [jobId, isValidJobId]);

  return (
    <main className="page" style={{ padding: "32px 16px" }}>
      <section
        className="container"
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          textAlign: "left",
        }}
      >
        <Link to="/recruiter">
          Back to Recruiter Dashboard
        </Link>

        <h1 style={{ marginTop: "24px" }}>
          Manage Posting #{id}
        </h1>

        <p>
          Review the applications received for this posting.
        </p>

        {!isValidJobId ? (
          <Alert type="error" message="Invalid Job ID." />
        ) : isLoading ? (
          <div role="status">
            <Loader />
            <p>Loading applications...</p>
          </div>
        ) : error ? (
          <Alert type="error" message={error} />
        ) : applications.length === 0 ? (
          <p>No applications yet.</p>
        ) : (
          <section>
            <h2>Applications ({applications.length})</h2>

            <ul style={{ listStyle: "none", padding: 0 }}>
              {applications.map((application) => (
                <li
                  key={application.application_id}
                  style={{
                    border: "1px solid #d0d7de",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <h3>{application.applicant_name}</h3>

                  <p>
                    <strong>Status:</strong>{" "}
                    {application.status}
                  </p>

                  <p>
                    <strong>Applied:</strong>{" "}
                    {new Date(
                      application.applied_at
                    ).toLocaleDateString()}
                  </p>

                  <p>
                    <strong>Resume ID:</strong>{" "}
                    {application.resume_id ?? "None"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

export default RecruiterJobPage;
