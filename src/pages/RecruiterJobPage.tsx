
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJob } from "../api/jobs";
import type { JobDetail } from "../types/job";
import PostingForm from "../components/PostingForm";
import Button from "../components/Button";

import {
  getApplicationsForJob,
  updateJob,
  archiveJob,
  unarchiveJob,
  type CreateJobData,
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
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isJobLoading, setIsJobLoading] = useState(true);
  const [jobError, setJobError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");



  useEffect(() => {
    if (!isValidJobId) return;

    let cancelled = false;

    async function loadJob() {
      setIsJobLoading(true);
      setJobError("");

      try {
        const result = await getJob(jobId);

        if (!cancelled) {
          setJob(result);

          if (!result) {
            setJobError("Job not found.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setJobError(
            error instanceof Error
              ? error.message
              : "Unable to load posting."
          );
        }
      } finally {
        if (!cancelled) {
          setIsJobLoading(false);
        }
      }
    }

    void loadJob();

    return () => {
      cancelled = true;
    };
  }, [jobId, isValidJobId]);

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

  const handleSave = async (values: CreateJobData) => {
    if (!job) {
      throw new Error("Posting is not loaded.");
    }

    setSaveMessage("");

    // Send only fields that the recruiter changed.
    const changedFields: Partial<CreateJobData> = {};

    const fields: (keyof CreateJobData)[] = [
      "title",
      "company",
      "location",
      "category",
      "description",
    ];

    for (const field of fields) {
      if (values[field] !== job[field]) {
        changedFields[field] = values[field];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      setSaveMessage("No changes to save.");
      return;
    }

    const updatedJob = await updateJob(jobId, changedFields);

    setJob(updatedJob);
    setSaveMessage("Posting updated successfully.");
  };

  const handleToggleArchive = async () => {
    if (!job || isChangingStatus) {
      return;
    }

    const shouldArchive = job.status === "open";

    // Ask for confirmation before archiving.
    if (
      shouldArchive &&
      !window.confirm(
        "Archived postings disappear from search and cannot be applied to. Current applications stay visible."
      )
    ) {
      return;
    }

    setIsChangingStatus(true);
    setStatusError("");
    setStatusMessage("");
    setSaveMessage("");

    try {
      const updatedJob = shouldArchive
        ? await archiveJob(jobId)
        : await unarchiveJob(jobId);

      setJob(updatedJob);

      setStatusMessage(
        shouldArchive
          ? "Posting archived successfully."
          : "Posting unarchived successfully."
      );
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "Unable to update posting status."
      );
    } finally {
      setIsChangingStatus(false);
    }
  };


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

        {isValidJobId && (
          <section style={{ marginTop: "24px", marginBottom: "32px" }}>
            <h2>Posting Details</h2>

            {isJobLoading ? (
              <p role="status">Loading posting...</p>
            ) : jobError ? (
              <Alert type="error" message={jobError} />
            ) : job ? (
              <div>
                <p>
  <strong>{job.title}</strong> | Status: {job.status}
</p>

                {statusError && (
                  <Alert type="error" message={statusError} />
                )}

                {statusMessage && (
                  <Alert type="success" message={statusMessage} />
                )}

                <div style={{ marginBottom: "24px" }}>
                  <Button
                    type="button"
                    onClick={() => void handleToggleArchive()}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus
                      ? "Updating..."
                      : job.status === "archived"
                        ? "Unarchive Posting"
                        : "Archive Posting"}
                  </Button>
                </div>


                {saveMessage && (
                  <Alert type="success" message={saveMessage} />
                )}

                <PostingForm
                  key={job.id}
                  initialValues={{
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    category: job.category,
                    description: job.description,
                  }}
                  onSave={handleSave}
                  submitLabel="Save Changes"
                />
              </div>
            ) : (
              <Alert type="error" message="Job not found." />
            )}
          </section>
        )}

        {/* DA-9 integration:
    Replace the temporary applications list below with
    Dany's ApplicantsPanel after DA-9 is merged.
    Keep the existing application display until then.
*/}
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
