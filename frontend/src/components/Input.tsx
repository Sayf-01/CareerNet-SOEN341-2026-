import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

function Input({ id, className = "", ...props }: InputProps) {
  return (
    <input
      id={id}
      className={className}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: "6px",
        border: "1px solid #d0d7de",
        fontSize: "14px",
        boxSizing: "border-box",
        ...props.style,
      }}
      {...props}
    />
  );
}

export default Input;