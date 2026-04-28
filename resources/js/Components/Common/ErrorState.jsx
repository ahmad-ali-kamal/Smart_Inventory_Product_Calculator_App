export default function ErrorState({ message = "Something went wrong" }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
      <p>{message}</p>
    </div>
  );
}