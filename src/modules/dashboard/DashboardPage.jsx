import { Alert, Button, Col, Row, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { DashboardOverview } from "./components/DashboardOverview.jsx";
import { TodayActivity } from "./components/TodayActivity.jsx";
import { CollectionTrendChart } from "./components/CollectionTrendChart.jsx";
import { AttentionPanel } from "./components/AttentionPanel.jsx";
import { LoanPortfolioSummary } from "./components/LoanPortfolioSummary.jsx";
import { SavingsOverview } from "./components/SavingsOverview.jsx";
import { RecentCollectionsTable } from "./components/RecentCollectionsTable.jsx";
import { useGetCollectionsQuery } from "../collections/collectionsApi.js";
import { useGetDashboardSummaryQuery } from "./dashboardApi.js";

export function DashboardPage() {
  const [trendDays, setTrendDays] = useState(7);
  const { data: response, isLoading, isFetching, isError, error, refetch } =
    useGetDashboardSummaryQuery({ trendDays });
  const summary = response?.data;
  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    isFetching: collectionsFetching,
    isError: collectionsError,
    error: collectionsRequestError,
    refetch: refetchCollections,
  } = useGetCollectionsQuery({ page: 1, limit: 5 });
  const operationalDate = summary?.operationalDate
    ? dayjs(summary.operationalDate).format("DD MMM YYYY")
    : "";
  const initialLoading = isLoading && !summary;
  const hasSummaryContent = Boolean(summary) || initialLoading;

  return (
    <PageContainer>
      <div className="dashboard-heading dashboard-heading-row">
        <div>
          <Typography.Title level={2}>Dashboard</Typography.Title>
          <Typography.Text type="secondary">
            Overview of NGO loan and savings operations
          </Typography.Text>
        </div>
        {operationalDate && (
          <Typography.Text type="secondary">{operationalDate}</Typography.Text>
        )}
      </div>

      {isError && (
        <Alert
          type={summary ? "warning" : "error"}
          showIcon
          className="mb-4"
          message={summary ? "Dashboard refresh failed" : "Unable to load dashboard summary"}
          description={
            summary
              ? "Showing the last available dashboard data."
              : error?.data?.message || "Please try again."
          }
          action={<Button onClick={refetch}>Retry</Button>}
        />
      )}

      {isFetching && summary && (
        <Typography.Text type="secondary" className="dashboard-refresh-status" aria-live="polite">
          Refreshing dashboard data…
        </Typography.Text>
      )}

      {hasSummaryContent && (
        <>
          <DashboardOverview overview={summary?.overview} loading={initialLoading} />
          <TodayActivity today={summary?.today} loading={initialLoading} />
          <section className="dashboard-section" aria-label="Collection analytics">
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={16}>
                <CollectionTrendChart
                  data={summary?.collectionTrend}
                  trendDays={trendDays}
                  onTrendDaysChange={setTrendDays}
                  loading={isLoading || isFetching}
                />
              </Col>
              <Col xs={24} xl={8}>
                <LoanPortfolioSummary portfolio={summary?.loanPortfolio} loading={initialLoading} />
              </Col>
            </Row>
          </section>
          <section className="dashboard-section" aria-label="Operational attention and savings">
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <AttentionPanel attention={summary?.attention} loading={initialLoading} />
              </Col>
              <Col xs={24} xl={12}>
                <SavingsOverview savings={summary?.savings} today={summary?.today} loading={initialLoading} />
              </Col>
            </Row>
          </section>
        </>
      )}
      <section className="dashboard-section" aria-label="Recent collections">
        <RecentCollectionsTable
          collections={collectionsResponse?.data?.data ?? []}
          loading={collectionsLoading || collectionsFetching}
          error={collectionsError ? collectionsRequestError : null}
          onRetry={refetchCollections}
        />
      </section>
    </PageContainer>
  );
}
