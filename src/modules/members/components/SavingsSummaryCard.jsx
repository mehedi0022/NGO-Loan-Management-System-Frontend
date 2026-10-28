import {
  BankOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Card, Empty, Tag } from "antd";

import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";

export function SavingsSummaryCard({ account }) {
  if (!account) {
    return (
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Empty description="No savings account registered for this member" />
      </Card>
    );
  }

  const general = Number(account.generalSavingsBalance || 0);
  const special = Number(account.specialSavingsBalance || 0);
  const total = general + special;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {/* Total Savings */}
      <Card
        className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm rounded-xl m-0"
        styles={{ body: { padding: "14px 16px" } }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block truncate">
              Total Savings
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
              {formatCurrency(total)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Combined balance
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
            <WalletOutlined className="text-lg sm:text-xl" />
          </div>
        </div>
      </Card>

      {/* General Savings */}
      <Card
        className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm rounded-xl m-0"
        styles={{ body: { padding: "14px 16px" } }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 block truncate">
              General Savings
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
              {formatCurrency(general)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Regular deposit
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <BankOutlined className="text-lg sm:text-xl" />
          </div>
        </div>
      </Card>

      {/* Special Savings */}
      <Card
        className="border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm rounded-xl m-0"
        styles={{ body: { padding: "14px 16px" } }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 block truncate">
              Special Savings
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">
              {formatCurrency(special)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Voluntary reserve
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <SafetyCertificateOutlined className="text-lg sm:text-xl" />
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card
        className="border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 shadow-sm rounded-xl m-0"
        styles={{ body: { padding: "14px 16px" } }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block truncate">
              Account Status
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-50 mt-1 truncate">
              {account.accountId || `#${account.id}`}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Tag color={account.status === "ACTIVE" ? "success" : "default"} className="m-0 text-[11px]">
                {account.status || "ACTIVE"}
              </Tag>
              {account.openedAt && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Opened {formatDate(account.openedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <CheckCircleOutlined className="text-lg sm:text-xl" />
          </div>
        </div>
      </Card>
    </div>
  );
}
