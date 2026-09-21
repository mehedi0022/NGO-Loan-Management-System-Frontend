export function DetailItem({ label, value, icon }) {
  return (
    <div className="member-profile-detail">
      <div className="member-profile-detail-label">
        {icon}
        <span>{label}</span>
      </div>

      <strong>{value || "—"}</strong>
    </div>
  );
}
