export default function LoadingState({ message = "Loading..." }) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>{message}</p>
    </div>
  );
}