export default function RoleSelector({ role, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button
        onClick={() => onSelect("student")}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          border: role === "student" ? "2px solid #333" : "1px solid #ddd",
          background: role === "student" ? "#f5f5f5" : "#fff",
        }}
      >
        Öğrenci
      </button>

      <button
        onClick={() => onSelect("club")}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          border: role === "club" ? "2px solid #333" : "1px solid #ddd",
          background: role === "club" ? "#f5f5f5" : "#fff",
        }}
      >
        Kulüp
      </button>
    </div>
  );
}
