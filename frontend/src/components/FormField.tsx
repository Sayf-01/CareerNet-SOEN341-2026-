import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <label htmlFor={htmlFor} style={{ fontWeight: 600, fontSize: "14px", color: "#24292f" }}>
        {label}
      </label>
      {children}
      {error && <span style={{ color: "#cf222e", fontSize: "12px" }}>{error}</span>}
    </div>
  );
}

export default FormField;