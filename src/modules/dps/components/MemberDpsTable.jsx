import {
  Button,
  Card,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";
import { OpenDpsModal } from "./OpenDpsModal.jsx";
import { DepositDpsModal } from "./DepositDpsModal.jsx";
import { CloseDpsModal } from "./CloseDpsModal.jsx";

export function MemberDpsTable({ member, dpsAccounts = [], onRefresh }) {
  const safeAccounts = Array.isArray(dpsAccounts)
    ? dpsAccounts
    : Array.isArray(dpsAccounts?.accounts)
    ? dpsAccounts.accounts
    : [];

  const [openDpsModalOpen, setOpenDpsModalOpen] = useState(false);
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

  const columns = [
    {
      title: "DPS Number",
      dataIndex: "dpsNumber",
      key: "dpsNumber",
      render: (val, record) => (
        <div>
          <strong style={{ color: "#0284c7" }}>{val || `DPS-${record.id}`}</strong>
          <div style={{ fontSize: 10, color: "#64748b" }}>
            Started: {formatDate(record.startDate)}
          </div>
        </div>
      ),
    },
    {
      title: "Monthly Deposit",
      dataIndex: "installmentAmount",
      key: "installmentAmount",
      render: (val) => <strong>{formatCurrency(val)}</strong>,
    },
    {
      title: "Duration / Tenure",
      dataIndex: "durationMonths",
      key: "durationMonths",
      render: (months) => `${months} Months (${Math.floor(months / 12)} Yrs)`,
    },
    {
      title: "Progress",
      key: "progress",
      render: (_, record) => {
        const percent = Math.min(
          100,
          Math.round(((record.paidInstallments || 0) / (record.durationMonths || 1)) * 100),
        );
        return (
          <div style={{ width: 140 }}>
            <Progress percent={percent} size="small" />
            <div style={{ fontSize: 10, color: "#64748b" }}>
              {record.paidInstallments || 0} of {record.durationMonths} installments paid
            </div>
          </div>
        );
      },
    },
    {
      title: "Total Deposited",
      dataIndex: "totalPaidAmount",
      key: "totalPaidAmount",
      render: (val) => (
        <span style={{ color: "#047857", fontWeight: 700 }}>{formatCurrency(val)}</span>
      ),
    },
    {
      title: "Maturity Value",
      dataIndex: "maturityAmount",
      key: "maturityAmount",
      render: (val, record) => (
        <div>
          <strong style={{ color: "#0284c7" }}>{formatCurrency(val)}</strong>
          <div style={{ fontSize: 10, color: "#64748b" }}>
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

  return (
    <Card
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: "#0284c7" }} />
            <span>Deposit Pension Scheme (DPS) Accounts</span>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenDpsModalOpen(true)}
          >
            Open New DPS
          </Button>
        </div>
      }
      size="small"
    >
      <Table
        dataSource={safeAccounts}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{
          emptyText: (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <Typography.Text type="secondary">
                This member does not have any DPS accounts yet.
              </Typography.Text>
              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setOpenDpsModalOpen(true)}
                >
                  Open First DPS
                </Button>
              </div>
            </div>
          ),
        }}
      />

      {/* Open DPS Modal */}
      <OpenDpsModal
        open={openDpsModalOpen}
        onClose={() => setOpenDpsModalOpen(false)}
        member={member}
        onSuccess={onRefresh}
      />

      {/* Deposit DPS Modal */}
      {selectedDps && (
        <DepositDpsModal
          open={depositModalOpen}
          onClose={() => {
            setDepositModalOpen(false);
            setSelectedDps(null);
          }}
          dpsAccount={selectedDps}
          onSuccess={onRefresh}
        />
      )}

      {/* Installment Schedule Modal */}
      {selectedDps && (
        <Modal
          open={scheduleModalOpen}
          onCancel={() => {
            setScheduleModalOpen(false);
            setSelectedDps(null);
          }}
          title={`DPS Installment Schedule — ${selectedDps.dpsNumber}`}
          width={700}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setScheduleModalOpen(false);
                setSelectedDps(null);
              }}
            >
              Close
            </Button>,
          ]}
        >
          <Table
            dataSource={selectedDps.installments || []}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 12 }}
            columns={[
              { title: "Inst #", dataIndex: "installmentNo", key: "installmentNo", align: "center" },
              {
                title: "Due Date",
                dataIndex: "dueDate",
                key: "dueDate",
                render: (val) => formatDate(val),
              },
              {
                title: "Installment Amount",
                dataIndex: "amount",
                key: "amount",
                align: "right",
                render: (val) => formatCurrency(val),
              },
              {
                title: "Paid Amount",
                dataIndex: "paidAmount",
                key: "paidAmount",
                align: "right",
                render: (val) => (
                  <span style={{ color: Number(val) > 0 ? "#047857" : "inherit" }}>
                    {formatCurrency(val)}
                  </span>
                ),
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                align: "center",
                render: (status) => {
                  const colors = { PAID: "green", PARTIAL: "orange", PENDING: "default" };
                  return <Tag color={colors[status] || "default"}>{status}</Tag>;
                },
              },
              {
                title: "Paid At",
                dataIndex: "paidAt",
                key: "paidAt",
                render: (val) => (val ? formatDate(val) : "—"),
              },
            ]}
          />
        </Modal>
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
          onSuccess={onRefresh}
        />
      )}
    </Card>
  );
}
