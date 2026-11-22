
import { useEffect, useState, type FormEvent } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import { getProfile, saveProfile } from "../api/profile";
import type { Profile } from "../types/profile";
import ResumeSection from "../components/ResumeSection";

// Empty values when the user has not created a profile yet.
const emptyProfile: Profile = {
  full_name: "",
  headline: "",
  location: "",
  phone: "",
  summary: "",
  skills: [],
};

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [skillsText, setSkillsText] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the profile when the page opens.
  useEffect(() => {
    getProfile()
      .then((savedProfile) => {
        if (savedProfile) {
          setProfile(savedProfile);
          setSkillsText(savedProfile.skills.join(", "));
          setIsEditing(false);
        }
      })
      .catch(() => {
        setError("Unable to load your profile.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Update the form as the user types.
  const handleChange = (
    field: Exclude<keyof Profile, "skills">,
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Validate and save the profile.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profile.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (profile.summary.length > 2000) {
      setError("Summary cannot exceed 2000 characters.");
      return;
    }

    const skills = skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    if (skills.length > 30) {
      setError("You can enter a maximum of 30 skills.");
      return;
    }

    setIsSaving(true);

    try {
      const savedProfile = await saveProfile({
        ...profile,
        full_name: profile.full_name.trim(),
        skills,
      });

      setProfile(savedProfile);
      setSkillsText(savedProfile.skills.join(", "));
      setIsEditing(false);
      setSuccess("Profile saved successfully!");
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page">
        <section className="container">
          <p>Loading profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container auth-page">
        <h1>My Profile</h1>
        <p>
          Manage your personal and professional information.
        </p>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {isEditing ? (
          <form onSubmit={handleSubmit} noValidate>
            <FormField label="Full Name *" htmlFor="full_name">
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) =>
                  handleChange("full_name", e.target.value)
                }
                placeholder="Enter your full name"
                required
              />
            </FormField>

            <FormField label="Headline" htmlFor="headline">
              <Input
                id="headline"
                value={profile.headline}
                onChange={(e) =>
                  handleChange("headline", e.target.value)
                }
                placeholder="e.g. Software Developer"
              />
            </FormField>

            <FormField label="Location" htmlFor="location">
              <Input
                id="location"
                value={profile.location}
                onChange={(e) =>
                  handleChange("location", e.target.value)
                }
                placeholder="e.g. Montreal, Quebec"
              />
            </FormField>

            <FormField label="Phone" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  handleChange("phone", e.target.value)
                }
                placeholder="Enter your phone number"
              />
            </FormField>

            <FormField label="Summary" htmlFor="summary">
              <textarea
                id="summary"
                className="input"
                rows={5}
                maxLength={2000}
                value={profile.summary}
                onChange={(e) =>
                  handleChange("summary", e.target.value)
                }
                placeholder="Write a short professional summary"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  boxSizing: "border-box",
                }}
              />
              <p>{profile.summary.length}/2000 characters</p>
            </FormField>

            <FormField label="Skills" htmlFor="skills">
              <Input
                id="skills"
                value={skillsText}
                onChange={(e) => {
                  setSkillsText(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="React, Python, SQL"
              />
              <p>Separate skills with commas (maximum 30).</p>
            </FormField>

            <div style={{ marginTop: "1.5rem" }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <h2>{profile.full_name}</h2>

            <p>
              <strong>Headline:</strong>{" "}
              {profile.headline || "Not provided"}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {profile.location || "Not provided"}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {profile.phone || "Not provided"}
            </p>

            <p>
              <strong>Summary:</strong>{" "}
              {profile.summary || "Not provided"}
            </p>

            <p>
              <strong>Skills:</strong>{" "}
              {profile.skills.join(", ") || "Not provided"}
            </p>

            <div style={{ marginTop: "1.5rem" }}>
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSuccess("");
                }}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        )}

        {/* KR-2: Resume management */}
        <ResumeSection />

      </section>
    </main>
  );
}

export default ProfilePage;
