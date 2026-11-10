import { Alert, Button, Col, Row, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useSelector } from "react-redux";
import { can, permissions } from "../auth/permissions.js";
import { useGetActiveBusinessDayQuery } from "../dayClosing/dayClosingApi.js";
import { DayClosingModal } from "../dayClosing/components/DayClosingModal.jsx";

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
  const user = useSelector((state) => state.auth.user);
  const [trendDays, setTrendDays] = useState(7);
  const [closingModalOpen, setClosingModalOpen] = useState(false);

  const { data: activeDayData, refetch: refetchActiveDay } =
    useGetActiveBusinessDayQuery();
  const activeDay = activeDayData?.data;
  const isDeferred =
    activeDay?.status === "OPEN" &&
    activeDay?.businessDate &&
    activeDay.businessDate < dayjs().format("YYYY-MM-DD");
  const canCloseDay = can(user, permissions.dayClosingClose);
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetDashboardSummaryQuery({ trendDays });
  const summary = response?.data;
  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    isFetching: collectionsFetching,
    isError: collectionsError,
    error: collectionsRequestError,
    refetch: refetchCollections,
  } = useGetCollectionsQuery({ page: 1, limit: 5 });
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
      </div>

      {isDeferred && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
          className="mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30"
          message={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Deferred Day Closing: Business Day{" "}
                {dayjs(activeDay.businessDate).format("DD MMMM YYYY")} is still
                OPEN!
              </span>
              {canCloseDay && (
                <Button
                  type="primary"
                  size="small"
                  danger
                  onClick={() => setClosingModalOpen(true)}
                >
                  Review & Close Day
                </Button>
              )}
            </div>
          }
          description="The system date has passed midnight, but the previous business day has not been closed yet. All transactions are currently recording under the active business day. Please close the day to roll over to today."
        />
      )}

      {isError && (
        <Alert
          type={summary ? "warning" : "error"}
          showIcon
          className="mb-4"
          message={
            summary
              ? "Dashboard refresh failed"
              : "Unable to load dashboard summary"
          }
          description={
            summary
              ? "Showing the last available dashboard data."
              : error?.data?.message || "Please try again."
          }
          action={<Button onClick={refetch}>Retry</Button>}
        />
      )}

      {isFetching && summary && (
        <Typography.Text
          type="secondary"
          className="dashboard-refresh-status"
          aria-live="polite"
        >
          Refreshing dashboard data…
        </Typography.Text>
      )}

      {hasSummaryContent && (
        <>
          <DashboardOverview
            overview={summary?.overview}
            loading={initialLoading}
          />
          <TodayActivity today={summary?.today} loading={initialLoading} />
          <section
            className="dashboard-section"
            aria-label="Collection analytics"
          >
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
                <LoanPortfolioSummary
                  portfolio={summary?.loanPortfolio}
                  loading={initialLoading}
                />
              </Col>
            </Row>
          </section>
          <section
            className="dashboard-section"
            aria-label="Operational attention and savings"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <AttentionPanel
                  attention={summary?.attention}
                  loading={initialLoading}
                />
              </Col>
              <Col xs={24} xl={12}>
                <SavingsOverview
                  savings={summary?.savings}
                  today={summary?.today}
                  loading={initialLoading}
                />
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

      {canCloseDay && (
        <DayClosingModal
          open={closingModalOpen}
          onClose={() => {
            setClosingModalOpen(false);
            refetchActiveDay();
            refetch();
          }}
        />
      )}
    </PageContainer>
  );
}
