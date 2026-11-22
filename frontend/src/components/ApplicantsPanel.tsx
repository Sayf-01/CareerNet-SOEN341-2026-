import { useEffect, useState } from "react";

import Alert from "./Alert";
import ApplicantRow from "./ApplicantRow";
import Loader from "./Loader";
import { getApplicationsForJob, type RecruiterApplication } from "../api/recruiter";

const STATUSES = ["Applied", "Under Review", "Interview", "Offered", "Rejected"];

const label = { display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "6px" };
const field = { padding: "8px", borderRadius: "6px", border: "1px solid #d0d7de" };
const th = { padding: "12px", borderBottom: "1px solid #d0d7de", fontSize: "14px", textAlign: "left" as const };

// Applicants for one posting, with status and date filters.
// It reloads the list every time a filter changes.
function ApplicantsPanel({ jobId }: { jobId: number }) {
  const [status, setStatus] = useState(""); // "" = All
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getApplicationsForJob(jobId, { status, dateFrom, dateTo });
        if (!cancelled) setApplications(data);
      } catch (err) {
        if (!cancelled) {
          setApplications([]);
          setError(err instanceof Error ? err.message : "Unable to load applications.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId, status, dateFrom, dateTo]);

  function clearFilters() {
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <section aria-label="Applicants">
      <h2>Applicants</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end", marginBottom: "16px" }}>
        <div>
          <label htmlFor="applicant-status" style={label}>Status</label>
          <select id="applicant-status" value={status} onChange={(e) => setStatus(e.target.value)} style={field}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="applicant-date-from" style={label}>Applied from</label>
          <input id="applicant-date-from" type="date" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)} style={field} />
        </div>

        <div>
          <label htmlFor="applicant-date-to" style={label}>Applied to</label>
          <input id="applicant-date-to" type="date" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)} style={field} />
        </div>

        <button type="button" onClick={clearFilters} style={{ ...field, cursor: "pointer", backgroundColor: "#f6f8fa" }}>
          Clear filters
        </button>
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : applications.length === 0 ? (
        <p>No applications match</p>
      ) : (
        <>
          <p>
            Showing {applications.length} {applications.length === 1 ? "application" : "applications"}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f6f8fa" }}>
                <th style={th}>Applicant</th>
                <th style={th}>Status</th>
                <th style={th}>Applied</th>
                <th style={th}>Interview</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <ApplicantRow key={application.application_id} application={application} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export default ApplicantsPanel;
