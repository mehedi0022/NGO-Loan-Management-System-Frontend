import {
  CalendarOutlined,
  ReloadOutlined,
  RollbackOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { ReverseTransactionModal } from "../../../components/reverse-modal/ReverseTransactionModal.jsx";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";
import {
  useGetCollectionsQuery,
  useReverseCollectionMutation,
} from "../collectionsApi.js";

const { RangePicker } = DatePicker;

export function CollectionHistoryTable({ somitiOptions = [], isAdmin = false }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [somitiId, setSomitiId] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedForReverse, setSelectedForReverse] = useState(null);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);

  const [reverseCollection, { isLoading: reversing }] =
    useReverseCollectionMutation();

  const queryParams = {
    page,
    limit: pageSize,
    fromDate: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
    toDate: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
    somitiId: somitiId && somitiId !== "ALL" ? Number(somitiId) : undefined,
  };

  const { data, isLoading, isFetching, refetch } =
    useGetCollectionsQuery(queryParams);

  const rawData = data?.data;
  const collections = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData?.collections)
    ? rawData.collections
    : [];
  const meta = rawData?.pagination || rawData?.meta || {};

  // Client-side search filtering on member name, ID, collection code
  const filteredCollections = search.trim()
    ? collections.filter((item) => {
        const term = search.toLowerCase();
        return (
          item.collectionId?.toLowerCase().includes(term) ||
          item.member?.fullName?.toLowerCase().includes(term) ||
          item.member?.memberId?.toLowerCase().includes(term) ||
          item.member?.mobileNumber?.includes(term)
        );
      })
    : collections;

  const handleOpenReverse = (record) => {
    setSelectedForReverse(record);
    setReverseModalOpen(true);
  };

  const handleConfirmReverse = async (reason) => {
    if (!selectedForReverse) return;
    try {
      await reverseCollection({
        collectionId: selectedForReverse.id,
        reason,
      }).unwrap();
      message.success(
        `Collection ${selectedForReverse.collectionId || `#${selectedForReverse.id}`} reversed successfully.`,
      );
      setReverseModalOpen(false);
      setSelectedForReverse(null);
      refetch();
    } catch (err) {
      message.error(
        err?.data?.message || "Failed to reverse collection. Please try again.",
      );
    }
  };

  const columns = [
    {
      title: "Collection ID",
      dataIndex: "collectionId",
      key: "collectionId",
      width: 140,
      render: (val, record) => (
        <Typography.Text strong className="text-emerald-700 dark:text-emerald-400">
          {val || `COL-${String(record.id).padStart(6, "0")}`}
        </Typography.Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "collectionDate",
      key: "collectionDate",
      width: 120,
      render: (val) => formatDate(val),
    },
    {
      title: "Member",
      key: "member",
      width: 220,
      render: (_, record) => (
        <Space orientation="horizontal" size="small">
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <Typography.Text strong className="block text-xs sm:text-sm">
              {record.member?.fullName || "—"}
            </Typography.Text>
            <Typography.Text type="secondary" className="block text-xs">
              {record.member?.memberId || "—"}
              {record.member?.mobileNumber ? ` · ${record.member.mobileNumber}` : ""}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Loan",
      dataIndex: "loanCollectionAmount",
      key: "loanCollectionAmount",
      align: "right",
      width: 110,
      render: (val) =>
        Number(val) > 0 ? (
          formatCurrency(val)
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "General Sav.",
      dataIndex: "generalSavingsAmount",
      key: "generalSavingsAmount",
      align: "right",
      width: 110,
      render: (val) =>
        Number(val) > 0 ? (
          formatCurrency(val)
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Special Sav.",
      dataIndex: "specialSavingsAmount",
      key: "specialSavingsAmount",
      align: "right",
      width: 110,
      render: (val) =>
        Number(val) > 0 ? (
          formatCurrency(val)
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "DPS",
      dataIndex: "dpsAmount",
      key: "dpsAmount",
      align: "right",
      width: 110,
      render: (val) =>
        Number(val) > 0 ? (
          formatCurrency(val)
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      width: 130,
      render: (val) => (
        <Typography.Text strong className="text-emerald-600 dark:text-emerald-400">
          {formatCurrency(val)}
        </Typography.Text>
      ),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 120,
      render: (val) => <Tag color="blue">{formatEnum(val)}</Tag>,
    },
    {
      title: "Collected By",
      dataIndex: ["collectedBy", "fullName"],
      key: "collectedBy",
      width: 150,
      render: (val, record) => val || record.collectedBy?.userName || "—",
    },
    ...(isAdmin
      ? [
          {
            title: "Action",
            key: "action",
            align: "center",
            width: 110,
            fixed: "right",
            render: (_, record) => (
              <Tooltip title="Reverse this collection (Revert installments, savings and cash)">
                <Button
                  danger
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={() => handleOpenReverse(record)}
                >
                  Reverse
                </Button>
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card className="shadow-none border-[#deded7]">
      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <span className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
            Date Range
          </span>
          <RangePicker
            className="w-full"
            value={dateRange}
            onChange={setDateRange}
            format="DD MMM YYYY"
            allowClear
          />
        </div>

        <div>
          <span className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
            Somiti
          </span>
          <Select
            className="w-full"
            value={somitiId}
            onChange={setSomitiId}
            options={somitiOptions}
            showSearch
          />
        </div>

        <div>
          <span className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
            Search
          </span>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Collection ID, member name or phone"
            prefix={<SearchOutlined />}
          />
        </div>

        <div className="flex items-end">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
            className="w-full sm:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        loading={isLoading || isFetching}
        dataSource={filteredCollections}
        columns={columns}
        scroll={{ x: 1350 }}
        locale={{
          emptyText: <Empty description="No collection history found for the selected filter" />,
        }}
        pagination={{
          current: page,
          pageSize,
          total: meta.total || filteredCollections.length,
          showSizeChanger: true,
          pageSizeOptions: ["15", "30", "50", "100"],
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
      />

      {/* Reverse Confirmation Modal */}
      <ReverseTransactionModal
        open={reverseModalOpen}
        onClose={() => {
          setReverseModalOpen(false);
          setSelectedForReverse(null);
        }}
        onConfirm={handleConfirmReverse}
        confirmLoading={reversing}
        title="Reverse Collection"
        transactionCode={
          selectedForReverse?.collectionId ||
          (selectedForReverse ? `COL-${String(selectedForReverse.id).padStart(6, "0")}` : "")
        }
        amount={
          selectedForReverse ? formatCurrency(selectedForReverse.totalAmount) : ""
        }
        detailsText={
          selectedForReverse
            ? `Member: ${selectedForReverse.member?.fullName || "—"} (${selectedForReverse.member?.memberId || "—"})`
            : ""
        }
      />
    </Card>
  );
}
