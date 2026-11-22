import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { authService, getAuthErrorMessage } from "../services/authService";
import type { UserRole } from "../types/auth";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | "";
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

const EMAIL_REGEX = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
const PASSWORD_MIN_LENGTH = 8;

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!form.role) {
      newErrors.role = "Please select a role.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setErrors({});
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role as UserRole,
      });

      setSuccessMessage(
        "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setErrors((prev) => ({
        ...prev,
        general: message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="container auth-page">
        <h1>Create your CareerNet account</h1>
        <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
          Join as a job seeker or recruiter to get started.
        </p>

        {errors.general && (
  <Alert type="error" message={errors.general} />
)}

{successMessage && (
  <Alert type="success" message={successMessage} />
)}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Full name"
            htmlFor="fullName"
            error={errors.fullName}
          >
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={form.fullName}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="name"
              required
            />
          </FormField>

          <FormField
            label="Email"
            htmlFor="email"
            error={errors.email}
          >
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
          >
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </FormField>

          <FormField
            label="I am a"
            htmlFor="role"
            error={errors.role}
          >
            <select
              id="role"
              name="role"
              className={`input ${errors.role ? "input--error" : ""}`}
              value={form.role}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.role}
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="JOB_SEEKER">Job Seeker</option>
              <option value="RECRUITER">Recruiter</option>
            </select>
          </FormField>

          <div style={{ marginTop: "1.5rem" }}>
            <Button
  type="submit"
  disabled={isLoading}
  style={{ width: "100%" }}
>
              {isLoading ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Loader />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </div>

          <p
            style={{
              marginTop: "1rem",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#4b5563",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "#2563eb", fontWeight: 600 }}
            >
              Log in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default RegisterPage;