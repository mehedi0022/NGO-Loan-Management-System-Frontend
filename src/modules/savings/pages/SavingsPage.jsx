import {
  ArrowLeftOutlined,
  BankOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PhoneOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { formatDate } from "../../loans/loanFormatters.js";
import { PrintableMemberPassbookModal } from "../../members/components/PrintableMemberPassbookModal.jsx";
import { SavingsSummaryCard } from "../../members/components/SavingsSummaryCard.jsx";
import { SavingsTransactionHistoryTable } from "../../members/components/SavingsTransactionHistoryTable.jsx";
import {
  useGetAllMembersQuery,
  useGetMemberSavingsTransactionsQuery,
} from "../../members/membersApi.js";
import { useGetActiveSomitiesQuery } from "../../somities/somitiesApi.js";
import { MemberSavingsSelector } from "../components/MemberSavingsSelector.jsx";
import { QuickSavingsCollectionModal } from "../components/QuickSavingsCollectionModal.jsx";
import { SavingsWithdrawalModal } from "../components/SavingsWithdrawalModal.jsx";
import { useGetMemberSavingsQuery } from "../savingsApi.js";

const { Title, Text } = Typography;

export function SavingsPage() {
  const [memberId, setMemberId] = useState();
  const [search, setSearch] = useState("");
  const [somitiId, setSomitiId] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [passbookOpen, setPassbookOpen] = useState(false);
  const [modalMember, setModalMember] = useState(null);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  // Fetch Somities for filter dropdown
  const { data: somitiesData } = useGetActiveSomitiesQuery();

  // Fetch Members for Directory View
  const { data: membersData, isLoading: membersLoading } =
    useGetAllMembersQuery(
      {
        page,
        limit: pageSize,
        search: search || undefined,
        somitiId: somitiId || undefined,
        status: "ACTIVE",
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      { skip: Boolean(memberId) },
    );

  const membersList = membersData?.data ?? [];
  const membersMeta = membersData?.meta ?? { total: 0 };

  // Fetch specific member savings details
  const { data, isFetching, isError, error } = useGetMemberSavingsQuery(
    memberId,
    {
      skip: !memberId,
    },
  );
  const member = data?.data;

  // Fetch member savings transactions
  const { data: transactionsData, isFetching: transactionsFetching } =
    useGetMemberSavingsTransactionsQuery(
      {
        memberId,
        page: pagination.current,
        limit: pagination.pageSize,
        sortOrder: "desc",
      },
      { skip: !memberId },
    );

  const selectMember = (id) => {
    setMemberId(id);
    setPagination({ current: 1, pageSize: 20 });
  };

  const directoryColumns = [
    {
      title: "Member",
      key: "member",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            src={record.photoUrl}
            icon={!record.photoUrl && <UserOutlined />}
            className="bg-emerald-100 text-emerald-700 flex-shrink-0"
          />
          <div>
            <div
              className="font-bold text-sm text-slate-900 dark:text-slate-100 cursor-pointer hover:text-emerald-600 transition-colors"
              onClick={() => selectMember(record.id)}
            >
              {record.fullName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {record.memberId || `#${record.id}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Somiti",
      key: "somiti",
      render: (_, record) => (
        <div>
          <div className="font-medium text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <BankOutlined className="text-slate-400" />
            <span>{record.somiti?.name || "No Somiti Assigned"}</span>
          </div>
          {record.somiti?.meetingDay && (
            <div className="text-[11px] text-slate-400 capitalize">
              Meeting: {record.somiti.meetingDay.toLowerCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
      render: (mobile) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
          {mobile ? `+88 ${mobile}` : "—"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 100,
      render: (st) => (
        <Tag color={st === "ACTIVE" ? "success" : "default"}>
          {st || "ACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 260,
      render: (_, record) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => selectMember(record.id)}
            className="bg-emerald-600 hover:bg-emerald-700 font-medium"
          >
            View Ledger
          </Button>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => {
              setModalMember(record);
              setDepositOpen(true);
            }}
          >
            Collect
          </Button>
          <Button
            danger
            size="small"
            icon={<MinusCircleOutlined />}
            onClick={() => {
              setModalMember(record);
              setWithdrawalOpen(true);
            }}
          >
            Withdraw
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title
            level={2}
            className="m-0! text-slate-900 dark:text-slate-50 font-bold"
          >
            Savings Management
          </Title>
          <Text type="secondary" className="text-sm">
            Collect savings, process member withdrawals, and audit savings
            transaction ledgers.
          </Text>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => {
              setModalMember(member || null);
              setDepositOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            style={{ backgroundColor: "#059669", borderColor: "#059669" }}
          >
            Collect Savings
          </Button>

          <Button
            danger
            icon={<MinusCircleOutlined />}
            onClick={() => {
              setModalMember(member || null);
              setWithdrawalOpen(true);
            }}
            className="font-medium"
          >
            Withdraw Savings
          </Button>
        </div>
      </div>

      {/* 1. Directory View (when NO member is selected) */}
      {!memberId ? (
        <Card
          className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          {/* Card Header & Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2">
                <WalletOutlined className="text-emerald-600 text-lg" />
                <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Members Savings Directory
                </span>
                <Tag color="blue" className="ml-1 font-semibold">
                  {membersMeta.total || membersList.length} Active Members
                </Tag>
              </div>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearch("");
                  setSomitiId(undefined);
                  setPage(1);
                }}
                size="middle"
                className="text-slate-600 dark:text-slate-300"
              >
                Reset Filters
              </Button>
            </div>

            {/* Filter Inputs Grid */}
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={12} md={9}>
                <Input
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Search by name, ID, phone, NID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg"
                  size="middle"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  allowClear
                  className="w-full"
                  placeholder="All Somities"
                  value={somitiId}
                  onChange={(val) => {
                    setSomitiId(val);
                    setPage(1);
                  }}
                  size="middle"
                  options={[
                    { value: undefined, label: "All Somities" },
                    ...(somitiesData?.data ?? []).map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.code || s.somitiId})`,
                    })),
                  ]}
                />
              </Col>
              <Col xs={24} sm={24} md={9}>
                <MemberSavingsSelector
                  value={memberId}
                  onChange={(id) => selectMember(id)}
                  placeholder="Quick jump directly to member..."
                  size="middle"
                />
              </Col>
            </Row>
          </div>

          {/* Members Table */}
          <Table
            rowKey="id"
            loading={membersLoading}
            dataSource={membersList}
            scroll={{ x: 800 }}
            pagination={{
              current: page,
              pageSize,
              total: membersMeta.total || membersList.length,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} members`,
            }}
            columns={directoryColumns}
          />
        </Card>
      ) : (
        /* 2. Member Dossier View (when member IS selected) */
        <div className="space-y-4">
          {/* Top Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setMemberId(undefined)}
              className="font-medium"
            >
              Back to Member Directory
            </Button>
            <div className="flex items-center gap-2 min-w-[280px]">
              <span className="text-xs text-slate-500 whitespace-nowrap">
                Switch Member:
              </span>
              <div className="flex-1">
                <MemberSavingsSelector
                  value={memberId}
                  onChange={selectMember}
                  placeholder="Select another member..."
                />
              </div>
            </div>
          </div>

          {isError ? (
            <Alert
              type="error"
              showIcon
              message="Unable to load member savings account"
              description={
                error?.data?.message ||
                "Something went wrong while retrieving member savings data."
              }
            />
          ) : isFetching && !member ? (
            <Card className="rounded-xl py-12 text-center border border-slate-200 dark:border-slate-800">
              <Spin size="large" tip="Loading savings account..." />
            </Card>
          ) : member ? (
            <>
              {/* Member Profile Banner */}
              <Card
                className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm "
                styles={{ body: { padding: "18px 20px" } }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      size={54}
                      src={member.photoUrl}
                      icon={!member.photoUrl && <UserOutlined />}
                      className="bg-emerald-100 text-emerald-700 text-xl font-bold flex-shrink-0 border-2 border-emerald-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Title
                          level={4}
                          className="m-0! text-slate-900 dark:text-slate-100"
                        >
                          {member.fullName}
                        </Title>
                        <Tag
                          color={
                            member.status === "ACTIVE" ? "success" : "default"
                          }
                        >
                          {member.status || "ACTIVE"}
                        </Tag>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {member.memberId || `#${member.id}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {member.somiti?.name && (
                          <span className="flex items-center gap-1">
                            <BankOutlined className="text-slate-400" />
                            {member.somiti.name}
                          </span>
                        )}
                        {member.mobileNumber && (
                          <span className="flex items-center gap-1 font-mono">
                            <PhoneOutlined className="text-slate-400" />
                            {member.mobileNumber}
                          </span>
                        )}
                        {member.joinDate && (
                          <span>Joined: {formatDate(member.joinDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <Space wrap>
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={() => setPassbookOpen(true)}
                      className="font-medium"
                    >
                      Print Savings Ledger
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusCircleOutlined />}
                      onClick={() => {
                        setModalMember(member);
                        setDepositOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    >
                      Collect Savings
                    </Button>
                    <Button
                      danger
                      icon={<MinusCircleOutlined />}
                      disabled={
                        !member.savingsAccount ||
                        member.savingsAccount.status !== "ACTIVE"
                      }
                      onClick={() => {
                        setModalMember(member);
                        setWithdrawalOpen(true);
                      }}
                      className="font-medium"
                    >
                      Withdraw Savings
                    </Button>
                  </Space>
                </div>
              </Card>

              {/* 4 Modern Stat Cards (Zero negative margin, 100% flush grid) */}
              <div className="mb-4"></div>
              <SavingsSummaryCard account={member.savingsAccount} />

              {/* Transaction History Card */}
              <Card
                title={
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Savings Transaction Ledger
                    </span>
                    <span className="text-xs font-normal text-slate-500">
                      {transactionsData?.meta?.total ?? 0} total transactions
                    </span>
                  </div>
                }
                className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
              >
                <SavingsTransactionHistoryTable
                  transactions={transactionsData?.data ?? []}
                  loading={transactionsFetching}
                  pagination={{
                    ...pagination,
                    total: transactionsData?.meta?.total ?? 0,
                  }}
                  onPaginationChange={(next) =>
                    setPagination({
                      current: next.current,
                      pageSize: next.pageSize,
                    })
                  }
                />
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Quick Savings Collection Modal */}
      <QuickSavingsCollectionModal
        open={depositOpen}
        member={modalMember || member}
        onClose={() => {
          setDepositOpen(false);
          setModalMember(null);
        }}
      />

      {/* Savings Withdrawal Modal */}
      <SavingsWithdrawalModal
        open={withdrawalOpen}
        member={modalMember || member}
        account={(modalMember || member)?.savingsAccount}
        onClose={() => {
          setWithdrawalOpen(false);
          setModalMember(null);
        }}
      />

      {/* Passbook Print Modal */}
      <PrintableMemberPassbookModal
        open={passbookOpen}
        member={member}
        savingsTransactions={transactionsData?.data ?? []}
        loans={[]}
        defaultSection="savings"
        onClose={() => setPassbookOpen(false)}
      />
    </PageContainer>
  );
}
