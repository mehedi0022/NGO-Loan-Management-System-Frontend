import { Card, Skeleton, Statistic, Typography, theme } from "antd";

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  note,
  icon,
  accent,
  loading = false,
  onClick,
  ariaLabel,
  className = "",
}) {
  const { token } = theme.useToken();
  const interactive = !loading && typeof onClick === "function";
  const accentColor = accent || token.colorPrimary;

  const handleKeyDown = (event) => {
    if (!interactive || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick();
  };

  return (
    <Card
      className={`stat-card ${interactive ? "stat-card-interactive" : ""} ${className}`.trim()}
      styles={{ body: { height: "100%" } }}
      style={{
        borderInlineStartColor: accentColor,
        "--stat-card-accent": accentColor,
      }}
      hoverable={interactive}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? "link" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel || `View ${title}` : undefined}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: note ? 1 : 0 }} title={{ width: "65%" }} />
      ) : (
        <div className="stat-card-content">
          <div className="stat-card-main">
            <Statistic
              title={title}
              value={value}
              prefix={prefix}
              suffix={suffix}
            />
            {note && (
              <Typography.Text type="secondary" className="stat-card-note">
                {note}
              </Typography.Text>
            )}
          </div>
          {icon && (
            <span
              className="stat-card-icon"
              style={{ color: accentColor, background: token.colorFillSecondary }}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
