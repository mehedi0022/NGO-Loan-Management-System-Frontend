import { BankOutlined, MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Space, Spin, Typography } from "antd";
import { useState } from "react";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { SavingsSummaryCard } from "../../members/components/SavingsSummaryCard.jsx";
import { SavingsTransactionHistoryTable } from "../../members/components/SavingsTransactionHistoryTable.jsx";
import { useGetMemberSavingsTransactionsQuery } from "../../members/membersApi.js";
import { MemberSavingsSelector } from "../components/MemberSavingsSelector.jsx";
import { QuickSavingsCollectionModal } from "../components/QuickSavingsCollectionModal.jsx";
import { SavingsWithdrawalModal } from "../components/SavingsWithdrawalModal.jsx";
import { useGetMemberSavingsQuery } from "../savingsApi.js";

export function SavingsPage() {
  const [memberId, setMemberId] = useState();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const { data, isFetching, isError, error } = useGetMemberSavingsQuery(memberId, { skip: !memberId });
  const member = data?.data;
  const { data: transactionsData, isFetching: transactionsFetching } = useGetMemberSavingsTransactionsQuery(
    { memberId, page: pagination.current, limit: pagination.pageSize, sortOrder: "desc" },
    { skip: !memberId || !member?.savingsAccount },
  );

  const selectMember = (value) => {
    setMemberId(value);
    setPagination({ current: 1, pageSize: 20 });
  };

  return (
    <PageContainer>
      <div className="mb-5">
        <Typography.Title level={2} className="mb-1!">Savings</Typography.Title>
        <Typography.Text type="secondary">Collect savings, process withdrawals and review member balances.</Typography.Text>
      </div>
      <Card className="mb-4" title={<Space><BankOutlined /> Find Member</Space>}>
        <MemberSavingsSelector value={memberId} onChange={selectMember} />
      </Card>

      {!memberId ? (
        <Card><Empty description="Select a member to view their savings account" /></Card>
      ) : isError ? (
        <Alert type="error" showIcon message="Unable to load savings account" description={error?.data?.message} />
      ) : isFetching && !member ? (
        <Card><Spin /></Card>
      ) : member ? (
        <Space direction="vertical" size={16} className="w-full">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Typography.Title level={4} className="mb-1!">{member.fullName}</Typography.Title>
                <Typography.Text type="secondary">{member.memberId || `#${member.id}`} · {member.mobileNumber}</Typography.Text>
              </div>
              <Space wrap>
                <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => setDepositOpen(true)}>Collect Savings</Button>
                <Button danger icon={<MinusCircleOutlined />} disabled={!member.savingsAccount || member.savingsAccount.status !== "ACTIVE"} onClick={() => setWithdrawalOpen(true)}>Withdraw Savings</Button>
              </Space>
            </div>
          </Card>
          <SavingsSummaryCard account={member.savingsAccount} />
          {member.savingsAccount && (
            <Card title="Savings Transactions" className="member-profile-table-card">
              <SavingsTransactionHistoryTable
                transactions={transactionsData?.data ?? []}
                loading={transactionsFetching}
                pagination={{ ...pagination, total: transactionsData?.meta?.total ?? 0 }}
                onPaginationChange={(next) => setPagination({ current: next.current, pageSize: next.pageSize })}
              />
            </Card>
          )}
        </Space>
      ) : null}

      <QuickSavingsCollectionModal open={depositOpen} member={member} onClose={() => setDepositOpen(false)} />
      <SavingsWithdrawalModal open={withdrawalOpen} member={member} account={member?.savingsAccount} onClose={() => setWithdrawalOpen(false)} />
    </PageContainer>
  );
}
