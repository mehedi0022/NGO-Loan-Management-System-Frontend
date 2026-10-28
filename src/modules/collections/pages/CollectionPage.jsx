import {
  AppstoreOutlined,
  BarsOutlined,
  CalendarOutlined,
  CheckOutlined,
  PrinterOutlined,
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
  Pagination,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
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
import { PrintableCollectionSheetModal } from "../components/PrintableCollectionSheetModal.jsx";
import {
  useCreateBatchCollectionsMutation,
  useCreateCollectionMutation,
  useGetDueInstallmentsQuery,
} from "../collectionsApi.js";
import {
  useGetActiveSomitiesQuery,
  useGetSomitiMembersQuery,
} from "../../somities/somitiesApi.js";
import { useGetDpsAccountsQuery } from "../../dps/dpsApi.js";

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

const getRemainingAmount = (installment) => {
  if (installment?.isDpsOnly || !installment?.loanId) return 0;
  return Math.max(
    0,
    toAmount(installment?.amount) - toAmount(installment?.paidAmount),
  );
};

const getMember = (installment) => installment?.loan?.member;

export function CollectionPage() {
  const navigate = useNavigate();

  const [dueDate, setDueDate] = useState(dayjs());
  const [collectionDate, setCollectionDate] = useState(dayjs());
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [allowAdvance, setAllowAdvance] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSomitiId, setSelectedSomitiId] = useState("ALL");

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [collectionValues, setCollectionValues] = useState({});

  const [isMobile, setIsMobile] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth < 768 : false),
  );
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "card" : "table",
  );
  const [cardPage, setCardPage] = useState(1);
  const [cardPageSize, setCardPageSize] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCardPage(1);
  }, [dueDate, selectedSomitiId, search]);

  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [savingsCollectionOpen, setSavingsCollectionOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const currentUser = useSelector((state) => state.auth.user);

  const dueDateValue = dueDate.format("YYYY-MM-DD");

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetDueInstallmentsQuery({
    dueDate: dueDateValue,
    somitiId: selectedSomitiId === "ALL" ? undefined : Number(selectedSomitiId),
  });

  const { data: somitiesData, isLoading: somitiesLoading } =
    useGetActiveSomitiesQuery();

  const { data: somitiMembersData } = useGetSomitiMembersQuery(
    Number(selectedSomitiId),
    { skip: !selectedSomitiId || selectedSomitiId === "ALL" },
  );

  const { data: dpsAccountsData } = useGetDpsAccountsQuery({
    status: "ACTIVE",
    limit: 100,
    somitiId:
      selectedSomitiId && selectedSomitiId !== "ALL"
        ? Number(selectedSomitiId)
        : undefined,
  });

  const somitiOptions = useMemo(
    () => [
      { value: "ALL", label: "All Somities" },
      ...(somitiesData?.data ?? []).map((s) => ({
        value: String(s.id),
        label: `${s.name} (${s.somitiId || s.code || "No Code"})${
          s.meetingDay ? ` - ${s.meetingDay}` : ""
        }`,
      })),
    ],
    [somitiesData],
  );

  const selectedSomiti = useMemo(() => {
    if (!selectedSomitiId || selectedSomitiId === "ALL") return null;
    return (somitiesData?.data ?? []).find(
      (s) => String(s.id) === String(selectedSomitiId),
    );
  }, [selectedSomitiId, somitiesData]);

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

  const firstInstallmentIdByMember = useMemo(() => {
    const map = new Map();
    for (const item of filteredInstallments) {
      const mId = getMember(item)?.id;
      if (mId && !map.has(mId)) {
        map.set(mId, item.id);
      }
    }
    return map;
  }, [filteredInstallments]);

  const getRowValues = (installment) => {
    const values = collectionValues[installment.id] ?? {};
    const member = getMember(installment);
    const mId = member?.id;
    const isFirstForMember =
      !mId || firstInstallmentIdByMember.get(mId) === installment.id;
    const activeDpsList = (member?.dpsAccounts || []).filter(
      (d) => d.status === "ACTIVE",
    );
    const hasActiveDps = activeDpsList.length > 0 && isFirstForMember;

    let defaultDpsAmount = 0;
    let defaultDpsAmounts = {};
    if (installment?.isDpsOnly && activeDpsList.length === 1) {
      const activeDps = activeDpsList[0];
      const target = Number(activeDps?.installmentAmount || 0);
      const totalPaid = Number(activeDps?.totalPaidAmount || 0);
      const partial = target > 0 ? totalPaid % target : 0;
      const due = partial > 0 ? target - partial : target;
      defaultDpsAmount = due;
      defaultDpsAmounts = { [activeDps.id]: due };
    }

    return {
      loanCollectionAmount:
        values.loanCollectionAmount ?? getRemainingAmount(installment),

      generalSavingsAmount: isFirstForMember
        ? (values.generalSavingsAmount ?? 0)
        : 0,

      specialSavingsAmount: isFirstForMember
        ? (values.specialSavingsAmount ?? 0)
        : 0,

      dpsAmount: hasActiveDps ? (values.dpsAmount ?? defaultDpsAmount) : 0,

      dpsAmounts: isFirstForMember
        ? (values.dpsAmounts ?? defaultDpsAmounts)
        : {},

      dpsAccountId: isFirstForMember ? values.dpsAccountId : undefined,

      paymentMethod: values.paymentMethod ?? paymentMethod,
    };
  };

  const updateRowDpsAmount = (installmentId, dpsAccountId, value) => {
    setCollectionValues((current) => {
      const row = current[installmentId] || {};
      const currentDpsAmounts = { ...(row.dpsAmounts || {}) };
      currentDpsAmounts[dpsAccountId] = toAmount(value);

      const totalDps = Object.values(currentDpsAmounts).reduce(
        (sum, a) => sum + toAmount(a),
        0,
      );

      return {
        ...current,
        [installmentId]: {
          ...row,
          dpsAmounts: currentDpsAmounts,
          dpsAmount: totalDps,
        },
      };
    });
  };

  const updateRowValue = (installmentId, field, value) => {
    setCollectionValues((current) => ({
      ...current,
      [installmentId]: {
        ...current[installmentId],
        [field]:
          field === "paymentMethod" || field === "dpsAccountId"
            ? value
            : toAmount(value),
      },
    }));
  };

  const updateRowPaymentMethod = (installmentId, value) => {
    setCollectionValues((current) => ({
      ...current,
      [installmentId]: {
        ...current[installmentId],
        paymentMethod: value,
      },
    }));
  };

  const getRowTotal = (installment) => {
    const values = getRowValues(installment);

    return (
      toAmount(values.loanCollectionAmount) +
      toAmount(values.generalSavingsAmount) +
      toAmount(values.specialSavingsAmount) +
      toAmount(values.dpsAmount)
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

          totals.dps += toAmount(values.dpsAmount);

          return totals;
        },
        {
          loan: 0,
          general: 0,
          special: 0,
          dps: 0,
        },
      ),
    // collectionValues intentionally affects totals
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedInstallments, collectionValues],
  );

  const selectedTotal =
    selectedTotals.loan +
    selectedTotals.general +
    selectedTotals.special +
    selectedTotals.dps;
  const isUpcoming = (installment) =>
    dayjs(installment.dueDate)
      .startOf("day")
      .isAfter(collectionDate.startOf("day"));

  const paginatedCardItems = useMemo(() => {
    const start = (cardPage - 1) * cardPageSize;
    return filteredInstallments.slice(start, start + cardPageSize);
  }, [filteredInstallments, cardPage, cardPageSize]);

  const selectableItems = useMemo(
    () =>
      filteredInstallments.filter((item) => {
        if (item.isDpsOnly) return true;
        return (
          getRemainingAmount(item) > 0 && (!isUpcoming(item) || allowAdvance)
        );
      }),
    [filteredInstallments, allowAdvance, collectionDate],
  );

  const allSelectableKeys = useMemo(
    () => selectableItems.map((item) => item.id),
    [selectableItems],
  );

  const isAllSelected =
    allSelectableKeys.length > 0 &&
    allSelectableKeys.every((key) => selectedRowKeys.includes(key));

  const isIndeterminate =
    selectedRowKeys.length > 0 && !isAllSelected;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRowKeys(
        Array.from(new Set([...selectedRowKeys, ...allSelectableKeys])),
      );
    } else {
      setSelectedRowKeys(
        selectedRowKeys.filter((key) => !allSelectableKeys.includes(key)),
      );
    }
  };

  const toggleSelectItem = (id, disabled) => {
    if (disabled) return;
    setSelectedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
  };

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
      const dpsAmount = toAmount(values.dpsAmount);

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

      if (generalAmount < 0 || specialAmount < 0 || dpsAmount < 0) {
        message.error("Savings or DPS amount cannot be negative");

        return false;
      }

      const member = getMember(item);

      if (loanAmount + generalAmount + specialAmount + dpsAmount <= 0) {
        message.error(
          item.loanId
            ? `Enter a collection amount for installment #${item.installmentNo}`
            : `Enter a collection amount for ${member?.fullName || "selected member"}`,
        );

        return false;
      }

      if (!member?.id) {
        message.error(
          item.loanId
            ? `Member information is missing for installment #${item.installmentNo}`
            : "Member information is missing",
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

    const processedMembersInBatch = new Set();
    const items = selectedInstallments.map((item) => {
      const values = getRowValues(item);
      const member = getMember(item);
      const isFirstSelectedForMember = !processedMembersInBatch.has(member.id);
      processedMembersInBatch.add(member.id);

      const mId = member?.id;
      const isFirstForMember =
        !mId || firstInstallmentIdByMember.get(mId) === item.id;
      const canCollectSavingsAndDps =
        isFirstForMember && isFirstSelectedForMember;

      const activeDpsList = (member?.dpsAccounts || []).filter(
        (d) => d.status === "ACTIVE",
      );

      let dpsCollections = undefined;
      let totalDps = canCollectSavingsAndDps ? toAmount(values.dpsAmount) : 0;

      if (canCollectSavingsAndDps && activeDpsList.length > 0) {
        if (activeDpsList.length === 1) {
          const singleDps = activeDpsList[0];
          const singleAmt = toAmount(
            values.dpsAmounts?.[singleDps.id] !== undefined
              ? values.dpsAmounts[singleDps.id]
              : values.dpsAmount,
          );
          if (singleAmt > 0) {
            dpsCollections = [
              { dpsAccountId: singleDps.id, amount: singleAmt },
            ];
            totalDps = singleAmt;
          } else {
            totalDps = 0;
          }
        } else {
          dpsCollections = activeDpsList
            .map((dps) => ({
              dpsAccountId: dps.id,
              amount: toAmount(values.dpsAmounts?.[dps.id] || 0),
            }))
            .filter((d) => d.amount > 0);
          totalDps = dpsCollections.reduce((sum, d) => sum + d.amount, 0);
        }
      }

      return {
        memberId: member.id,

        loanId: item.loanId || undefined,
        installmentId:
          item.loanId && typeof item.id === "number" ? item.id : undefined,

        loanCollectionAmount: toAmount(values.loanCollectionAmount),
        generalSavingsAmount: canCollectSavingsAndDps
          ? toAmount(values.generalSavingsAmount)
          : 0,
        specialSavingsAmount: canCollectSavingsAndDps
          ? toAmount(values.specialSavingsAmount)
          : 0,
        dpsAmount: totalDps,
        dpsAccountId:
          canCollectSavingsAndDps && activeDpsList[0]?.id
            ? activeDpsList[0].id
            : undefined,
        dpsCollections:
          dpsCollections && dpsCollections.length > 0
            ? dpsCollections
            : undefined,

        paymentMethod: values.paymentMethod,
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
      fixed: isMobile ? false : "left",
      width: isMobile ? 180 : 240,

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

      render: (_, item) => {
        if (item.isDpsOnly || !item.loanId) {
          return <Tag color="cyan">DPS Only</Tag>;
        }
        return (
          <Button
            type="link"
            className="p-0!"
            onClick={() => navigate(`/loans/${item.loanId}`)}
          >
            {item.loan?.loanId || `#${item.loanId}`}
          </Button>
        );
      },
    },

    {
      title: "Installment",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 110,
      align: "center",
      render: (value, item) => (item.isDpsOnly || !value ? "—" : `#${value}`),
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

      render: (value, item) => {
        if (item.isDpsOnly) {
          return <Tag color="blue">ACTIVE</Tag>;
        }
        return <StatusTag status={value} label={formatEnum(value)} />;
      },
    },

    {
      title: "Remaining",
      key: "remaining",
      width: 130,
      align: "right",

      render: (_, item) => {
        if (item.isDpsOnly || !item.loanId) {
          return <span style={{ color: "#94a3b8" }}>—</span>;
        }
        return formatCurrency(getRemainingAmount(item));
      },
    },

    {
      title: "Loan Collection",
      key: "loanCollectionAmount",
      width: 170,

      render: (_, item) => {
        if (item.isDpsOnly || !item.loanId) {
          return (
            <InputNumber
              className="w-full"
              disabled
              placeholder="No loan"
              value={0}
            />
          );
        }
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
        const member = getMember(item);
        const mId = member?.id;
        const isFirstForMember =
          !mId || firstInstallmentIdByMember.get(mId) === item.id;

        if (!isFirstForMember) {
          return (
            <Tooltip title="General Savings is collected on 1st loan row">
              <span style={{ color: "#94a3b8" }}>—</span>
            </Tooltip>
          );
        }

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
        const member = getMember(item);
        const mId = member?.id;
        const isFirstForMember =
          !mId || firstInstallmentIdByMember.get(mId) === item.id;

        if (!isFirstForMember) {
          return (
            <Tooltip title="Special Savings is collected on 1st loan row">
              <span style={{ color: "#94a3b8" }}>—</span>
            </Tooltip>
          );
        }

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
      title: "DPS Deposit",
      key: "dpsAmount",
      width: 220,

      render: (_, item) => {
        const member = getMember(item);
        const mId = member?.id;
        const isFirstForMember =
          !mId || firstInstallmentIdByMember.get(mId) === item.id;

        if (!isFirstForMember) {
          return (
            <Tooltip title="DPS is collected on 1st loan row">
              <Tag color="default" style={{ margin: 0, color: "#64748b" }}>
                Included in 1st loan
              </Tag>
            </Tooltip>
          );
        }

        const values = getRowValues(item);
        const activeDpsList = (member?.dpsAccounts || []).filter(
          (d) => d.status === "ACTIVE",
        );
        const hasDps = activeDpsList.length > 0;

        if (!hasDps) {
          return (
            <div>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                prefix="৳"
                disabled
                placeholder="No DPS"
                value={0}
              />
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                No active DPS
              </div>
            </div>
          );
        }

        // Single active DPS account
        if (activeDpsList.length === 1) {
          const activeDps = activeDpsList[0];
          const activeDpsTarget = Number(activeDps?.installmentAmount || 0);
          const activeDpsTotalPaid = Number(activeDps?.totalPaidAmount || 0);
          const activeDpsPartial =
            activeDpsTarget > 0 ? activeDpsTotalPaid % activeDpsTarget : 0;
          const activeDpsDue =
            activeDpsPartial > 0
              ? activeDpsTarget - activeDpsPartial
              : activeDpsTarget;
          const currentVal =
            values.dpsAmounts?.[activeDps.id] !== undefined
              ? values.dpsAmounts[activeDps.id]
              : values.dpsAmount;

          return (
            <div>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                prefix="৳"
                placeholder={String(activeDpsDue)}
                value={currentVal}
                onChange={(value) =>
                  updateRowDpsAmount(item.id, activeDps.id, value)
                }
              />
              <div
                style={{
                  fontSize: 10,
                  color: activeDpsPartial > 0 ? "#15803d" : "#0284c7",
                  fontWeight: 600,
                  marginTop: 2,
                }}
                title={`Target: ৳${activeDpsTarget}/${activeDps?.frequency === "WEEKLY" ? "week" : "month"}`}
              >
                {activeDps?.dpsNumber || "DPS"}: ৳{activeDpsDue.toLocaleString()} due{" "}
                {activeDpsPartial > 0
                  ? `(৳${activeDpsPartial.toLocaleString()} adv)`
                  : `/${activeDps?.frequency === "WEEKLY" ? "wk" : "mo"}`}
              </div>
            </div>
          );
        }

        // Multiple active DPS accounts: render individual inputs for all accounts
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activeDpsList.map((dps) => {
              const dTarget = Number(dps.installmentAmount || 0);
              const dPaid = Number(dps.totalPaidAmount || 0);
              const dPartial = dTarget > 0 ? dPaid % dTarget : 0;
              const dDue = dPartial > 0 ? dTarget - dPartial : dTarget;
              const isWk = dps.frequency === "WEEKLY";
              const currentVal = values.dpsAmounts?.[dps.id] ?? 0;

              return (
                <div
                  key={dps.id}
                  style={{
                    background: "var(--surface-muted)",
                    padding: "4px 6px",
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 2,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#0284c7" }}>
                      {dps.dpsNumber || `DPS-${dps.id}`}
                    </span>
                    <span
                      style={{
                        color: dPartial > 0 ? "#15803d" : "#64748b",
                        fontSize: 10,
                      }}
                    >
                      Due: ৳{dDue.toLocaleString()}{" "}
                      <span style={{ color: "#94a3b8" }}>
                        ({dPartial > 0 ? `৳${dPartial} adv` : `৳${dTarget}/${isWk ? "wk" : "mo"}`})
                      </span>
                    </span>
                  </div>
                  <InputNumber
                    size="small"
                    className="w-full"
                    min={0}
                    precision={2}
                    prefix="৳"
                    placeholder={String(dDue)}
                    value={currentVal}
                    onChange={(value) =>
                      updateRowDpsAmount(item.id, dps.id, value)
                    }
                  />
                </div>
              );
            })}
            <div
              style={{
                fontSize: 11,
                color: "#059669",
                fontWeight: 600,
                textAlign: "right",
                paddingRight: 2,
              }}
            >
              Total DPS: ৳{(values.dpsAmount || 0).toLocaleString()}
            </div>
          </div>
        );
      },
    },

    {
      title: "Payment Method",
      key: "paymentMethod",
      width: 175,

      render: (_, item) => {
        const values = getRowValues(item);

        return (
          <Select
            className="w-full"
            value={values.paymentMethod}
            options={paymentMethods}
            onChange={(value) => updateRowPaymentMethod(item.id, value)}
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
      fixed: isMobile ? false : "right",
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
        <Space wrap>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => setPrintModalOpen(true)}
            disabled={installments.length === 0}
          >
            Print Collection Sheet
          </Button>
          <Button type="primary" onClick={() => setSavingsCollectionOpen(true)}>
            Collect Savings
          </Button>
        </Space>
      </div>

      <Card className="mb-4 shadow-none">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-[170px_170px_220px_1fr_170px] gap-3 sm:gap-4">
          <div>
            <Typography.Text strong className="mb-1.5 block text-xs sm:text-sm">
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
            <Typography.Text strong className="mb-1.5 block text-xs sm:text-sm">
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

          <div className="col-span-2 sm:col-span-1 md:col-span-1 xl:col-span-1">
            <Typography.Text strong className="mb-1.5 block text-xs sm:text-sm">
              Somiti
            </Typography.Text>

            <Select
              className="w-full"
              value={selectedSomitiId}
              onChange={setSelectedSomitiId}
              options={somitiOptions}
              loading={somitiesLoading}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div className="col-span-2 sm:col-span-1 md:col-span-1 xl:col-span-1">
            <Typography.Text strong className="mb-1.5 block text-xs sm:text-sm">
              Search Members
            </Typography.Text>

            <Input
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Name, ID, phone or loan"
            />
          </div>

          <div className="col-span-2 sm:col-span-2 md:col-span-2 xl:col-span-1">
            <Typography.Text strong className="mb-1.5 block text-xs sm:text-sm">
              Default Payment Method
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

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card styles={{ body: { padding: "12px 14px" } }}>
          <Statistic title="Due Installments" value={installments.length} />
        </Card>

        <Card styles={{ body: { padding: "12px 14px" } }}>
          <Statistic
            title="Total Loan Due"
            value={totalLoanDue}
            formatter={(value) => formatCurrency(value)}
          />
        </Card>

        <Card styles={{ body: { padding: "12px 14px" } }}>
          <Statistic
            title="Selected Members"
            value={selectedInstallments.length}
          />
        </Card>

        <Card styles={{ body: { padding: "12px 14px" } }}>
          <Statistic
            title="Selected Collection"
            value={selectedTotal}
            formatter={(value) => formatCurrency(value)}
          />
        </Card>
      </div>

      {selectedInstallments.length > 0 && (
        <Card size="small" className="mb-4 border-[#deded7] shadow-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              title="DPS Deposit"
              value={selectedTotals.dps}
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
        className="collection-table-card border-[#deded7] shadow-none"
        title={
          <div className="flex flex-wrap items-center justify-between gap-2 py-1">
            <span className="text-sm sm:text-base font-semibold">
              Installments due on {dueDate.format("DD MMM YYYY")}
            </span>
            <Segmented
              size="small"
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "card", label: "Cards", icon: <AppstoreOutlined /> },
                { value: "table", label: "Table", icon: <BarsOutlined /> },
              ]}
            />
          </div>
        }
        extra={
          selectedRowKeys.length > 0 ? (
            <Space wrap size="small">
              <Button size="small" onClick={resetSelection}>
                Clear
              </Button>

              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={openBatchConfirmation}
              >
                Collect Selected ({selectedRowKeys.length})
              </Button>
            </Space>
          ) : null
        }
      >
        {viewMode === "card" ? (
          <div>
            {/* Card Select All Bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={allSelectableKeys.length === 0}
              >
                <span className="text-xs sm:text-sm font-medium">
                  Select All ({allSelectableKeys.length})
                </span>
              </Checkbox>

              {selectedRowKeys.length > 0 && (
                <Space size="small">
                  <Button size="small" onClick={resetSelection}>
                    Clear
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={openBatchConfirmation}
                  >
                    Collect ({selectedRowKeys.length})
                  </Button>
                </Space>
              )}
            </div>

            {paginatedCardItems.length === 0 ? (
              <Empty description="No payable installments found for this date" />
            ) : (
              <div className="flex flex-col gap-3">
                {paginatedCardItems.map((item) => {
                  const member = getMember(item);
                  const values = getRowValues(item);
                  const mId = member?.id;
                  const isFirstForMember =
                    !mId || firstInstallmentIdByMember.get(mId) === item.id;
                  const remaining = getRemainingAmount(item);
                  const isSelectable = !item.isDpsOnly
                    ? remaining > 0 && (!isUpcoming(item) || allowAdvance)
                    : true;
                  const isSelected = selectedRowKeys.includes(item.id);
                  const activeDpsList = (member?.dpsAccounts || []).filter(
                    (d) => d.status === "ACTIVE",
                  );
                  const hasDps = activeDpsList.length > 0;

                  return (
                    <Card
                      key={item.id}
                      size="small"
                      className={`border transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      styles={{ body: { padding: "12px" } }}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-start gap-2.5">
                          <Checkbox
                            checked={isSelected}
                            disabled={!isSelectable}
                            onChange={() => toggleSelectItem(item.id, !isSelectable)}
                            className="mt-1"
                          />
                          <Avatar
                            src={resolveUploadUrl(member?.photoUrl)}
                            icon={<UserOutlined />}
                            size="default"
                          />
                          <div>
                            <Typography.Text strong className="block text-sm leading-snug">
                              {member?.fullName || "—"}
                            </Typography.Text>
                            <Typography.Text type="secondary" className="block text-xs">
                              {member?.memberId || "—"}
                              {member?.mobileNumber ? ` · ${member.mobileNumber}` : ""}
                            </Typography.Text>
                          </div>
                        </div>

                        <div className="text-right">
                          {item.isDpsOnly || !item.loanId ? (
                            <Tag color="cyan" className="mr-0">DPS Only</Tag>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                type="link"
                                className="p-0! h-auto text-xs font-semibold"
                                onClick={() => navigate(`/loans/${item.loanId}`)}
                              >
                                {item.loan?.loanId || `#${item.loanId}`}
                              </Button>
                              <StatusTag status={item.status} label={formatEnum(item.status)} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Loan summary info bar */}
                      {!item.isDpsOnly && item.loanId && (
                        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1 text-xs px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-800/60">
                          <span className="text-gray-500 dark:text-gray-400">
                            Inst: <span className="font-semibold text-gray-700 dark:text-gray-200">#{item.installmentNo || "—"}</span>
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            Due: <span className="font-semibold text-gray-700 dark:text-gray-200">{item.dueDate ? formatDate(item.dueDate) : "—"}</span>
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            Remaining: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(remaining)}</span>
                          </span>
                        </div>
                      )}

                      {/* 2-Column Inputs Grid */}
                      <div className="grid grid-cols-2 gap-2.5 mb-3">
                        {/* Loan Collection */}
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Loan Collection
                          </div>
                          {item.isDpsOnly || !item.loanId ? (
                            <InputNumber
                              size="small"
                              className="w-full"
                              disabled
                              placeholder="No loan"
                              value={0}
                            />
                          ) : (
                            <InputNumber
                              size="small"
                              className="w-full"
                              min={0}
                              max={remaining}
                              precision={2}
                              prefix="৳"
                              value={values.loanCollectionAmount}
                              onChange={(val) =>
                                updateRowValue(item.id, "loanCollectionAmount", val)
                              }
                            />
                          )}
                        </div>

                        {/* General Savings */}
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            General Savings
                          </div>
                          {!isFirstForMember ? (
                            <Tooltip title="General Savings is collected on 1st loan row">
                              <div className="text-xs text-gray-400 pt-1">Incl in 1st loan</div>
                            </Tooltip>
                          ) : (
                            <InputNumber
                              size="small"
                              className="w-full"
                              min={0}
                              precision={2}
                              prefix="৳"
                              value={values.generalSavingsAmount}
                              onChange={(val) =>
                                updateRowValue(item.id, "generalSavingsAmount", val)
                              }
                            />
                          )}
                        </div>

                        {/* Special Savings */}
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Special Savings
                          </div>
                          {!isFirstForMember ? (
                            <Tooltip title="Special Savings is collected on 1st loan row">
                              <div className="text-xs text-gray-400 pt-1">Incl in 1st loan</div>
                            </Tooltip>
                          ) : (
                            <InputNumber
                              size="small"
                              className="w-full"
                              min={0}
                              precision={2}
                              prefix="৳"
                              value={values.specialSavingsAmount}
                              onChange={(val) =>
                                updateRowValue(item.id, "specialSavingsAmount", val)
                              }
                            />
                          )}
                        </div>

                        {/* DPS Deposit */}
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            DPS Deposit
                          </div>
                          {!isFirstForMember ? (
                            <Tooltip title="DPS is collected on 1st loan row">
                              <div className="text-xs text-gray-400 pt-1">Incl in 1st loan</div>
                            </Tooltip>
                          ) : !hasDps ? (
                            <InputNumber
                              size="small"
                              className="w-full"
                              disabled
                              placeholder="No DPS"
                              value={0}
                            />
                          ) : activeDpsList.length === 1 ? (
                            (() => {
                              const activeDps = activeDpsList[0];
                              const activeDpsTarget = Number(activeDps?.installmentAmount || 0);
                              const activeDpsTotalPaid = Number(activeDps?.totalPaidAmount || 0);
                              const activeDpsPartial =
                                activeDpsTarget > 0 ? activeDpsTotalPaid % activeDpsTarget : 0;
                              const activeDpsDue =
                                activeDpsPartial > 0
                                  ? activeDpsTarget - activeDpsPartial
                                  : activeDpsTarget;
                              const currentVal =
                                values.dpsAmounts?.[activeDps.id] !== undefined
                                  ? values.dpsAmounts[activeDps.id]
                                  : values.dpsAmount;

                              return (
                                <div>
                                  <InputNumber
                                    size="small"
                                    className="w-full"
                                    min={0}
                                    precision={2}
                                    prefix="৳"
                                    placeholder={String(activeDpsDue)}
                                    value={currentVal}
                                    onChange={(val) =>
                                      updateRowDpsAmount(item.id, activeDps.id, val)
                                    }
                                  />
                                  <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate mt-0.5 font-medium">
                                    Due: ৳{activeDpsDue}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="flex flex-col gap-1">
                              {activeDpsList.map((dps) => {
                                const dTarget = Number(dps.installmentAmount || 0);
                                const dPaid = Number(dps.totalPaidAmount || 0);
                                const dPartial = dTarget > 0 ? dPaid % dTarget : 0;
                                const dDue = dPartial > 0 ? dTarget - dPartial : dTarget;
                                const currentVal = values.dpsAmounts?.[dps.id] ?? 0;
                                return (
                                  <div key={dps.id} className="p-1 rounded bg-gray-50 dark:bg-gray-800 text-[10px]">
                                    <div className="flex justify-between font-semibold text-blue-600 dark:text-blue-400">
                                      <span>{dps.dpsNumber || `DPS-${dps.id}`}</span>
                                      <span>Due: ৳{dDue}</span>
                                    </div>
                                    <InputNumber
                                      size="small"
                                      className="w-full mt-0.5"
                                      min={0}
                                      precision={2}
                                      prefix="৳"
                                      value={currentVal}
                                      onChange={(val) =>
                                        updateRowDpsAmount(item.id, dps.id, val)
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Payment Method, Total, Collect Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">Method:</span>
                          <Select
                            size="small"
                            className="w-28 sm:w-36"
                            value={values.paymentMethod}
                            options={paymentMethods}
                            onChange={(val) => updateRowPaymentMethod(item.id, val)}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block -mb-1">Total</span>
                            <span className="font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(getRowTotal(item))}
                            </span>
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => setSelectedInstallment(item)}
                          >
                            Collect
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination for Card View */}
            {filteredInstallments.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-gray-100 dark:border-gray-800">
                <Typography.Text type="secondary" className="text-xs">
                  Showing {(cardPage - 1) * cardPageSize + 1} to{" "}
                  {Math.min(cardPage * cardPageSize, filteredInstallments.length)} of {filteredInstallments.length} members
                </Typography.Text>
                <Pagination
                  size="small"
                  current={cardPage}
                  pageSize={cardPageSize}
                  total={filteredInstallments.length}
                  showSizeChanger
                  pageSizeOptions={["10", "20", "50"]}
                  onChange={(page, size) => {
                    setCardPage(page);
                    setCardPageSize(size);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
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
                  !item.isDpsOnly &&
                  (getRemainingAmount(item) <= 0 ||
                    (isUpcoming(item) && !allowAdvance)),
              }),
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            scroll={{ x: isMobile ? 1200 : 1875 }}
            locale={{
              emptyText: (
                <Empty description="No payable installments found for this date" />
              ),
            }}
          />
        )}
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
            <Typography.Text type="secondary">Payment Methods</Typography.Text>

            <div className="font-semibold">Selected per member</div>
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
          {selectedInstallments.map((item) => {
            const member = getMember(item);
            const values = getRowValues(item);

            return (
              <div key={item.id} className="flex justify-between gap-3">
                <Typography.Text ellipsis>
                  {member?.fullName || member?.memberId || `Installment #${item.installmentNo}`}
                </Typography.Text>
                <Typography.Text strong>
                  {formatEnum(values.paymentMethod)}
                </Typography.Text>
              </div>
            );
          })}

          <div className="my-3 border-t border-gray-100" />

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

          <div className="flex justify-between">
            <Typography.Text>DPS Collection</Typography.Text>

            <Typography.Text strong>
              {formatCurrency(selectedTotals.dps)}
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
      <PrintableCollectionSheetModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        installments={filteredInstallments}
        somitiMembers={somitiMembersData?.data}
        dpsAccounts={dpsAccountsData?.data?.accounts}
        dueDate={dueDate}
        selectedSomiti={selectedSomiti}
        currentUser={currentUser}
      />
    </PageContainer>
  );
}
