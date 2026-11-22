interface AlertProps {
  type?: "success" | "error" | "info";
  message: string;
}

function Alert({ type = "info", message }: AlertProps) {
  const styles: Record<string, React.CSSProperties> = {
    error: { backgroundColor: "#ffebe9", color: "#cf222e", border: "1px solid #ff8182" },
    success: { backgroundColor: "#dafbe1", color: "#1a7f37", border: "1px solid #4ac26b" },
    info: { backgroundColor: "#ddf4ff", color: "#0969da", border: "1px solid #54aeff" },
  };

  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "6px",
        marginBottom: "15px",
        fontSize: "14px",
        ...styles[type],
      }}
    >
      {message}
    </div>
  );
}

export default Alert;