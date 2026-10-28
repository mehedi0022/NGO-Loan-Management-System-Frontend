import {
  BankOutlined,
  CreditCardOutlined,
  EditOutlined,
  PlusOutlined,
  SwapOutlined,
  UploadOutlined,
  WalletOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Spin,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { can, permissions } from "../../auth/permissions.js";
import { useGetAccountsQuery } from "../accountsApi.js";
import { CreateAccountModal } from "../components/CreateAccountModal.jsx";
import { DailyCashSheetView } from "../components/DailyCashSheetView.jsx";
import { InjectCapitalModal } from "../components/InjectCapitalModal.jsx";
import { LedgerTransactionsTable } from "../components/LedgerTransactionsTable.jsx";
import { ProfitLossView } from "../components/ProfitLossView.jsx";
import { TransferFundsModal } from "../components/TransferFundsModal.jsx";

const { Title, Text } = Typography;

export function AccountsPage() {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("accounts");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [injectModalOpen, setInjectModalOpen] = useState(false);
  const [selectedAccountForInject, setSelectedAccountForInject] = useState(null);

  const { data: accountsData, isLoading } = useGetAccountsQuery();
  const accounts = Array.isArray(accountsData?.data)
    ? accountsData.data
    : Array.isArray(accountsData?.data?.accounts)
    ? accountsData.data.accounts
    : [];
  const summary = accountsData?.data?.summary;

  const totalBalance = summary?.totalFunds != null
    ? Number(summary.totalFunds)
    : accounts.reduce((acc, a) => acc + Number(a.currentBalance || 0), 0);

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const defaultBalance = Number(defaultAccount?.currentBalance || 0);

  const bankAndMobileBalance = summary?.totalBank != null
    ? Number(summary.totalBank)
    : accounts
        .filter((a) => a.accountType !== "CASH")
        .reduce((acc, a) => acc + Number(a.currentBalance || 0), 0);

  const isAdminOrManager =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";

  const canCreate = can(user, permissions.accountsCreate) || isAdminOrManager;
  const canTransfer = can(user, permissions.accountsTransfer) || isAdminOrManager;
  const canInject =
    can(user, permissions.accountsInjectCapital) ||
    can(user, permissions.accountsTransfer) ||
    can(user, permissions.accountsCreate) ||
    isAdminOrManager;

  const getAccountIcon = (type) => {
    switch (type) {
      case "BANK":
        return <BankOutlined className="text-blue-500 text-2xl" />;
      case "MOBILE_BANKING":
        return <CreditCardOutlined className="text-pink-500 text-2xl" />;
      case "CASH":
      default:
        return <WalletOutlined className="text-emerald-500 text-2xl" />;
    }
  };

  return (
    <PageContainer>
      <div className="accounts-page space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} style={{ marginBottom: 2 }}>
            Accounts & Cash Management
          </Title>
          <Text type="secondary">
            Financial accounts, automated ledger, daily cash reconciliation, and profit & loss
          </Text>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canInject && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => {
                setSelectedAccountForInject(defaultAccount);
                setInjectModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm"
              style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
            >
              Add Capital
            </Button>
          )}

          {canTransfer && (
            <Button
              icon={<SwapOutlined />}
              onClick={() => setTransferModalOpen(true)}
              className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium"
            >
              Transfer Funds
            </Button>
          )}

          {canCreate && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedAccountForEdit(null);
                setCreateModalOpen(true);
              }}
              className="font-medium"
            >
              New Account
            </Button>
          )}
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={12} lg={6}>
          <Card className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm rounded-xl" styles={{ body: { padding: "14px 16px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 block truncate">
                  Total Liquidity
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
                  ৳{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  Across {accounts.length} accounts
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <WalletOutlined className="text-lg sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm rounded-xl" styles={{ body: { padding: "14px 16px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block truncate">
                  Main Cash In Hand
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
                  ৳{defaultBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  {defaultAccount?.accountName || "Default Cash"}
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <BankOutlined className="text-lg sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm rounded-xl" styles={{ body: { padding: "14px 16px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 block truncate">
                  Bank & Mobile
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
                  ৳{bankAndMobileBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  Liquid funds
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-300">
                <CreditCardOutlined className="text-lg sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 shadow-sm rounded-xl" styles={{ body: { padding: "14px 16px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block truncate">
                  Account Status
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
                  {accounts.filter((a) => a.isActive).length} / {accounts.length}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  Active accounts
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <CheckCircleOutlined className="text-lg sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="accounts-main-tabs"
        items={[
          {
            key: "accounts",
            label: (
              <span>
                <WalletOutlined /> Financial Accounts
              </span>
            ),
            children: (
              <div className="mt-4">
                {isLoading ? (
                  <div className="py-20 text-center">
                    <Spin size="large" tip="Loading financial accounts..." />
                  </div>
                ) : accounts.length === 0 ? (
                  <Empty description="No financial accounts registered yet" />
                ) : (
                  <Row gutter={[16, 16]}>
                    {accounts.map((acc) => (
                      <Col xs={24} sm={12} lg={8} key={acc.id}>
                        <Card
                          hoverable
                          className={`rounded-xl border transition-all ${
                            acc.isDefault
                              ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                              : "border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                          actions={[
                            canInject && (
                              <Button
                                type="text"
                                icon={<UploadOutlined />}
                                className="text-purple-600 font-semibold hover:text-purple-700"
                                onClick={() => {
                                  setSelectedAccountForInject(acc);
                                  setInjectModalOpen(true);
                                }}
                              >
                                Add Capital
                              </Button>
                            ),
                            canTransfer && (
                              <Button
                                type="text"
                                icon={<SwapOutlined />}
                                className="text-indigo-600 font-medium hover:text-indigo-700"
                                onClick={() => setTransferModalOpen(true)}
                              >
                                Transfer
                              </Button>
                            ),
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              className="text-slate-600 dark:text-slate-300"
                              onClick={() => {
                                setSelectedAccountForEdit(acc);
                                setCreateModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>,
                          ].filter(Boolean)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-xl">
                                {getAccountIcon(acc.accountType)}
                              </div>
                              <div>
                                <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                                  {acc.accountName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {acc.accountType} {acc.accountNumber ? `• ${acc.accountNumber}` : ""}
                                </div>
                              </div>
                            </div>
                            {acc.isDefault && (
                              <Tag color="success" className="font-semibold">
                                Default Cash
                              </Tag>
                            )}
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Available Balance
                              </span>
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">
                                ৳{Number(acc.currentBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <Tag color={acc.isActive ? "green" : "default"}>
                              {acc.isActive ? "Active" : "Inactive"}
                            </Tag>
                          </div>

                          {acc.notes && (
                            <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 italic">
                              {acc.notes}
                            </div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
          {
            key: "daily-sheet",
            label: (
              <span>
                <BankOutlined /> Daily Cash Sheet
              </span>
            ),
            children: (
              <div className="mt-4">
                <DailyCashSheetView />
              </div>
            ),
          },
          {
            key: "profit-loss",
            label: (
              <span>
                <CreditCardOutlined /> Profit & Loss Statement
              </span>
            ),
            children: (
              <div className="mt-4">
                <ProfitLossView />
              </div>
            ),
          },
          {
            key: "ledger",
            label: (
              <span>
                <SwapOutlined /> Transaction Ledger
              </span>
            ),
            children: (
              <div className="mt-4">
                <LedgerTransactionsTable />
              </div>
            ),
          },
        ]}
      />

      {/* Modals */}
      <CreateAccountModal
        open={createModalOpen}
        account={selectedAccountForEdit}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedAccountForEdit(null);
        }}
      />

      <TransferFundsModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
      />

      <InjectCapitalModal
        open={injectModalOpen}
        account={selectedAccountForInject}
        onClose={() => {
          setInjectModalOpen(false);
          setSelectedAccountForInject(null);
        }}
      />
      </div>
    </PageContainer>
  );
}
export default AccountsPage;
