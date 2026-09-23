import { Card, Empty, Segmented, Skeleton, theme } from "antd";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "../../loans/loanFormatters.js";

const formatAxisAmount = (value) => {
  const amount = Number(value);
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
};

export function CollectionTrendChart({
  data = [],
  trendDays = 7,
  onTrendDaysChange,
  loading = false,
}) {
  const { token } = theme.useToken();
  const chartData = data.map((item) => ({
    ...item,
    loanCollected: Number(item.loanCollected || 0),
    savingsCollected: Number(item.savingsCollected || 0),
  }));
  const hasCollections = chartData.some(
    (item) => item.loanCollected > 0 || item.savingsCollected > 0,
  );

  return (
    <Card
      title="Collection Trend"
      className="dashboard-panel-card"
      extra={
        <Segmented
          size="small"
          disabled={loading}
          value={trendDays}
          onChange={onTrendDaysChange}
          options={[
            { label: "7 Days", value: 7 },
            { label: "30 Days", value: 30 },
          ]}
        />
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 7 }} />
      ) : !hasCollections ? (
        <Empty description={`No collections in the last ${trendDays} days`} />
      ) : (
        <div className="dashboard-trend-chart" role="img" aria-label={`${trendDays}-day loan and savings collection chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={token.colorBorderSecondary} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => dayjs(value).format(trendDays === 7 ? "ddd" : "DD MMM")}
                tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                axisLine={{ stroke: token.colorBorderSecondary }}
                tickLine={false}
                minTickGap={12}
              />
              <YAxis
                tickFormatter={formatAxisAmount}
                tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                labelFormatter={(value) => dayjs(value).format("DD MMM YYYY")}
                formatter={(value, name) => [formatCurrency(value), name]}
                contentStyle={{
                  background: token.colorBgElevated,
                  borderColor: token.colorBorderSecondary,
                  borderRadius: token.borderRadiusLG,
                  color: token.colorText,
                }}
              />
              <Legend wrapperStyle={{ color: token.colorTextSecondary, fontSize: 12 }} />
              <Bar dataKey="loanCollected" name="Loan Collection" fill={token.colorPrimary} radius={[3, 3, 0, 0]} />
              <Bar dataKey="savingsCollected" name="Savings Collection" fill={token.colorSuccess} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
