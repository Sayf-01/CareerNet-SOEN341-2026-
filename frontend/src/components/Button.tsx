import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={className}
      style={{
        width: "100%",
        padding: "10px 16px",
        borderRadius: "6px",
        border: "none",
        backgroundColor: "#0969da",
        color: "#ffffff",
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.7 : 1,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;