import {
  CalendarOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useSelector } from "react-redux";
import { can, permissions } from "../../auth/permissions.js";
import { useGetDayClosingHistoryQuery } from "../dayClosingApi.js";
import { EmergencyReopenModal } from "./EmergencyReopenModal.jsx";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export function DayClosingHistoryTable() {
  const user = useSelector((state) => state.auth.user);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [reopenModalRecord, setReopenModalRecord] = useState(null);

  const canReopen =
    can(user, permissions.dayClosingReopen) || user?.role === "SUPER_ADMIN";

  const queryParams = {
    page,
    limit: pageSize,
    ...(dateRange && {
      fromDate: dateRange[0].format("YYYY-MM-DD"),
      toDate: dateRange[1].format("YYYY-MM-DD"),
    }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useGetDayClosingHistoryQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const closings = data?.data?.closings || [];
  const meta = data?.data?.meta || { total: 0 };

  const formatTk = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;
  };

  const columns = [
    {
      title: "Business Date",
      dataIndex: "businessDate",
      key: "businessDate",
      render: (date, record) => (
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-slate-400" />
          <Text strong className="text-slate-800">{date}</Text>
          {record.isHoliday && <Tag color="orange">Holiday</Tag>}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "OPEN" ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>OPEN</Tag>
        ) : (
          <Tag color="default" icon={<LockOutlined />}>LOCKED / CLOSED</Tag>
        ),
    },
    {
      title: "Opening Balance",
      dataIndex: "openingBalance",
      key: "openingBalance",
      align: "right",
      render: (val) => <Text className="font-medium text-slate-700">{formatTk(val)}</Text>,
    },
    {
      title: "Total Cash In (+)",
      dataIndex: "totalCashIn",
      key: "totalCashIn",
      align: "right",
      render: (val) => <Text className="text-emerald-600 font-semibold">{formatTk(val)}</Text>,
    },
    {
      title: "Total Cash Out (-)",
      dataIndex: "totalCashOut",
      key: "totalCashOut",
      align: "right",
      render: (val) => <Text className="text-rose-600 font-semibold">{formatTk(val)}</Text>,
    },
    {
      title: "Closing Balance",
      dataIndex: "closingBalance",
      key: "closingBalance",
      align: "right",
      render: (val) => (
        <Text strong className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded font-bold">
          {formatTk(val)}
        </Text>
      ),
    },
    {
      title: "Closed By & Time",
      key: "closedInfo",
      render: (_, record) => {
        if (!record.closedAt) {
          return <Text type="secondary" className="italic text-xs">Active Day (In Progress)</Text>;
        }
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1 text-slate-700 font-medium">
              <UserOutlined className="text-slate-400" />
              <span>{record.closedBy?.fullName || record.closedBy?.userName || "Admin"}</span>
            </div>
            <div className="text-slate-400">
              {dayjs(record.closedAt).format("DD MMM YYYY, hh:mm A")}
            </div>
          </div>
        );
      },
    },
    ...(canReopen
      ? [
          {
            title: "Actions",
            key: "actions",
            align: "center",
            width: 130,
            render: (_, record) => {
              const latestClosed = closings.find((c) => c.status === "CLOSED");
              const isLatestClosed = record.id === latestClosed?.id;
              if (!isLatestClosed) {
                return (
                  <Text type="secondary" className="text-xs">
                    —
                  </Text>
                );
              }
              return (
                <Tooltip title="Super Admin emergency action: Revert this day back to OPEN if no transactions have been entered on the active day">
                  <Button
                    type="link"
                    danger
                    icon={<UnlockOutlined />}
                    size="small"
                    className="font-medium"
                    onClick={() => setReopenModalRecord(record)}
                  >
                    Reopen Day
                  </Button>
                </Tooltip>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <LockOutlined className="text-slate-600" />
            <span className="font-semibold">Day Closing Audit Trail</span>
          </div>
        }
        extra={
          <Space wrap>
            <RangePicker
              size="small"
              onChange={(dates) => {
                setDateRange(dates);
                setPage(1);
              }}
            />
            <Select
              size="small"
              placeholder="Filter by Status"
              allowClear
              style={{ width: 150 }}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { label: "All Statuses", value: "" },
                { label: "OPEN (Active)", value: "OPEN" },
                { label: "CLOSED (Locked)", value: "CLOSED" },
              ]}
            />
          </Space>
        }
        className="border-slate-200 shadow-sm"
      >
        <Table
          dataSource={closings}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{
            current: page,
            pageSize,
            total: meta.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <EmergencyReopenModal
        open={Boolean(reopenModalRecord)}
        targetDate={reopenModalRecord?.businessDate}
        onClose={() => setReopenModalRecord(null)}
      />
    </>
  );
}
