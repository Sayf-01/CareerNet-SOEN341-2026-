import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>Find Your Next Opportunity</h1>
      <p style={{ color: "#57606a", marginBottom: "24px" }}>
        CareerNet helps job seekers discover roles and helps recruiters find great candidates.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <Link to="/register">
          <button style={{ padding: "10px 20px", backgroundColor: "#0969da", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Create Account
          </button>
        </Link>
        <Link to="/login">
          <button style={{ padding: "10px 20px", backgroundColor: "#a6216465", border: "1px solid #d0d7de", borderRadius: "6px", cursor: "pointer" }}>
            Log In
          </button>
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;