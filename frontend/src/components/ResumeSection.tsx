import FeedbackPanel from "./FeedbackPanel";
import type { ResumeFeedback } from "../types/feedback";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import Button from "./Button";
import Alert from "./Alert";

import type { Resume } from "../types/resume";

import {
  getResumes,
  uploadResume,
  replaceResume,
  deleteResume,
  downloadResume,
  getResumeFeedback,
} from "../api/resumes";

import {
  RESUME_ACCEPT,
  validateResumeFile,
} from "../constants/resumeRules";

// Convert file sizes into a readable format.
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResumeSection() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [feedbackResumeId, setFeedbackResumeId] =
    useState<number | null>(null);

  const [feedback, setFeedback] =
    useState<ResumeFeedback | null>(null);

  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] =
    useState<string | null>(null);

  const [replaceId, setReplaceId] = useState<number | null>(null);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Load resumes when the component opens.
  useEffect(() => {
    let active = true;

    getResumes()
      .then((data) => {
        if (active) {
          setResumes(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load resumes.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Refresh the resume list after an operation.
  const refreshResumes = async () => {
    const updatedResumes = await getResumes();
    setResumes(updatedResumes);
  };

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }

    return "Something went wrong. Please try again.";
  };

  // Upload a new resume.
  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Allows the same file to be selected again later.
    event.target.value = "";

    if (!file) return;

    setError("");
    setSuccess("");

    const validationError = validateResumeFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsBusy(true);

    try {
      await uploadResume(file);
      await refreshResumes();
      setSuccess("Resume uploaded successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  // Open the file chooser for replacing a resume.
  const chooseReplacement = (id: number) => {
    setReplaceId(id);
    setError("");
    setSuccess("");
    replaceInputRef.current?.click();
  };

  // Replace a resume with a new file.
  const handleReplace = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || replaceId === null) return;

    setError("");
    setSuccess("");

    const validationError = validateResumeFile(file);

    if (validationError) {
      setError(validationError);
      setReplaceId(null);
      return;
    }

    setIsBusy(true);

    try {
      await replaceResume(replaceId, file);
      await refreshResumes();
      setSuccess("Resume replaced successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReplaceId(null);
      setIsBusy(false);
    }
  };

  // Delete a resume after confirmation.
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setIsBusy(true);

    try {
      await deleteResume(id);
      await refreshResumes();
      setSuccess("Resume deleted successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  // Download the stored resume file.
  const handleDownload = async (resume: Resume) => {
    setError("");
    setSuccess("");
    setIsBusy(true);

    try {
      const fileBlob = await downloadResume(resume.id);

      const downloadUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = resume.filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Release the temporary browser URL.
      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleFeedback = async (id: number) => {
    const confirmed = window.confirm(
      "Your resume text will be sent to an AI service to create feedback. Do not continue if your resume contains information you do not want to share. Continue?"
    );

    if (!confirmed) return;

    setFeedbackResumeId(id);
    setFeedback(null);
    setFeedbackError(null);
    setFeedbackLoading(true);

    try {
      const result = await getResumeFeedback(id);
      setFeedback(result);
    } catch (err) {
      setFeedbackError(getErrorMessage(err));
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="resumes-heading"
      style={{ marginTop: "2rem" }}
    >
      <h2 id="resumes-heading">My Resumes</h2>

      <p>
        Upload and manage your resume files.
        PDF, DOC, and DOCX files up to 5 MB are allowed.
      </p>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Hidden file input for new uploads */}
      <input
        ref={uploadInputRef}
        type="file"
        accept={RESUME_ACCEPT}
        onChange={handleUpload}
        disabled={isBusy || feedbackLoading}
        aria-label="Choose resume to upload"
        style={{ display: "none" }}
      />

      {/* Hidden file input for replacements */}
      <input
        ref={replaceInputRef}
        type="file"
        accept={RESUME_ACCEPT}
        onChange={handleReplace}
        disabled={isBusy || feedbackLoading}
        aria-label="Choose replacement resume"
        style={{ display: "none" }}
      />

      <div style={{ margin: "1rem 0" }}>
        <Button
          type="button"
          disabled={isBusy || isLoading || feedbackLoading}
          onClick={() => uploadInputRef.current?.click()}
        >
          Upload Resume
        </Button>
      </div>

      {isBusy && <p role="status">Processing your request...</p>}

      {isLoading ? (
        <p role="status">Loading resumes...</p>
      ) : resumes.length === 0 ? (
        <p>No resumes uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {resumes.map((resume) => (
            <li
              key={resume.id}
              style={{
                border: "1px solid #d0d7de",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <p>
                <strong>{resume.filename}</strong>
              </p>

              <p>
                Size: {formatFileSize(resume.size_bytes)}
              </p>

              <p>
                Uploaded:{" "}
                {new Date(resume.uploaded_at).toLocaleDateString()}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <Button
                  type="button"
                  style={{ width: "auto" }}
                  disabled={isBusy || feedbackLoading}
                  onClick={() => handleDownload(resume)}
                >
                  Download
                </Button>

                <Button
                  type="button"
                  style={{ width: "auto" }}
                  disabled={isBusy || feedbackLoading}
                  onClick={() => void handleFeedback(resume.id)}
                >
                  Get AI feedback
                </Button>


                <Button
                  type="button"
                  style={{ width: "auto" }}
                  disabled={isBusy || feedbackLoading}
                  onClick={() => chooseReplacement(resume.id)}
                >
                  Replace
                </Button>

                <Button
                  type="button"
                  style={{
                    width: "auto",
                    color: "white",
                    backgroundColor: "#b42318",
                  }}
                  disabled={isBusy || feedbackLoading}
                  onClick={() => handleDelete(resume.id)}
                >
                  Delete
                </Button>
              </div>

              {feedbackResumeId === resume.id && (
                <FeedbackPanel
                  feedback={feedback}
                  loading={feedbackLoading}
                  error={feedbackError}
                />
              )}

            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ResumeSection;
