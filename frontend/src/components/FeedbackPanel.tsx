import Alert from "./Alert";
import type { ResumeFeedback } from "../types/feedback";

interface FeedbackPanelProps {
  feedback: ResumeFeedback | null;
  loading: boolean;
  error: string | null;
}

const sectionTitle = { fontSize: "16px", margin: "16px 0 8px" };

// Shows AI feedback for a resume. It doesn't call the API itself,
// the parent page passes in what to show.
function FeedbackPanel({ feedback, loading, error }: FeedbackPanelProps) {
  if (loading) {
    return <p role="status">Analyzing your resume. This can take up to 20 seconds.</p>;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!feedback) {
    return null;
  }

  return (
    <section aria-label="Resume feedback">
      {feedback.mode === "fake" && (
        <Alert
          type="info"
          message="This is sample feedback. The AI service is not connected, so this is not a real review."
        />
      )}

      <h3 style={sectionTitle}>Summary</h3>
      <p>{feedback.summary}</p>

      <h3 style={sectionTitle}>Strengths</h3>
      <ul>
        {feedback.strengths.map((strength) => (
          <li key={strength}>{strength}</li>
        ))}
      </ul>

      <h3 style={sectionTitle}>What to improve</h3>
      <ul>
        {feedback.improvements.map((item) => (
          <li key={item.title} style={{ marginBottom: "8px" }}>
            <strong>{item.title}</strong>
            <div>{item.suggestion}</div>
          </li>
        ))}
      </ul>

      <h3 style={sectionTitle}>Missing sections</h3>
      {feedback.missing_sections.length === 0 ? (
        <p>None found</p>
      ) : (
        <ul>
          {feedback.missing_sections.map((section) => (
            <li key={section}>{section}</li>
          ))}
        </ul>
      )}

      <h3 style={sectionTitle}>Keywords</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {feedback.keywords.map((keyword) => (
          <span
            key={keyword}
            style={{
              padding: "2px 10px",
              borderRadius: "12px",
              backgroundColor: "#ddf4ff",
              color: "#0969da",
              fontSize: "13px",
            }}
          >
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}

export default FeedbackPanel;
