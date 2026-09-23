import {
  ArrowLeftOutlined,
  EditOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Result,
  Row,
  Skeleton,
  Space,
  Tabs,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { AddressDetails } from "../components/AddressDetails.jsx";
import { DetailItem } from "../components/DetailItem.jsx";
import { GuarantorDetails } from "../components/GuarantorDetails.jsx";
import { MemberFinancialSummary } from "../components/MemberFinancialSummary.jsx";
import { MemberLoansTable } from "../components/MemberLoansTable.jsx";
import { CollectionHistoryTable } from "../components/CollectionHistoryTable.jsx";
import { SavingsSummaryCard } from "../components/SavingsSummaryCard.jsx";
import { SavingsTransactionHistoryTable } from "../components/SavingsTransactionHistoryTable.jsx";
import {
  useGetMemberByIdQuery,
  useGetMemberLoanPaymentsQuery,
  useGetMemberSavingsTransactionsQuery,
} from "../membersApi.js";
import { useGetLoansQuery } from "../../loans/loansApi.js";
import { LoanPaymentHistoryTable } from "../../collections/components/LoanPaymentHistoryTable.jsx";
import { useGetCollectionsQuery } from "../../collections/collectionsApi.js";
import { QuickSavingsCollectionModal } from "../../savings/components/QuickSavingsCollectionModal.jsx";
import { SavingsWithdrawalModal } from "../../savings/components/SavingsWithdrawalModal.jsx";
import { resolveUploadUrl } from "../../../utils/uploadUrl.js";
import {
  formatDate,
  formatEnum,
} from "../../loans/loanFormatters.js";

const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

export function MemberProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [savingsCollectionOpen, setSavingsCollectionOpen] = useState(false);
  const [savingsWithdrawalOpen, setSavingsWithdrawalOpen] = useState(false);
  const [loanPagination, setLoanPagination] = useState({ current: 1, pageSize: 10 });
  const [paymentPagination, setPaymentPagination] = useState({ current: 1, pageSize: 20 });
  const [savingsPagination, setSavingsPagination] = useState({ current: 1, pageSize: 20 });
  const [collectionPagination, setCollectionPagination] = useState({ current: 1, pageSize: 20 });

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMemberByIdQuery(id, {
    skip: !id,
  });

  const member = response?.data;
  const {
    data: loansResponse,
    isLoading: loansLoading,
    isFetching: loansFetching,
    isError: loansError,
    error: loansRequestError,
    refetch: refetchLoans,
  } = useGetLoansQuery(
    {
      page: loanPagination.current,
      limit: loanPagination.pageSize,
      memberId: Number(id),
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { skip: !id || activeTab !== "loans" },
  );
  const {
    data: paymentsResponse,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    isError: paymentsError,
    error: paymentsRequestError,
    refetch: refetchPayments,
  } = useGetMemberLoanPaymentsQuery(
    {
      memberId: Number(id),
      page: paymentPagination.current,
      limit: paymentPagination.pageSize,
      sortOrder: "desc",
    },
    { skip: !id || activeTab !== "loan-payments" },
  );
  const {
    data: savingsTransactionsResponse,
    isLoading: savingsTransactionsLoading,
    isFetching: savingsTransactionsFetching,
    isError: savingsTransactionsError,
    error: savingsTransactionsRequestError,
    refetch: refetchSavingsTransactions,
  } = useGetMemberSavingsTransactionsQuery(
    {
      memberId: Number(id),
      page: savingsPagination.current,
      limit: savingsPagination.pageSize,
      sortOrder: "desc",
    },
    { skip: !id || activeTab !== "savings" || !member?.savingsAccount },
  );
  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    isFetching: collectionsFetching,
    isError: collectionsError,
    error: collectionsRequestError,
    refetch: refetchCollections,
  } = useGetCollectionsQuery(
    {
      memberId: Number(id),
      page: collectionPagination.current,
      limit: collectionPagination.pageSize,
    },
    { skip: !id || activeTab !== "collections" },
  );

  const presentAddress = member?.addresses?.find(
    (address) => address.type === "PRESENT",
  );

  const fatherAddress = member?.addresses?.find(
    (address) => address.type === "FATHER_HOME",
  );

  const guarantor = member?.guarantors?.[0];
  const loans = loansResponse?.data ?? [];
  const payments = paymentsResponse?.data ?? [];
  const savingsTransactions = savingsTransactionsResponse?.data ?? [];
  const collections = collectionsResponse?.data?.data ?? [];
  const memberLoans = member?.loans ?? [];
  const detailedLoansById = new Map(memberLoans.map((loan) => [loan.id, loan]));
  const loansWithInstallments = loans.map((loan) => ({
    ...loan,
    installments: detailedLoansById.get(loan.id)?.installments ?? [],
  }));
  const loanSummary = memberLoans.reduce(
    (summary, loan) => ({
      total: summary.total + 1,
      active: summary.active + Number(loan.status === "ACTIVE"),
      completed: summary.completed + Number(loan.status === "COMPLETED"),
      awaiting: summary.awaiting + Number(loan.status === "PENDING" || loan.status === "APPROVED"),
    }),
    { total: 0, active: 0, completed: 0, awaiting: 0 },
  );

  if (isLoading) {
    return (
      <PageContainer>
        <Card>
          <Skeleton
            active
            avatar={{
              size: 92,
            }}
            paragraph={{
              rows: 8,
            }}
          />
        </Card>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <Result
          status="error"
          title="Failed to load member"
          subTitle={
            error?.data?.message ||
            "Something went wrong while loading the member."
          }
          extra={[
            <Button key="retry" type="primary" onClick={refetch}>
              Try Again
            </Button>,

            <Button key="back" onClick={() => navigate("/members")}>
              Back to Members
            </Button>,
          ]}
        />
      </PageContainer>
    );
  }

  if (!member) {
    return (
      <PageContainer>
        <Result
          status="404"
          title="Member not found"
          subTitle="The member you are looking for does not exist."
          extra={
            <Button type="primary" onClick={() => navigate("/members")}>
              Back to Members
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const tabItems = [
    {
      key: "overview",
      label: "Overview",

      children: (
        <Row gutter={[16, 16]}>
          {/* Basic Information */}
          <Col xs={24} lg={14}>
            <Card title="Personal Information" className="member-profile-card">
              <div className="member-profile-info-list">
                <DetailItem label="Member ID" value={member.memberId} />

                <DetailItem label="Mobile Number" value={member.mobileNumber} />

                <DetailItem label="NID" value={member.nidNumber} />

                <DetailItem label="Email" value={member.email} />

                <DetailItem label="Occupation" value={member.occupation} />

                <DetailItem label="Father Name" value={member.fatherName} />

                <DetailItem label="Mother Name" value={member.motherName} />

                <DetailItem label="Guardian Name" value={member.guardianName} />

                <DetailItem
                  label="Join Date"
                  value={formatDate(member.joinDate)}
                />

                <DetailItem
                  label="Status"
                  value={
                    <StatusTag
                      status={member.status}
                      label={formatEnum(member.status)}
                    />
                  }
                />
              </div>
            </Card>
          </Col>

          {/* Present Address */}
          <Col xs={24} lg={10}>
            <Card title="Present Address" className="member-profile-card">
              <AddressDetails address={presentAddress} />
            </Card>
          </Col>

          {/* Father Address */}
          {fatherAddress && (
            <Col xs={24} lg={12}>
              <Card title="Father / Permanent Address" className="member-profile-card">
                <AddressDetails address={fatherAddress} />
              </Card>
            </Col>
          )}

          {/* Guarantor */}
          {guarantor && (
            <Col xs={24} lg={12}>
              <Card
                title="Guarantor Information"
                className="member-profile-card"
              >
                <GuarantorDetails guarantor={guarantor} />
              </Card>
            </Col>
          )}

          {/* Notes */}
          {member.notes && (
            <Col xs={24}>
              <Card title="Notes" className="member-profile-card">
                <Typography.Paragraph
                  style={{
                    marginBottom: 0,
                  }}
                >
                  {member.notes}
                </Typography.Paragraph>
              </Card>
            </Col>
          )}
        </Row>
      ),
    },

    {
      key: "loans",
      label: "Loans",

      children: (
        <>
          {memberLoans.length > 0 && (
            <Row gutter={[16, 16]} className="member-profile-tab-stats">
              <Col xs={12} sm={6}><Card><Typography.Text type="secondary">Total Loans</Typography.Text><Typography.Title level={3}>{loanSummary.total}</Typography.Title></Card></Col>
              <Col xs={12} sm={6}><Card><Typography.Text type="secondary">Active</Typography.Text><Typography.Title level={3}>{loanSummary.active}</Typography.Title></Card></Col>
              <Col xs={12} sm={6}><Card><Typography.Text type="secondary">Completed</Typography.Text><Typography.Title level={3}>{loanSummary.completed}</Typography.Title></Card></Col>
              <Col xs={12} sm={6}><Card><Typography.Text type="secondary">Pending / Approved</Typography.Text><Typography.Title level={3}>{loanSummary.awaiting}</Typography.Title></Card></Col>
            </Row>
          )}
          <Card className="member-profile-card member-profile-table-card">
            {loansError ? (
              <Alert
                type="error"
                showIcon
                message={loansRequestError?.data?.message || "Unable to load member loans"}
                action={<Button onClick={refetchLoans}>Retry</Button>}
              />
            ) : (
              <MemberLoansTable
                loans={loansWithInstallments}
                loading={loansLoading || loansFetching}
                pagination={{
                  ...loanPagination,
                  total: loansResponse?.meta?.total ?? 0,
                }}
                onPaginationChange={(pagination) =>
                  setLoanPagination({
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                  })
                }
                onViewLoan={(loan) => navigate(`/loans/${loan.id}`)}
                onCreateLoan={() => navigate(`/loans/new?memberId=${member.id}`)}
              />
            )}
          </Card>
        </>
      ),
    },

    {
      key: "loan-payments",
      label: "Loan Payments",
      children: (
        <Card className="member-profile-card member-profile-table-card">
          {paymentsError ? (
            <Alert
              type="error"
              showIcon
              message={
                paymentsRequestError?.data?.message ||
                "Unable to load loan payment history"
              }
              action={<Button onClick={refetchPayments}>Retry</Button>}
            />
          ) : (
            <LoanPaymentHistoryTable
              payments={payments}
              loading={paymentsLoading || paymentsFetching}
              showLoan
              pagination={{
                ...paymentPagination,
                total: paymentsResponse?.meta?.total ?? 0,
              }}
              onPaginationChange={(pagination) =>
                setPaymentPagination({
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                })
              }
            />
          )}
        </Card>
      ),
    },

    {
      key: "savings",
      label: "Savings",

      children: (
        <Space direction="vertical" size={16} className="w-full">
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="primary" onClick={() => setSavingsCollectionOpen(true)}>
              Collect Savings
            </Button>
            <Button
              danger
              disabled={!member.savingsAccount || member.savingsAccount.status !== "ACTIVE"}
              onClick={() => setSavingsWithdrawalOpen(true)}
            >
              Withdraw Savings
            </Button>
          </div>
          <SavingsSummaryCard account={member.savingsAccount} />
          {member.savingsAccount && (
            <Card
              title="Savings Transactions"
              className="member-profile-card member-profile-table-card"
            >
              {savingsTransactionsError ? (
                <Alert
                  type="error"
                  showIcon
                  message={
                    savingsTransactionsRequestError?.data?.message ||
                    "Unable to load savings transactions"
                  }
                  action={<Button onClick={refetchSavingsTransactions}>Retry</Button>}
                />
              ) : (
                <SavingsTransactionHistoryTable
                  transactions={savingsTransactions}
                  loading={savingsTransactionsLoading || savingsTransactionsFetching}
                  pagination={{
                    ...savingsPagination,
                    total: savingsTransactionsResponse?.meta?.total ?? 0,
                  }}
                  onPaginationChange={(pagination) =>
                    setSavingsPagination({
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                    })
                  }
                />
              )}
            </Card>
          )}
        </Space>
      ),
    },
    {
      key: "collections",
      label: "Collections",
      children: (
        <Card className="member-profile-card member-profile-table-card">
          {collectionsError ? (
            <Alert
              type="error"
              showIcon
              message={
                collectionsRequestError?.data?.message ||
                "Unable to load collection history"
              }
              action={<Button onClick={refetchCollections}>Retry</Button>}
            />
          ) : (
            <CollectionHistoryTable
              collections={collections}
              loading={collectionsLoading || collectionsFetching}
              pagination={{
                ...collectionPagination,
                total: collectionsResponse?.data?.pagination?.total ?? 0,
              }}
              onPaginationChange={(pagination) =>
                setCollectionPagination({
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                })
              }
            />
          )}
        </Card>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="member-profile-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/members")}
        >
          Back to Members
        </Button>

        <Space wrap>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/members/${member.id}/edit`)}
          >
            Edit Member
          </Button>

          <Button
            type="primary"
            onClick={() => navigate(`/loans/new?memberId=${member.id}`)}
          >
            Create New Loan
          </Button>
        </Space>
      </div>

      {/* Refetch indicator */}
      {isFetching && (
        <Alert
          type="info"
          showIcon
          message="Refreshing member information..."
          style={{
            marginBottom: 16,
          }}
        />
      )}

      <div className="member-profile-overview-grid">
        <Card className="member-profile-hero">
          <div className="member-profile-identity">
            <Avatar
              size={92}
              className="member-profile-avatar"
              src={resolveUploadUrl(member.photoUrl) || undefined}
            >
              {getInitials(member.fullName)}
            </Avatar>

            <div>
              <Typography.Title level={2} style={{ marginBottom: 4 }}>
                {member.fullName}
              </Typography.Title>
              <Typography.Text type="secondary">
                Member ID: {member.memberId || "—"}
              </Typography.Text>
              <div className="member-profile-status">
                <StatusTag
                  status={member.status}
                  label={formatEnum(member.status)}
                />
              </div>
            </div>
          </div>

          <Typography.Text type="secondary" className="member-profile-caption">
            Member profile and account status
          </Typography.Text>
        </Card>

        <Card className="member-profile-fact-card">
          <div className="member-profile-fact">
            <Typography.Text type="secondary">Phone</Typography.Text>
            <Typography.Text strong>
              <PhoneOutlined /> {member.mobileNumber || "—"}
            </Typography.Text>
          </div>
        </Card>
        <Card className="member-profile-fact-card">
          <div className="member-profile-fact">
            <Typography.Text type="secondary">NID</Typography.Text>
            <Typography.Text strong>
              {member.nidNumber || "Not provided"}
            </Typography.Text>
          </div>
        </Card>
        <Card className="member-profile-fact-card">
          <div className="member-profile-fact">
            <Typography.Text type="secondary">Joined</Typography.Text>
            <Typography.Text strong>{formatDate(member.joinDate)}</Typography.Text>
          </div>
        </Card>
        <Card className="member-profile-fact-card">
          <div className="member-profile-fact">
            <Typography.Text type="secondary">Guarantor</Typography.Text>
            <Typography.Text strong>
              {guarantor?.fullName || "Not added"}
            </Typography.Text>
          </div>
        </Card>
      </div>

      <MemberFinancialSummary
        loans={memberLoans}
        savingsAccount={member.savingsAccount}
        loading={isFetching}
      />

      {/* Tabs */}
      <div className="member-profile-tabs">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      <QuickSavingsCollectionModal
        open={savingsCollectionOpen}
        member={member}
        onClose={() => setSavingsCollectionOpen(false)}
      />
      <SavingsWithdrawalModal
        open={savingsWithdrawalOpen}
        member={member}
        account={member.savingsAccount}
        onClose={() => setSavingsWithdrawalOpen(false)}
      />
    </PageContainer>
  );
}
