import StatusBadge from "./StatusBadge";
import type { RecruiterApplication } from "../api/recruiter";

const cell = { padding: "12px", borderBottom: "1px solid #eaeef2", fontSize: "14px" };

// One applicant in the table. Kept in its own component so KR-9 can add
// the status control to each row without touching the panel.
function ApplicantRow({ application }: { application: RecruiterApplication }) {
  return (
    <tr>
      <td style={cell}>
        <strong>{application.applicant_name}</strong>
      </td>
      <td style={cell}>
        <StatusBadge status={application.status} />
      </td>
      <td style={cell}>{new Date(application.applied_at).toLocaleDateString("en-CA")}</td>
      <td style={cell}>
        {application.interview_at ? new Date(application.interview_at).toLocaleString() : "—"}
      </td>
    </tr>
  );
}

export default ApplicantRow;
