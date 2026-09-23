import {
  CalendarOutlined,
  CheckOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { resolveUploadUrl } from "../../../utils/uploadUrl.js";
import {
  formatCurrency,
  formatDate,
  formatEnum,
} from "../../loans/loanFormatters.js";
import { CollectionModal } from "../components/CollectionModal.jsx";
import { QuickSavingsCollectionModal } from "../../savings/components/QuickSavingsCollectionModal.jsx";
import {
  useCreateBatchCollectionsMutation,
  useCreateCollectionMutation,
  useGetDueInstallmentsQuery,
} from "../collectionsApi.js";

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const getRemainingAmount = (installment) =>
  Math.max(
    0,
    toAmount(installment?.amount) - toAmount(installment?.paidAmount),
  );

const getMember = (installment) => installment?.loan?.member;

export function CollectionPage() {
  const navigate = useNavigate();

  const [dueDate, setDueDate] = useState(dayjs());
  const [collectionDate, setCollectionDate] = useState(dayjs());
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [allowAdvance, setAllowAdvance] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [collectionValues, setCollectionValues] = useState({});

  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [savingsCollectionOpen, setSavingsCollectionOpen] = useState(false);

  const dueDateValue = dueDate.format("YYYY-MM-DD");

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetDueInstallmentsQuery(dueDateValue);

  const [createCollection, { isLoading: creatingCollection }] =
    useCreateCollectionMutation();

  const [createBatchCollections, { isLoading: creatingBatch }] =
    useCreateBatchCollectionsMutation();

  const installments = useMemo(() => response?.data ?? [], [response]);

  const filteredInstallments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return installments;

    return installments.filter((item) => {
      const member = getMember(item);

      return [
        member?.fullName,
        member?.memberId,
        member?.mobileNumber,
        item.loan?.loanId,
      ].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(value),
      );
    });
  }, [installments, search]);

  const selectedInstallments = useMemo(
    () => installments.filter((item) => selectedRowKeys.includes(item.id)),
    [installments, selectedRowKeys],
  );

  const getRowValues = (installment) => {
    const values = collectionValues[installment.id] ?? {};

    return {
      loanCollectionAmount:
        values.loanCollectionAmount ?? getRemainingAmount(installment),

      generalSavingsAmount: values.generalSavingsAmount ?? 0,

      specialSavingsAmount: values.specialSavingsAmount ?? 0,
    };
  };

  const updateRowValue = (installmentId, field, value) => {
    setCollectionValues((current) => ({
      ...current,
      [installmentId]: {
        ...current[installmentId],
        [field]: toAmount(value),
      },
    }));
  };

  const getRowTotal = (installment) => {
    const values = getRowValues(installment);

    return (
      toAmount(values.loanCollectionAmount) +
      toAmount(values.generalSavingsAmount) +
      toAmount(values.specialSavingsAmount)
    );
  };

  const totalLoanDue = useMemo(
    () =>
      installments.reduce((total, item) => total + getRemainingAmount(item), 0),
    [installments],
  );

  const selectedTotals = useMemo(
    () =>
      selectedInstallments.reduce(
        (totals, item) => {
          const values = getRowValues(item);

          totals.loan += toAmount(values.loanCollectionAmount);

          totals.general += toAmount(values.generalSavingsAmount);

          totals.special += toAmount(values.specialSavingsAmount);

          return totals;
        },
        {
          loan: 0,
          general: 0,
          special: 0,
        },
      ),
    // collectionValues intentionally affects totals
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedInstallments, collectionValues],
  );

  const selectedTotal =
    selectedTotals.loan + selectedTotals.general + selectedTotals.special;
  const isUpcoming = (installment) =>
    dayjs(installment.dueDate)
      .startOf("day")
      .isAfter(collectionDate.startOf("day"));

  const resetSelection = () => {
    setSelectedRowKeys([]);
    setCollectionValues({});
  };

  const handleDueDateChange = (value) => {
    if (!value) return;

    setDueDate(value);
    resetSelection();
  };

  const handleCollectionDateChange = (value) => {
    if (!value) return;

    setCollectionDate(value);
  };

  const handleSingleCollection = async (payload) => {
    try {
      await createCollection(payload).unwrap();

      message.success("Collection completed successfully");

      if (selectedInstallment) {
        const installmentId = selectedInstallment.id;

        setSelectedRowKeys((current) =>
          current.filter((key) => key !== installmentId),
        );

        setCollectionValues((current) => {
          const next = { ...current };
          delete next[installmentId];
          return next;
        });
      }

      setSelectedInstallment(null);
    } catch (requestError) {
      message.error(
        requestError?.data?.message || "Unable to complete collection",
      );

      throw requestError;
    }
  };

  const validateSelectedRows = () => {
    if (!selectedInstallments.length) {
      message.warning("Select at least one member to collect");

      return false;
    }

    for (const item of selectedInstallments) {
      const values = getRowValues(item);

      const loanAmount = toAmount(values.loanCollectionAmount);

      const generalAmount = toAmount(values.generalSavingsAmount);

      const specialAmount = toAmount(values.specialSavingsAmount);

      const remaining = getRemainingAmount(item);

      if (loanAmount < 0) {
        message.error(
          `Invalid loan amount for installment #${item.installmentNo}`,
        );

        return false;
      }

      if (loanAmount > remaining) {
        message.error(
          `Loan collection cannot exceed ${formatCurrency(
            remaining,
          )} for installment #${item.installmentNo}`,
        );

        return false;
      }

      if (loanAmount > 0 && isUpcoming(item) && !allowAdvance) {
        message.error(
          `Enable advance payment for installment #${item.installmentNo}`,
        );

        return false;
      }

      if (generalAmount < 0 || specialAmount < 0) {
        message.error("Savings amount cannot be negative");

        return false;
      }

      if (loanAmount + generalAmount + specialAmount <= 0) {
        message.error(
          `Enter a collection amount for installment #${item.installmentNo}`,
        );

        return false;
      }

      const member = getMember(item);

      if (!member?.id) {
        message.error(
          `Member information is missing for installment #${item.installmentNo}`,
        );

        return false;
      }
    }

    return true;
  };

  const openBatchConfirmation = () => {
    if (!validateSelectedRows()) return;

    setBatchOpen(true);
  };

  const submitBatch = async () => {
    if (!validateSelectedRows()) return;

    const items = selectedInstallments.map((item) => {
      const values = getRowValues(item);
      const member = getMember(item);

      return {
        memberId: member.id,

        loanId: item.loanId,
        installmentId: item.id,

        loanCollectionAmount: toAmount(values.loanCollectionAmount),

        generalSavingsAmount: toAmount(values.generalSavingsAmount),

        specialSavingsAmount: toAmount(values.specialSavingsAmount),
      };
    });

    try {
      await createBatchCollections({
        collectionDate: collectionDate.format("YYYY-MM-DD"),

        paymentMethod,
        allowAdvance,

        items,
      }).unwrap();

      message.success(`${items.length} collection(s) completed successfully`);

      setBatchOpen(false);
      resetSelection();
    } catch (requestError) {
      message.error(
        requestError?.data?.message || "Unable to complete batch collection",
      );
    }
  };

  const columns = [
    {
      title: "Member",
      key: "member",
      fixed: "left",
      width: 240,

      render: (_, item) => {
        const member = getMember(item);

        return (
          <Space>
            <Avatar
              src={resolveUploadUrl(member?.photoUrl)}
              icon={<UserOutlined />}
            />

            <div>
              <Typography.Text strong>
                {member?.fullName || "—"}
              </Typography.Text>

              <Typography.Text type="secondary" className="block text-xs">
                {member?.memberId || "—"}
                {member?.mobileNumber ? ` · ${member.mobileNumber}` : ""}
              </Typography.Text>
            </div>
          </Space>
        );
      },
    },

    {
      title: "Loan",
      key: "loan",
      width: 130,

      render: (_, item) => (
        <Button
          type="link"
          className="p-0!"
          onClick={() => navigate(`/loans/${item.loanId}`)}
        >
          {item.loan?.loanId || `#${item.loanId}`}
        </Button>
      ),
    },

    {
      title: "Installment",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 110,
      align: "center",
      render: (value) => (value ? `#${value}` : "—"),
    },

    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 130,
      render: (value) => (value ? formatDate(value) : "—"),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,

      render: (value) => <StatusTag status={value} label={formatEnum(value)} />,
    },

    {
      title: "Remaining",
      key: "remaining",
      width: 130,
      align: "right",

      render: (_, item) => formatCurrency(getRemainingAmount(item)),
    },

    {
      title: "Loan Collection",
      key: "loanCollectionAmount",
      width: 170,

      render: (_, item) => {
        const values = getRowValues(item);
        const remaining = getRemainingAmount(item);

        return (
          <InputNumber
            className="w-full"
            min={0}
            max={remaining}
            precision={2}
            prefix="৳"
            value={values.loanCollectionAmount}
            onChange={(value) =>
              updateRowValue(item.id, "loanCollectionAmount", value)
            }
          />
        );
      },
    },

    {
      title: "General Savings",
      key: "generalSavingsAmount",
      width: 165,

      render: (_, item) => {
        const values = getRowValues(item);

        return (
          <InputNumber
            className="w-full"
            min={0}
            precision={2}
            prefix="৳"
            value={values.generalSavingsAmount}
            onChange={(value) =>
              updateRowValue(item.id, "generalSavingsAmount", value)
            }
          />
        );
      },
    },

    {
      title: "Special Savings",
      key: "specialSavingsAmount",
      width: 165,

      render: (_, item) => {
        const values = getRowValues(item);

        return (
          <InputNumber
            className="w-full"
            min={0}
            precision={2}
            prefix="৳"
            value={values.specialSavingsAmount}
            onChange={(value) =>
              updateRowValue(item.id, "specialSavingsAmount", value)
            }
          />
        );
      },
    },

    {
      title: "Total",
      key: "total",
      width: 130,
      align: "right",

      render: (_, item) => (
        <Typography.Text strong>
          {formatCurrency(getRowTotal(item))}
        </Typography.Text>
      ),
    },

    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 100,

      render: (_, item) => (
        <Button
          type="primary"
          size="small"
          onClick={() => setSelectedInstallment(item)}
        >
          Collect
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography.Title level={2} className="mb-1!">
            Collections
          </Typography.Title>

          <Typography.Text type="secondary">
            Collect loan installments and member savings from one place.
          </Typography.Text>
        </div>
        <Button type="primary" onClick={() => setSavingsCollectionOpen(true)}>
          Collect Savings
        </Button>
      </div>

      <Card className="mb-4 border-[#deded7] shadow-none">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[200px_200px_1fr_190px]">
          <div>
            <Typography.Text strong className="mb-2 block">
              Due Date
            </Typography.Text>

            <DatePicker
              allowClear={false}
              value={dueDate}
              onChange={handleDueDateChange}
              format="DD MMM YYYY"
              className="w-full"
              suffixIcon={<CalendarOutlined />}
            />
          </div>

          <div>
            <Typography.Text strong className="mb-2 block">
              Collection Date
            </Typography.Text>

            <DatePicker
              allowClear={false}
              value={collectionDate}
              onChange={handleCollectionDateChange}
              format="DD MMM YYYY"
              className="w-full"
            />
          </div>

          <div>
            <Typography.Text strong className="mb-2 block">
              Search Members
            </Typography.Text>

            <Input
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Name, member ID, phone or loan ID"
            />
          </div>

          <div>
            <Typography.Text strong className="mb-2 block">
              Payment Method
            </Typography.Text>

            <Select
              className="w-full"
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={paymentMethods}
            />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <Checkbox
            checked={allowAdvance}
            onChange={(event) => {
              setAllowAdvance(event.target.checked);
              setSelectedRowKeys([]);
            }}
          >
            Allow advance loan payments before the installment due date
          </Checkbox>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <Statistic title="Due Installments" value={installments.length} />
        </Card>

        <Card>
          <Statistic
            title="Total Loan Due"
            value={totalLoanDue}
            formatter={(value) => formatCurrency(value)}
          />
        </Card>

        <Card>
          <Statistic
            title="Selected Members"
            value={selectedInstallments.length}
          />
        </Card>

        <Card>
          <Statistic
            title="Selected Collection"
            value={selectedTotal}
            formatter={(value) => formatCurrency(value)}
          />
        </Card>
      </div>

      {selectedInstallments.length > 0 && (
        <Card size="small" className="mb-4 border-[#deded7] shadow-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Statistic
              title="Loan"
              value={selectedTotals.loan}
              formatter={(value) => formatCurrency(value)}
            />

            <Statistic
              title="General Savings"
              value={selectedTotals.general}
              formatter={(value) => formatCurrency(value)}
            />

            <Statistic
              title="Special Savings"
              value={selectedTotals.special}
              formatter={(value) => formatCurrency(value)}
            />

            <Statistic
              title="Total"
              value={selectedTotal}
              formatter={(value) => formatCurrency(value)}
            />
          </div>
        </Card>
      )}

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={error?.data?.message || "Unable to load due installments"}
          action={<Button onClick={refetch}>Retry</Button>}
        />
      )}

      <Card
        title={`Installments due on ${dueDate.format("DD MMM YYYY")}`}
        className="border-[#deded7] shadow-none"
        extra={
          selectedRowKeys.length > 0 ? (
            <Space>
              <Button onClick={resetSelection}>Clear</Button>

              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={openBatchConfirmation}
              >
                Collect Selected ({selectedRowKeys.length})
              </Button>
            </Space>
          ) : null
        }
      >
        <Table
          rowKey="id"
          loading={isLoading || isFetching}
          dataSource={filteredInstallments}
          columns={columns}
          rowSelection={{
            selectedRowKeys,

            onChange: (keys) => setSelectedRowKeys(keys),

            getCheckboxProps: (item) => ({
              disabled:
                getRemainingAmount(item) <= 0 ||
                (isUpcoming(item) && !allowAdvance),
            }),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: 1700 }}
          locale={{
            emptyText: (
              <Empty description="No payable installments found for this date" />
            ),
          }}
        />
      </Card>

      <Modal
        title="Confirm Batch Collection"
        open={batchOpen}
        okText={`Collect ${formatCurrency(selectedTotal)}`}
        confirmLoading={creatingBatch}
        onOk={submitBatch}
        onCancel={() => setBatchOpen(false)}
        width={560}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4">
          <div>
            <Typography.Text type="secondary">Members</Typography.Text>

            <div className="font-semibold">{selectedInstallments.length}</div>
          </div>

          <div>
            <Typography.Text type="secondary">Payment Method</Typography.Text>

            <div className="font-semibold">{formatEnum(paymentMethod)}</div>
          </div>

          <div>
            <Typography.Text type="secondary">Collection Date</Typography.Text>

            <div className="font-semibold">
              {collectionDate.format("DD MMM YYYY")}
            </div>
          </div>

          <div>
            <Typography.Text type="secondary">Total</Typography.Text>

            <div className="font-semibold">{formatCurrency(selectedTotal)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Typography.Text>Loan Collection</Typography.Text>

            <Typography.Text strong>
              {formatCurrency(selectedTotals.loan)}
            </Typography.Text>
          </div>

          <div className="flex justify-between">
            <Typography.Text>General Savings</Typography.Text>

            <Typography.Text strong>
              {formatCurrency(selectedTotals.general)}
            </Typography.Text>
          </div>

          <div className="flex justify-between">
            <Typography.Text>Special Savings</Typography.Text>

            <Typography.Text strong>
              {formatCurrency(selectedTotals.special)}
            </Typography.Text>
          </div>
        </div>

        <Alert
          className="mt-4"
          type={allowAdvance ? "warning" : "info"}
          showIcon
          message={allowAdvance ? "Advance payment enabled" : "Batch collection is atomic"}
          description={
            allowAdvance
              ? "Selected upcoming loan installments will be recorded before their due date."
              : "If any selected collection fails, the whole batch will be rolled back."
          }
        />
      </Modal>

      <CollectionModal
        open={Boolean(selectedInstallment)}
        installment={selectedInstallment}
        loading={creatingCollection}
        onCancel={() => setSelectedInstallment(null)}
        onSubmit={handleSingleCollection}
      />
      <QuickSavingsCollectionModal
        open={savingsCollectionOpen}
        onClose={() => setSavingsCollectionOpen(false)}
      />
    </PageContainer>
  );
}
