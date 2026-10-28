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
              className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-medium"
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
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white card-tint-blue shadow-sm" styles={{ body: { padding: "12px 14px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <Text type="secondary" className="text-[10px] sm:text-xs font-semibold uppercase truncate block">Total Liquidity</Text>
                <div className="text-base sm:text-2xl font-black text-blue-900 mt-0.5 truncate">
                  ৳{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <Text type="secondary" className="text-[10px] sm:text-xs truncate block">Across {accounts.length} accounts</Text>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600">
                <WalletOutlined className="text-base sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white card-tint-emerald shadow-sm" styles={{ body: { padding: "12px 14px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <Text type="secondary" className="text-[10px] sm:text-xs font-semibold uppercase truncate block">Main Cash In Hand</Text>
                <div className="text-base sm:text-2xl font-black text-emerald-900 mt-0.5 truncate">
                  ৳{defaultBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <Text type="secondary" className="text-[10px] sm:text-xs truncate block">
                  {defaultAccount?.accountName || "Default Cash"}
                </Text>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600">
                <BankOutlined className="text-base sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white card-tint-purple shadow-sm" styles={{ body: { padding: "12px 14px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <Text type="secondary" className="text-[10px] sm:text-xs font-semibold uppercase truncate block">Bank & Mobile</Text>
                <div className="text-base sm:text-2xl font-black text-purple-900 mt-0.5 truncate">
                  ৳{bankAndMobileBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <Text type="secondary" className="text-[10px] sm:text-xs truncate block">Liquid funds</Text>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-100 flex-shrink-0 flex items-center justify-center text-purple-600">
                <CreditCardOutlined className="text-base sm:text-xl" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="border-slate-100 bg-gradient-to-br from-slate-50 to-white card-tint-slate shadow-sm" styles={{ body: { padding: "12px 14px" } }}>
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <Text type="secondary" className="text-[10px] sm:text-xs font-semibold uppercase truncate block">Account Status</Text>
                <div className="text-base sm:text-2xl font-black text-slate-800 mt-0.5 truncate">
                  {accounts.filter((a) => a.isActive).length} / {accounts.length}
                </div>
                <Text type="secondary" className="text-[10px] sm:text-xs truncate block">Active accounts</Text>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-600">
                <CheckCircleOutlined className="text-base sm:text-xl" />
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
                          className={`relative border-2 ${
                            acc.isDefault ? "border-emerald-500 shadow-md" : "border-gray-200"
                          }`}
                          actions={[
                            canInject && (
                              <Button
                                type="text"
                                icon={<UploadOutlined />}
                                className="text-purple-600 font-semibold"
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
                                className="text-indigo-600 font-medium"
                                onClick={() => setTransferModalOpen(true)}
                              >
                                Transfer
                              </Button>
                            ),
                            <Button
                              type="text"
                              icon={<EditOutlined />}
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
                              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border">
                                {getAccountIcon(acc.accountType)}
                              </div>
                              <div>
                                <div className="font-bold text-base text-slate-900">
                                  {acc.accountName}
                                </div>
                                <div className="text-xs text-gray-500">
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

                          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-end">
                            <div>
                              <Text type="secondary" className="text-xs font-semibold uppercase">
                                Available Balance
                              </Text>
                              <div className="text-2xl font-black text-slate-800">
                                ৳{Number(acc.currentBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <Tag color={acc.isActive ? "green" : "default"}>
                              {acc.isActive ? "Active" : "Inactive"}
                            </Tag>
                          </div>

                          {acc.notes && (
                            <div className="mt-3 text-xs text-gray-400 italic">
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
