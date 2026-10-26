import {
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { StatCard } from "../../../components/stat-card/StatCard.jsx";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";
import { useGetDpsAccountsQuery } from "../dpsApi.js";
import { OpenDpsModal } from "../components/OpenDpsModal.jsx";
import { DepositDpsModal } from "../components/DepositDpsModal.jsx";
import { CloseDpsModal } from "../components/CloseDpsModal.jsx";
import { DpsScheduleModal } from "../components/DpsScheduleModal.jsx";

export function DpsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedDps, setSelectedDps] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeModalMode, setCloseModalMode] = useState("MATURITY");

  const handleOpenCloseModal = (record, mode) => {
    setSelectedDps(record);
    setCloseModalMode(mode);
    setCloseModalOpen(true);
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetDpsAccountsQuery({
      page,
      limit: pageSize,
      status: statusFilter || undefined,
      search: search || undefined,
    });

  const dpsAccounts = Array.isArray(data?.data?.accounts)
    ? data.data.accounts
    : Array.isArray(data?.data)
    ? data.data
    : [];
  const meta = data?.data?.meta ?? data?.meta ?? { total: dpsAccounts.length };

  // Calculate high-level stats from available data
  const totalAccounts = meta.total || 0;
  const activeCount = dpsAccounts.filter((d) => d.status === "ACTIVE").length;
  const totalDeposited = dpsAccounts.reduce(
    (sum, d) => sum + Number(d.totalPaidAmount || 0),
    0,
  );
  const totalMaturity = dpsAccounts.reduce(
    (sum, d) => sum + Number(d.maturityAmount || 0),
    0,
  );

  const columns = [
    {
      title: "DPS Number",
      dataIndex: "dpsNumber",
      key: "dpsNumber",
      render: (val, record) => (
        <div>
          <strong style={{ color: "#0284c7" }}>{val || `DPS-${record.id}`}</strong>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Started: {formatDate(record.startDate)}
          </div>
        </div>
      ),
    },
    {
      title: "Member",
      key: "member",
      render: (_, record) => {
        const member = record.member;
        if (!member) return "—";
        return (
          <div>
            <Link
              to={`/members/${member.id}`}
              style={{ fontWeight: 600, color: "#0958d9" }}
            >
              {member.fullName}
            </Link>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {member.memberId || `#${member.id}`} · {member.somiti?.name || "No Somiti"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Deposit Amount",
      dataIndex: "installmentAmount",
      key: "installmentAmount",
      render: (val, record) => (
        <div>
          <strong>{formatCurrency(val)}</strong>
          <div>
            <Tag
              color={record.frequency === "WEEKLY" ? "blue" : "purple"}
              style={{ fontSize: 10, lineHeight: "16px", marginTop: 2 }}
            >
              {record.frequency === "WEEKLY" ? "Weekly" : "Monthly"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Duration",
      dataIndex: "durationMonths",
      key: "durationMonths",
      render: (months, record) => {
        const isWk = record.frequency === "WEEKLY";
        const count = isWk ? Math.round((months / 12) * 52) : months;
        return isWk
          ? `${count} Wk (${months / 12} Yrs)`
          : `${months} Mo (${Math.floor(months / 12)} Yrs)`;
      },
    },
    {
      title: "Progress",
      key: "progress",
      render: (_, record) => {
        const isWk = record.frequency === "WEEKLY";
        const total = isWk
          ? Math.round(((record.durationMonths || 12) / 12) * 52)
          : record.durationMonths || 1;
        const percent = Math.min(
          100,
          Math.round(
            ((record.paidInstallments || 0) / total) * 100,
          ),
        );
        return (
          <div style={{ width: 130 }}>
            <Progress percent={percent} size="small" />
            <div style={{ fontSize: 10, color: "#64748b" }}>
              {record.paidInstallments || 0} / {total} Installments
            </div>
          </div>
        );
      },
    },
    {
      title: "Total Paid",
      dataIndex: "totalPaidAmount",
      key: "totalPaidAmount",
      render: (val) => (
        <span style={{ color: "#047857", fontWeight: 700 }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Maturity",
      dataIndex: "maturityAmount",
      key: "maturityAmount",
      render: (val, record) => (
        <div>
          <strong style={{ color: "#0284c7" }}>{formatCurrency(val)}</strong>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Matures: {formatDate(record.maturityDate)}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = {
          ACTIVE: "green",
          MATURED: "blue",
          CLOSED: "default",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          {record.status === "ACTIVE" && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => {
                  setSelectedDps(record);
                  setDepositModalOpen(true);
                }}
              >
                Deposit
              </Button>
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleOpenCloseModal(record, "PREMATURE")}
              >
                Break / Cancel
              </Button>
            </>
          )}

          {record.status === "MATURED" && (
            <Button
              size="small"
              type="primary"
              style={{ background: "#059669", borderColor: "#059669" }}
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleOpenCloseModal(record, "MATURITY")}
            >
              Withdraw Maturity
            </Button>
          )}

          <Button
            size="small"
            icon={<CalendarOutlined />}
            onClick={() => {
              setSelectedDps(record);
              setScheduleModalOpen(true);
            }}
          >
            Schedule
          </Button>
        </Space>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: "#",
      dataIndex: "installmentNumber",
      key: "installmentNumber",
      width: 50,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (val) => formatDate(val),
    },
    {
      title: "Demand Amount",
      dataIndex: "amount",
      key: "amount",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Paid Date",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (val) => (val ? formatDate(val) : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (st) => (
        <Tag color={st === "PAID" ? "green" : st === "OVERDUE" ? "red" : "orange"}>
          {st}
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <Typography.Title level={2} className="mb-1!">
            Deposit Pension Scheme (DPS)
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage member recurring deposit accounts, monthly installments, and maturities.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setOpenModal(true)}
        >
          Open New DPS
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total DPS Accounts"
            value={totalAccounts}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Accounts"
            value={activeCount}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Deposited"
            value={formatCurrency(totalDeposited)}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Maturity Liability"
            value={formatCurrency(totalMaturity)}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={10}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search by DPS number, member name or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Col>
          <Col xs={24} md={12} className="flex justify-start md:justify-end">
            <Radio.Group
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="">All</Radio.Button>
              <Radio.Button value="ACTIVE">Active</Radio.Button>
              <Radio.Button value="MATURED">Matured</Radio.Button>
              <Radio.Button value="CLOSED">Closed</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* DPS Accounts Table */}
      <Card className="member-profile-table-card">
        {isError ? (
          <Alert
            type="error"
            showIcon
            message={error?.data?.message || "Failed to load DPS accounts"}
            action={<Button onClick={refetch}>Retry</Button>}
          />
        ) : (
          <Table
            dataSource={dpsAccounts}
            columns={columns}
            rowKey="id"
            loading={isLoading || isFetching}
            scroll={{ x: 1000 }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: meta.total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}
      </Card>

      {/* Modals */}
      <OpenDpsModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => refetch()}
      />

      {selectedDps && (
        <DepositDpsModal
          open={depositModalOpen}
          dpsAccount={selectedDps}
          member={selectedDps.member}
          onClose={() => {
            setDepositModalOpen(false);
            setSelectedDps(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {/* Installment Schedule Modal */}
      {selectedDps && (
        <DpsScheduleModal
          open={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setSelectedDps(null);
          }}
          dpsAccount={selectedDps}
        />
      )}

      {/* Close & Settlement Modal */}
      {closeModalOpen && selectedDps && (
        <CloseDpsModal
          open={closeModalOpen}
          onClose={() => {
            setCloseModalOpen(false);
            setSelectedDps(null);
          }}
          dps={selectedDps}
          initialMode={closeModalMode}
          onSuccess={refetch}
        />
      )}
    </PageContainer>
  );
}
