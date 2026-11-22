
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";

import Button from "./Button";
import Alert from "./Alert";

import type { Resume } from "../types/resume";
import { getResumes } from "../api/resumes";
import {
  applyToJob,
  ApplicationError,
} from "../api/applications";

interface ApplyDialogProps {
  jobId: number;
  jobTitle: string;
}

function ApplyDialog({ jobId, jobTitle }: ApplyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const titleId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] =
    useState<number | "">("");

  const [coverNote, setCoverNote] = useState("");
  const [error, setError] = useState("");

  // Open or close the native browser dialog.
  // Native dialogs support Escape and keyboard focus handling.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Load the user's resumes each time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    getResumes()
      .then((data) => {
        if (!active) return;

        setResumes(data);
        setSelectedResumeId(data[0]?.id ?? "");
      })
      .catch(() => {
        if (active) {
          setError("Unable to load your resumes.");
          setResumes([]);
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
  }, [isOpen]);

  // Focus the resume dropdown when it becomes available.
  useEffect(() => {
    if (
      isOpen &&
      !isLoading &&
      !isSubmitted &&
      resumes.length > 0
    ) {
      selectRef.current?.focus();
    }
  }, [isOpen, isLoading, isSubmitted, resumes.length]);

  
const openDialog = () => {
  setIsSubmitted(false);
  setCoverNote("");
  setSelectedResumeId("");
  setResumes([]);
  setError("");
  setIsLoading(true);
  setIsOpen(true);
};


  const closeDialog = () => {
    if (!isSubmitting) {
      setIsOpen(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");

    if (selectedResumeId === "") {
      setError("Please select a resume.");
      return;
    }

    if (coverNote.length > 1000) {
      setError("Cover note cannot exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await applyToJob(
        jobId,
        selectedResumeId,
        coverNote
      );

      setIsSubmitted(true);
    } catch (err) {
      if (
        err instanceof ApplicationError &&
        err.status === 409
      ) {
        setError("You have already applied to this job.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to submit your application.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={openDialog}
        style={{ width: "auto" }}
      >
        Apply
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
        onClose={() => setIsOpen(false)}
        style={{
          width: "calc(100% - 32px)",
          maxWidth: "500px",
          padding: "24px",
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
          color: "#24292f",
        }}
      >
        <h2 id={titleId}>
          {isSubmitted ? "Application submitted" : "Apply for Job"}
        </h2>

        <p>
          <strong>{jobTitle}</strong>
        </p>

        {isSubmitted ? (
          <div>
            <Alert
              type="success"
              message="Application submitted successfully!"
            />

            <p>
              Your application for {jobTitle} has been
              submitted.
            </p>

            <Link
              to="/applications"
              onClick={closeDialog}
            >
              See my applications
            </Link>

            <div style={{ marginTop: "20px" }}>
              <Button
                type="button"
                onClick={closeDialog}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {error && (
              <Alert type="error" message={error} />
            )}

            {isLoading ? (
              <p role="status">Loading resumes...</p>
            ) : resumes.length === 0 ? (
              <div>
                <p>
                  Upload a resume first before applying
                  for this job.
                </p>

                <Link
                  to="/profile"
                  onClick={closeDialog}
                >
                  Go to My Profile
                </Link>

                <div style={{ marginTop: "20px" }}>
                  <Button
                    type="button"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    htmlFor={`${titleId}-resume`}
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "6px",
                    }}
                  >
                    Select Resume *
                  </label>

                  <select
                    ref={selectRef}
                    id={`${titleId}-resume`}
                    value={selectedResumeId}
                    onChange={(event) =>
                      setSelectedResumeId(
                        Number(event.target.value)
                      )
                    }
                    required
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #d0d7de",
                    }}
                  >
                    <option value="">
                      Choose a resume
                    </option>

                    {resumes.map((resume) => (
                      <option
                        key={resume.id}
                        value={resume.id}
                      >
                        {resume.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    htmlFor={`${titleId}-note`}
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "6px",
                    }}
                  >
                    Cover Note (Optional)
                  </label>

                  <textarea
                    id={`${titleId}-note`}
                    rows={5}
                    maxLength={1000}
                    value={coverNote}
                    onChange={(event) =>
                      setCoverNote(event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Write a short message to the recruiter..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      boxSizing: "border-box",
                      borderRadius: "6px",
                      border: "1px solid #d0d7de",
                    }}
                  />

                  <p
                    style={{
                      textAlign: "right",
                      fontSize: "12px",
                    }}
                  >
                    {coverNote.length}/1000 characters
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    type="button"
                    onClick={closeDialog}
                    disabled={isSubmitting}
                    style={{
                      width: "auto",
                      backgroundColor: "#6e7781",
                      color: "#ffffff",
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      selectedResumeId === ""
                    }
                    style={{ width: "auto" }}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Application"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

export default ApplyDialog;
