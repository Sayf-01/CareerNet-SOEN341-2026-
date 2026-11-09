
import { useEffect, useState, type FormEvent } from "react";
import { getJob } from "../api/jobs";
import Button from "../components/Button";
import Input from "../components/Input";
import Alert from "../components/Alert";
import { useAuth } from "../context/useAuth";

import {
  JOB_CATEGORIES,
  createJob,
  getApplicationsForJob,
  type CreateJobData,
  type RecruiterJob,
  type RecruiterApplication,
} from "../api/recruiter";

const emptyForm: CreateJobData = {
  title: "",
  company: "",
  location: "",
  category: "",
  description: "",
};

type FormErrors = Partial<
  Record<keyof CreateJobData, string>
>;

function RecruiterDashboardPage() {
  const [form, setForm] = useState<CreateJobData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdJob, setCreatedJob] =
    useState<RecruiterJob | null>(null);

  const [existingJobId, setExistingJobId] = useState("");

  const { user } = useAuth();

const lastJobStorageKey =
  `careernet:lastRecruiterJob:${user?.id ?? "unknown"}`;

  const [applications, setApplications] = useState<
    RecruiterApplication[]
  >([]);

  const [showApplications, setShowApplications] =
    useState(false);


useEffect(() => {
  const savedId = sessionStorage.getItem(lastJobStorageKey);

  if (!savedId) return;

  const jobId = Number(savedId);

  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    return;
  }

  let cancelled = false;

  async function restoreJob() {
    try {
      const receivedApplications =
        await getApplicationsForJob(jobId);

      const job = await getJob(jobId);

      if (!job || job.status !== "open") {
        throw new Error("Open job not found.");
      }

      if (cancelled) return;

      setExistingJobId(String(jobId));
      setCreatedJob({ ...job, status: "open" });
      setApplications(receivedApplications);
      setShowApplications(true);
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to restore the selected job."
        );
      }
    }
  }

  void restoreJob();

  return () => {
    cancelled = true;
  };
}, [lastJobStorageKey]);

  // Update the form as the recruiter types.
  const handleChange = (
    field: keyof CreateJobData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setError("");
    setSuccess("");
  };

  // Check all required fields.
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Job title is required.";
    }

    if (!form.company.trim()) {
      newErrors.company = "Company name is required.";
    }

    if (!form.location.trim()) {
      newErrors.location = "Location is required.";
    }

    if (!form.category) {
      newErrors.category = "Please select a category.";
    } else if (
      !JOB_CATEGORIES.some(
        (category) => category === form.category
      )
    ) {
      newErrors.category = "Invalid job category.";
    }

    if (!form.description.trim()) {
      newErrors.description = "Job description is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Create a new job posting.
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const job = await createJob(form);

      setCreatedJob(job);
      sessionStorage.setItem(lastJobStorageKey, String(job.id));
      setForm({ ...emptyForm });
      setErrors({});

      setApplications([]);
      setShowApplications(false);

      setSuccess("Job posted successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create job posting."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Load applications for the newly created job.
  const handleViewApplications = async () => {
    if (!createdJob) return;

    setError("");
    setIsLoadingApplications(true);
    setShowApplications(true);

    try {
      const data = await getApplicationsForJob(createdJob.id);
      setApplications(data);
    } catch (err) {
      setApplications([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load applications."
      );
    } finally {
      setIsLoadingApplications(false);
    }
  };


const handleLoadExistingJob = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const jobId = Number(existingJobId);

  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    setError("Please enter a valid Job ID.");
    return;
  }

  setError("");
  setSuccess("");
  setIsLoadingApplications(true);
  setShowApplications(false);
  setCreatedJob(null);

  try {
    // Check that the recruiter owns this job.
    const receivedApplications =
      await getApplicationsForJob(jobId);

    // Retrieve the real job details.
    const job = await getJob(jobId);

    if (!job || job.status !== "open") {
      throw new Error("Open job not found.");
    }

    setCreatedJob({ ...job, status: "open" });
    setApplications(receivedApplications);
    setShowApplications(true);
    sessionStorage.setItem(lastJobStorageKey, String(jobId));
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load this job."
    );
  } finally {
    setIsLoadingApplications(false);
  }
};


  return (
    <main
      className="page"
      style={{ padding: "32px 16px" }}
    >
      <section
        className="container"
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          color: "#24292f",
          textAlign: "left",
        }}
      >
        <h1>Recruiter Dashboard</h1>

        <p style={{ marginBottom: "24px" }}>
          Create job postings and view applications
          received from job seekers.
        </p>

        {error && (
          <Alert type="error" message={error} />
        )}

        {success && (
          <Alert type="success" message={success} />
        )}

        {/* Part 1: Create job posting */}
        <section
          style={{
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2>Create Job Posting</h2>

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ marginTop: "20px" }}
          >
            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="job-title">
                <strong>Job Title *</strong>
              </label>

              <Input
                id="job-title"
                value={form.title}
                onChange={(event) =>
                  handleChange("title", event.target.value)
                }
                placeholder="e.g. Software Developer"
                disabled={isSaving}
              />

              {errors.title && (
                <p style={{ color: "#cf222e" }}>
                  {errors.title}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="job-company">
                <strong>Company *</strong>
              </label>

              <Input
                id="job-company"
                value={form.company}
                onChange={(event) =>
                  handleChange("company", event.target.value)
                }
                placeholder="Enter company name"
                disabled={isSaving}
              />

              {errors.company && (
                <p style={{ color: "#cf222e" }}>
                  {errors.company}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="job-location">
                <strong>Location *</strong>
              </label>

              <Input
                id="job-location"
                value={form.location}
                onChange={(event) =>
                  handleChange("location", event.target.value)
                }
                placeholder="e.g. Montreal, Quebec"
                disabled={isSaving}
              />

              {errors.location && (
                <p style={{ color: "#cf222e" }}>
                  {errors.location}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="job-category">
                <strong>Job Category *</strong>
              </label>

              <select
                id="job-category"
                value={form.category}
                onChange={(event) =>
                  handleChange("category", event.target.value)
                }
                disabled={isSaving}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #d0d7de",
                  backgroundColor: "#ffffff",
                  color: "#24292f",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select a category</option>

                {JOB_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p style={{ color: "#cf222e" }}>
                  {errors.category}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="job-description">
                <strong>Job Description *</strong>
              </label>

              <textarea
                id="job-description"
                rows={6}
                value={form.description}
                onChange={(event) =>
                  handleChange("description", event.target.value)
                }
                placeholder="Describe the job responsibilities and requirements..."
                disabled={isSaving}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #d0d7de",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />

              {errors.description && (
                <p style={{ color: "#cf222e" }}>
                  {errors.description}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Posting..." : "Post Job"}
            </Button>
          </form>
        </section>

        {/* Part 2: View posted job and applications */}
        <section
          style={{
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <h2>Posted Job</h2>

<form
  onSubmit={handleLoadExistingJob}
  style={{ marginTop: "16px", marginBottom: "24px" }}
>
  <label htmlFor="existing-job-id">
    <strong>Load Existing Job by ID</strong>
  </label>

  <input
    id="existing-job-id"
    type="number"
    min="1"
    value={existingJobId}
    onChange={(event) =>
      setExistingJobId(event.target.value)
    }
    placeholder="e.g. 19"
    style={{
      display: "block",
      padding: "10px",
      marginTop: "8px",
      marginBottom: "12px",
      width: "100%",
      boxSizing: "border-box",
    }}
  />

  <Button
    type="submit"
    disabled={isLoadingApplications}
  >
    {isLoadingApplications
      ? "Loading..."
      : "Load Job and Applications"}
  </Button>
</form>


          {!createdJob ? (
            <p style={{ marginTop: "16px" }}>
              No job posted yet. Create a posting above to get
              started.
            </p>
          ) : (
            <div style={{ marginTop: "16px" }}>
              <h3>{createdJob.title}</h3>

              <p>
                <strong>Company:</strong>{" "}
                {createdJob.company}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {createdJob.location}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {createdJob.category}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {createdJob.description}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {createdJob.status}
              </p>

              <p>
                <strong>Posted:</strong>{" "}
                {new Date(
                  createdJob.posted_at
                ).toLocaleDateString()}
              </p>

              <div style={{ marginTop: "20px" }}>
                <Button
                  type="button"
                  onClick={handleViewApplications}
                  disabled={isLoadingApplications}
                >
                  {isLoadingApplications
                    ? "Loading..."
                    : "View Applications"}
                </Button>
              </div>

              {showApplications && (
                <div style={{ marginTop: "24px" }}>
                  <h3>Applications Received</h3>

                  {isLoadingApplications ? (
                    <p role="status">
                      Loading applications...
                    </p>
                  ) : applications.length === 0 ? (
                    !error && <p>No applications yet.</p>
                  ) : (
                    <ul style={{ paddingLeft: "20px" }}>
                      {applications.map((application) => (
                        <li
                          key={application.application_id}
                          style={{
                            marginBottom: "16px",
                            padding: "12px",
                            border: "1px solid #d0d7de",
                            borderRadius: "6px",
                          }}
                        >
                          <p>
                            <strong>
                              {application.applicant_name}
                            </strong>
                          </p>

                          <p>
                            Status: {application.status}
                          </p>

                          <p>
                            Applied:{" "}
                            {new Date(
                              application.applied_at
                            ).toLocaleDateString()}
                          </p>

                          <p>
                            Resume ID:{" "}
                            {application.resume_id}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default RecruiterDashboardPage;
