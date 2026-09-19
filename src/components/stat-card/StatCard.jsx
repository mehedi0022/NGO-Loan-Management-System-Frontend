import { Card, Skeleton, Statistic } from "antd";

export function StatCard({ title, value, prefix, suffix, loading = false }) {
  return (
    <Card className="stat-card">
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <Statistic
          title={title}
          value={value}
          prefix={prefix}
          suffix={suffix}
        />
      )}
    </Card>
  );
}
