
import { useEffect, useState } from "react";

import {
  createJob,
  getMyJobs,
  type CreateJobData,
  type RecruiterPosting,
} from "../api/recruiter";

import Alert from "../components/Alert";
import Loader from "../components/Loader";
import PostingForm from "../components/PostingForm";
import PostingsTable from "../components/PostingsTable";

function RecruiterDashboardPage() {
  const [jobs, setJobs] = useState<RecruiterPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load the recruiter's postings when the page opens
  // and after a new posting is created.
  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        const data = await getMyJobs();

        if (!cancelled) {
          setJobs(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load job postings."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Create a job using the existing real backend API.
  const handleCreateJob = async (data: CreateJobData) => {
    setSuccess("");

    const createdJob = await createJob(data);

    setSuccess(
      `Job "${createdJob.title}" posted successfully!`
    );

    // Request a fresh list from the backend.
    setIsLoading(true);
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <main
      className="page"
      style={{ padding: "32px 16px" }}
    >
      <section
        className="container"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          color: "#24292f",
          textAlign: "left",
        }}
      >
        <h1>Recruiter Dashboard</h1>

        <p style={{ marginBottom: "24px" }}>
          Manage your job postings and review
          applications received from job seekers.
        </p>

        {success && (
          <Alert type="success" message={success} />
        )}

        {/* Recruiter's job postings list */}
        <section
          style={{
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2>My Job Postings</h2>

          {isLoading ? (
            <div role="status">
              <Loader />
              <p>Loading postings...</p>
            </div>
          ) : error ? (
            <Alert type="error" message={error} />
          ) : (
            <PostingsTable jobs={jobs} />
          )}
        </section>

        {/* Reusable posting form */}
        <section
          style={{
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <h2>Create New Posting</h2>

          <p style={{ marginBottom: "20px" }}>
            Fill in the details below to publish
            a new job opportunity.
          </p>

          <PostingForm onSave={handleCreateJob} />
        </section>
      </section>
    </main>
  );
}

export default RecruiterDashboardPage;
