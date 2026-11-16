
import { useState } from "react";

import StatusBadge from "./StatusBadge";
import {
  updateApplicationStatus,
  downloadApplicantResume,
  type RecruiterApplication,
} from "../api/recruiter";
import { ApiError } from "../api/client";
import type { ApplicationStatus } from "../types/application";

const STATUSES: ApplicationStatus[] = [
  "Applied",
  "Under Review",
  "Interview",
  "Offered",
  "Rejected",
];

const cell = {
  padding: "12px",
  borderBottom: "1px solid #eaeef2",
  fontSize: "14px",
};

function toLocalDateTime(isoDate?: string | null): string {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function ApplicantRow({
  application,
}: {
  application: RecruiterApplication;
}) {
  const [currentStatus, setCurrentStatus] =
    useState<ApplicationStatus>(application.status);

  const [currentInterviewAt, setCurrentInterviewAt] =
    useState<string | null>(application.interview_at ?? null);

  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>(application.status);

  const [interviewDate, setInterviewDate] = useState(
    toLocalDateTime(application.interview_at)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isViewingResume, setIsViewingResume] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSuccess("");

    let interviewAt: string | undefined;

    if (selectedStatus === "Interview") {
      if (!interviewDate) {
        setError("Please select an interview date and time.");
        return;
      }

      const parsedDate = new Date(interviewDate);

      if (Number.isNaN(parsedDate.getTime())) {
        setError("Please enter a valid interview date and time.");
        return;
      }

      interviewAt = parsedDate.toISOString();
    }

    setIsSaving(true);

    try {
      const updated = await updateApplicationStatus(
        application.application_id,
        selectedStatus,
        interviewAt
      );

      setCurrentStatus(updated.status);
      setCurrentInterviewAt(updated.interview_at);
      setSuccess("Application updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update application."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleViewResume() {
    setError("");
    setSuccess("");

    // Open the tab immediately to avoid browser popup blocking.
    const newTab = window.open("", "_blank");

    if (!newTab) {
      setError("Please allow pop-ups to view the resume.");
      return;
    }

    // Prevent the new tab from accessing the original page.
    newTab.opener = null;

    setIsViewingResume(true);

    try {
      const resumeBlob = await downloadApplicantResume(
        application.application_id
      );

      // Create a temporary URL for the downloaded file.
      const resumeUrl = URL.createObjectURL(resumeBlob);

      // Display the file in the new browser tab.
      newTab.location.href = resumeUrl;

      // Release the temporary URL after the browser has had
      // time to load the file.
      window.setTimeout(() => {
        URL.revokeObjectURL(resumeUrl);
      }, 60000);
    } catch (err) {
      newTab.close();

      if (err instanceof ApiError && err.status === 404) {
        setError("Resume not available");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to open resume."
        );
      }
    } finally {
      setIsViewingResume(false);
    }
  }


  return (
    <tr>
      <td style={cell}>
        <strong>{application.applicant_name}</strong>

        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            onClick={() => void handleViewResume()}
            disabled={isViewingResume || isSaving}
            style={{ padding: "6px 12px" }}
          >
            {isViewingResume ? "Opening..." : "View Resume"}
          </button>
        </div>
      </td>

      <td style={cell}>
        <StatusBadge status={currentStatus} />

        <div style={{ marginTop: "8px" }}>
          <select
            aria-label={`Change status for ${application.applicant_name}`}
            value={selectedStatus}
            disabled={isSaving || isViewingResume}
            onChange={(event) => {
              setSelectedStatus(
                event.target.value as ApplicationStatus
              );
              setError("");
              setSuccess("");
            }}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {selectedStatus === "Interview" && (
          <div style={{ marginTop: "8px" }}>
            <input
              type="datetime-local"
              aria-label={`Interview date and time for ${application.applicant_name}`}
              value={interviewDate}
              disabled={isSaving || isViewingResume}
              onChange={(event) =>
                setInterviewDate(event.target.value)
              }
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || isViewingResume}
          style={{ marginTop: "8px", padding: "6px 12px" }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        {success && (
          <p role="status" style={{ color: "green" }}>
            {success}
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: "#b42318" }}>
            {error}
          </p>
        )}
      </td>

      <td style={cell}>
        {new Date(application.applied_at).toLocaleDateString("en-CA")}
      </td>

      <td style={cell}>
        {currentInterviewAt
          ? new Date(currentInterviewAt).toLocaleString()
          : "—"}
      </td>
    </tr>
  );
}

export default ApplicantRow;
