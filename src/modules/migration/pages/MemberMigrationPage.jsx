import {
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  ContactsOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PlusCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SwapOutlined,
  TableOutlined,
  TeamOutlined,
  UserAddOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { AddressFields } from "../../members/components/AddressFields.jsx";
import {
  occupationOptions,
  relationshipOptions,
} from "../../members/components/MemberForm.jsx";
import { useGetActiveSomitiesQuery } from "../../somities/somitiesApi.js";
import { calculateLoanPreview } from "../../loans/loanCalculation.js";
import { formatCurrency } from "../../loans/loanFormatters.js";
import {
  transformAddress,
  transformGuarantor,
} from "../../../utils/memberPayload.js";
import {
  useMigrateBatchMembersMutation,
  useMigrateSingleMemberMutation,
} from "../migrationApi.js";

const { Title, Text, Paragraph } = Typography;

const CSV_HEADER_ROW =
  "MemberID,FullName,FatherName,MotherName,MobileNumber,NidNumber,SomitiID,JoinDate,Village,PostOffice,Upazila,District,GeneralSavings,SpecialSavings,LoanPrincipal,LoanChargePercent,LoanInstallments,LoanInstallmentAmount,LoanFrequency,LoanDisburseDate,LoanFirstDueDate,LoanPaidInstallments,DpsMonthlyAmount,DpsDurationMonths,DpsInterestRate,DpsStartDate,DpsPaidInstallments";

const CSV_SAMPLE_ROW =
  "M-1001,Md. Rafiqul Islam,Abdul Gafur,Rahima Begum,01712345678,19851234567890123,,2024-01-15,Bhatpara,Bhatpara,Kushtia Sadar,Kushtia,5000,1000,50000,10,46,1200,WEEKLY,2025-06-01,2025-06-08,20,500,36,8,2025-01-01,10";

export function MemberMigrationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("single");
  const [singleForm] = Form.useForm();
  const [hasFatherAddress, setHasFatherAddress] = useState(false);
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [isCustomInstallment, setIsCustomInstallment] = useState(false);
  const [loanScheduleModalOpen, setLoanScheduleModalOpen] = useState(false);

  // Watchers for single form calculations
  const includeSavings = Form.useWatch("includeSavings", singleForm);
  const includeLoan = Form.useWatch("includeLoan", singleForm);
  const includeDps = Form.useWatch("includeDps", singleForm);

  const loanPrincipal =
    Form.useWatch(["loan", "principalAmount"], singleForm) || 0;
  const loanChargeValue =
    Form.useWatch(["loan", "chargeValue"], singleForm) || 0;
  const loanInstallmentCount =
    Form.useWatch(["loan", "installmentCount"], singleForm) || 1;
  const loanPaidCount =
    Form.useWatch(["loan", "paidInstallments"], singleForm) || 0;
  const customInstallmentAmount = Form.useWatch(
    ["loan", "customInstallmentAmount"],
    singleForm,
  );
  const loanFrequency =
    Form.useWatch(["loan", "frequency"], singleForm) || "WEEKLY";
  const loanFirstDueDate = Form.useWatch(["loan", "firstDueDate"], singleForm);

  const dpsInstallmentAmount =
    Form.useWatch(["dps", "installmentAmount"], singleForm) || 0;
  const dpsDurationMonths =
    Form.useWatch(["dps", "durationMonths"], singleForm) || 12;
  const dpsPaidCount =
    Form.useWatch(["dps", "paidInstallments"], singleForm) || 0;

  // Somities query for dropdown
  const { data: somitiesData } = useGetActiveSomitiesQuery();
  const somities = somitiesData?.data ?? [];

  // Mutations
  const [migrateSingle, { isLoading: isSubmittingSingle }] =
    useMigrateSingleMemberMutation();
  const [migrateBatch, { isLoading: isSubmittingBatch }] =
    useMigrateBatchMembersMutation();

  // Single migration result modal/banner
  const [singleResult, setSingleResult] = useState(null);

  // Bulk CSV state
  const [parsedRows, setParsedRows] = useState([]);
  const [batchResults, setBatchResults] = useState(null);

  // Live Loan calculation preview with support for Auto / Manual Installment Mode
  const loanCalc = useMemo(() => {
    if (!includeLoan || loanPrincipal <= 0) return null;
    const calc = calculateLoanPreview({
      principalAmount: loanPrincipal,
      chargeType: "PERCENTAGE",
      chargeValue: loanChargeValue,
      installmentCount: loanInstallmentCount,
      isCustomInstallment,
      customInstallmentAmount,
      frequency: loanFrequency,
      firstDueDate: loanFirstDueDate,
    });
    if (!calc) return null;

    const paidCount = Math.min(
      Number(loanPaidCount) || 0,
      calc.installmentCount,
    );
    let paidAmount = 0;
    if (paidCount === calc.installmentCount) {
      paidAmount = calc.totalPayable;
    } else {
      paidAmount = paidCount * calc.regularInstallmentAmount;
    }
    const remainingAmount = Math.max(
      0,
      Math.round((calc.totalPayable - paidAmount) * 100) / 100,
    );

    return {
      ...calc,
      paidCount,
      paidAmount,
      remainingAmount,
      remainingInstallments: Math.max(0, calc.installmentCount - paidCount),
    };
  }, [
    includeLoan,
    loanPrincipal,
    loanChargeValue,
    loanInstallmentCount,
    isCustomInstallment,
    customInstallmentAmount,
    loanFrequency,
    loanFirstDueDate,
    loanPaidCount,
  ]);

  // Live DPS calculation preview
  const dpsCalc = useMemo(() => {
    if (!includeDps || dpsInstallmentAmount <= 0) return null;
    const totalPaid =
      Math.min(dpsPaidCount, dpsDurationMonths) * dpsInstallmentAmount;
    return {
      totalPaid,
      remainingInstallments: Math.max(0, dpsDurationMonths - dpsPaidCount),
    };
  }, [includeDps, dpsInstallmentAmount, dpsDurationMonths, dpsPaidCount]);

  // Handle Single Form Submit
  const handleSingleSubmit = async (values) => {
    if (
      values.includeLoan &&
      isCustomInstallment &&
      loanCalc &&
      !loanCalc.isValidCustomAmount
    ) {
      message.error(
        loanCalc.customAmountError ||
          "Please enter a valid regular installment amount",
      );
      return;
    }

    try {
      const addresses = [];
      const presentAddr = transformAddress(values.presentAddress, "PRESENT");
      if (presentAddr) {
        addresses.push(presentAddr);
      }

      if (hasFatherAddress && values.fatherAddress) {
        const fatherAddr = transformAddress(
          values.fatherAddress,
          "FATHER_HOME",
        );
        if (fatherAddr) {
          addresses.push(fatherAddr);
        }
      }

      let guarantors = undefined;
      if (hasGuarantor && values.guarantor) {
        const g = transformGuarantor(values.guarantor);
        if (g) {
          guarantors = [g];
        }
      }

      const payload = {
        memberId: values.memberId?.trim() || undefined,
        fullName: values.fullName.trim(),
        fatherName: values.fatherName.trim(),
        motherName: values.motherName.trim(),
        guardianName: values.guardianName?.trim() || undefined,
        mobileNumber: values.mobileNumber.trim(),
        nidNumber: values.nidNumber?.trim() || undefined,
        email: values.email?.trim() || undefined,
        occupation: values.occupation?.trim() || undefined,
        somitiId: values.somitiId || undefined,
        joinDate: values.joinDate
          ? values.joinDate.format("YYYY-MM-DD")
          : undefined,
        admissionFee:
          values.admissionFee != null ? Number(values.admissionFee) : 0,
        notes: values.notes?.trim() || undefined,

        addresses: addresses.length ? addresses : undefined,
        guarantors,

        savings: values.includeSavings
          ? {
              generalSavingsBalance: Number(
                values.savings?.generalSavingsBalance || 0,
              ),
              specialSavingsBalance: Number(
                values.savings?.specialSavingsBalance || 0,
              ),
            }
          : undefined,

        loan: values.includeLoan
          ? {
              loanId: values.loan?.loanId?.trim() || undefined,
              principalAmount: Number(values.loan?.principalAmount),
              chargeType: "PERCENTAGE",
              chargeValue: Number(values.loan?.chargeValue || 0),
              installmentCount: Number(values.loan?.installmentCount),
              installmentAmount:
                isCustomInstallment && loanCalc?.regularInstallmentAmount
                  ? loanCalc.regularInstallmentAmount
                  : undefined,
              frequency: values.loan?.frequency || "WEEKLY",
              disbursementDate:
                values.loan?.disbursementDate.format("YYYY-MM-DD"),
              firstDueDate: values.loan?.firstDueDate.format("YYYY-MM-DD"),
              paidInstallments: Number(values.loan?.paidInstallments || 0),
              purpose: values.loan?.purpose?.trim() || undefined,
            }
          : undefined,

        dps: values.includeDps
          ? {
              dpsNumber: values.dps?.dpsNumber?.trim() || undefined,
              frequency: values.dps?.frequency || "MONTHLY",
              installmentAmount: Number(values.dps?.installmentAmount),
              durationMonths: Number(values.dps?.durationMonths),
              interestRate: Number(values.dps?.interestRate || 0),
              startDate: values.dps?.startDate.format("YYYY-MM-DD"),
              paidInstallments: Number(values.dps?.paidInstallments || 0),
            }
          : undefined,
      };

      const res = await migrateSingle(payload).unwrap();
      setSingleResult(res.data);
      message.success(res.message || "Member migrated successfully!");
      singleForm.resetFields();
      setHasFatherAddress(false);
      setHasGuarantor(false);
      setIsCustomInstallment(false);
    } catch (err) {
      message.error(
        err?.data?.message || err.message || "Failed to migrate member",
      );
    }
  };

  // Download Sample CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," + `${CSV_HEADER_ROW}\n${CSV_SAMPLE_ROW}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "legacy_member_migration_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV File Upload
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        message.error(
          "CSV file must contain a header row and at least one data row",
        );
        return;
      }

      const rows = [];
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 5) continue;

        let memberId,
          fullName,
          fatherName,
          motherName,
          mobileNumber,
          nidNumber,
          somitiId,
          joinDate,
          village,
          postOffice,
          upazila,
          district,
          generalSavings,
          specialSavings,
          loanPrincipal,
          loanChargePercent,
          loanInstallments,
          loanInstallmentAmount,
          loanFrequency,
          loanDisburseDate,
          loanFirstDueDate,
          loanPaidInstallments,
          dpsMonthlyAmount,
          dpsDurationMonths,
          dpsInterestRate,
          dpsStartDate,
          dpsPaidInstallments;

        if (cols.length >= 27) {
          [
            memberId,
            fullName,
            fatherName,
            motherName,
            mobileNumber,
            nidNumber,
            somitiId,
            joinDate,
            village,
            postOffice,
            upazila,
            district,
            generalSavings,
            specialSavings,
            loanPrincipal,
            loanChargePercent,
            loanInstallments,
            loanInstallmentAmount,
            loanFrequency,
            loanDisburseDate,
            loanFirstDueDate,
            loanPaidInstallments,
            dpsMonthlyAmount,
            dpsDurationMonths,
            dpsInterestRate,
            dpsStartDate,
            dpsPaidInstallments,
          ] = cols;
        } else {
          [
            memberId,
            fullName,
            fatherName,
            motherName,
            mobileNumber,
            nidNumber,
            somitiId,
            joinDate,
            village,
            postOffice,
            upazila,
            district,
            generalSavings,
            specialSavings,
            loanPrincipal,
            loanChargePercent,
            loanInstallments,
            loanFrequency,
            loanDisburseDate,
            loanFirstDueDate,
            loanPaidInstallments,
            dpsMonthlyAmount,
            dpsDurationMonths,
            dpsInterestRate,
            dpsStartDate,
            dpsPaidInstallments,
          ] = cols;
          loanInstallmentAmount = undefined;
        }

        const isValid = Boolean(
          fullName &&
          fatherName &&
          motherName &&
          mobileNumber &&
          village &&
          postOffice &&
          upazila &&
          district,
        );

        rows.push({
          key: i,
          memberId,
          fullName,
          fatherName,
          motherName,
          mobileNumber,
          nidNumber,
          somitiId: somitiId ? Number(somitiId) : undefined,
          joinDate: joinDate || undefined,
          village,
          postOffice,
          upazila,
          district,
          generalSavings: Number(generalSavings || 0),
          specialSavings: Number(specialSavings || 0),
          loanPrincipal: Number(loanPrincipal || 0),
          loanChargePercent: Number(loanChargePercent || 10),
          loanInstallments: Number(loanInstallments || 46),
          loanInstallmentAmount: Number(loanInstallmentAmount || 0),
          loanFrequency: loanFrequency || "WEEKLY",
          loanDisburseDate: loanDisburseDate || undefined,
          loanFirstDueDate: loanFirstDueDate || undefined,
          loanPaidInstallments: Number(loanPaidInstallments || 0),
          dpsMonthlyAmount: Number(dpsMonthlyAmount || 0),
          dpsDurationMonths: Number(dpsDurationMonths || 36),
          dpsInterestRate: Number(dpsInterestRate || 8),
          dpsStartDate: dpsStartDate || undefined,
          dpsPaidInstallments: Number(dpsPaidInstallments || 0),
          isValid,
        });
      }

      setParsedRows(rows);
      setBatchResults(null);
      message.success(`Parsed ${rows.length} rows from CSV`);
    };
    reader.readAsText(file);
    return false; // prevent default upload POST
  };

  // Submit Batch CSV
  const handleBatchSubmit = async () => {
    if (!parsedRows.length) {
      message.warning("No rows parsed from CSV to migrate");
      return;
    }

    const validRows = parsedRows.filter((r) => r.isValid);
    if (!validRows.length) {
      message.error(
        "None of the parsed rows are valid. Please fix required fields.",
      );
      return;
    }

    const payload = {
      members: validRows.map((r) => ({
        memberId: r.memberId || undefined,
        fullName: r.fullName,
        fatherName: r.fatherName,
        motherName: r.motherName,
        mobileNumber: r.mobileNumber,
        nidNumber: r.nidNumber || undefined,
        somitiId: r.somitiId || undefined,
        joinDate: r.joinDate,
        addresses: [
          {
            type: "PRESENT",
            village: r.village,
            postOffice: r.postOffice,
            upazila: r.upazila,
            district: r.district,
          },
        ],
        savings:
          r.generalSavings > 0 || r.specialSavings > 0
            ? {
                generalSavingsBalance: r.generalSavings,
                specialSavingsBalance: r.specialSavings,
              }
            : undefined,
        loan:
          r.loanPrincipal > 0
            ? {
                principalAmount: r.loanPrincipal,
                chargeType: "PERCENTAGE",
                chargeValue: r.loanChargePercent,
                installmentCount: r.loanInstallments,
                installmentAmount:
                  r.loanInstallmentAmount > 0
                    ? r.loanInstallmentAmount
                    : undefined,
                frequency: r.loanFrequency,
                disbursementDate:
                  r.loanDisburseDate || r.joinDate || "2025-01-01",
                firstDueDate: r.loanFirstDueDate || r.joinDate || "2025-01-08",
                paidInstallments: r.loanPaidInstallments,
              }
            : undefined,
        dps:
          r.dpsMonthlyAmount > 0
            ? {
                installmentAmount: r.dpsMonthlyAmount,
                durationMonths: r.dpsDurationMonths,
                interestRate: r.dpsInterestRate,
                startDate: r.dpsStartDate || r.joinDate || "2025-01-01",
                paidInstallments: r.dpsPaidInstallments,
              }
            : undefined,
      })),
    };

    try {
      const res = await migrateBatch(payload).unwrap();
      setBatchResults(res.data);
      message.success(res.message);
    } catch (err) {
      message.error(
        err?.data?.message ||
          err.message ||
          "Failed to execute batch migration",
      );
    }
  };

  const previewColumns = [
    {
      title: "Status",
      key: "status",
      width: 80,
      render: (_, r) =>
        r.isValid ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Valid
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Missing
          </Tag>
        ),
    },
    {
      title: "Member",
      key: "member",
      render: (_, r) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {r.fullName}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {r.memberId || "Auto ID"} · {r.mobileNumber}
          </div>
        </div>
      ),
    },
    {
      title: "Address",
      key: "address",
      render: (_, r) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {r.village}, {r.upazila}
        </span>
      ),
    },
    {
      title: "Savings",
      key: "savings",
      render: (_, r) =>
        r.generalSavings > 0 || r.specialSavings > 0 ? (
          <div className="text-xs font-semibold text-emerald-600">
            ৳{(r.generalSavings + r.specialSavings).toLocaleString()}
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      title: "Active Loan",
      key: "loan",
      render: (_, r) =>
        r.loanPrincipal > 0 ? (
          <div>
            <div className="text-xs font-semibold text-blue-600">
              ৳{r.loanPrincipal.toLocaleString()} ({r.loanInstallments} inst)
            </div>
            <div className="text-[11px] text-slate-500">
              Paid: {r.loanPaidInstallments} inst
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      title: "Active DPS",
      key: "dps",
      render: (_, r) =>
        r.dpsMonthlyAmount > 0 ? (
          <div>
            <div className="text-xs font-semibold text-purple-600">
              ৳{r.dpsMonthlyAmount}/mo ({r.dpsDurationMonths}m)
            </div>
            <div className="text-[11px] text-slate-500">
              Paid: {r.dpsPaidInstallments} inst
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
  ];

  const scheduleColumns = [
    {
      title: "No.",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 65,
      render: (num) => (
        <strong className="text-slate-700 dark:text-slate-200">#{num}</strong>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => (
        <span className="text-slate-600 dark:text-slate-300 text-xs">
          <CalendarOutlined className="mr-1 text-slate-400" />
          {date}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, row) => (
        <Space>
          <strong
            className={
              row.isFinal
                ? "text-purple-600 dark:text-purple-400"
                : "text-emerald-700 dark:text-emerald-400"
            }
          >
            {formatCurrency(amount)}
          </strong>
          {row.isFinal && (
            <Tag color="purple" className="text-[10px] font-semibold">
              Final Adjustment
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => {
        const isPaid = row.installmentNo <= (loanPaidCount || 0);
        return isPaid ? (
          <Tag color="green" className="text-[11px] font-semibold">
            PAID (Historical)
          </Tag>
        ) : (
          <Tag color="orange" className="text-[11px]">
            PENDING
          </Tag>
        );
      },
    },
    {
      title: "Cumulative Paid",
      dataIndex: "cumulative",
      key: "cumulative",
      render: (val) => (
        <span className="text-xs text-slate-500">{formatCurrency(val)}</span>
      ),
    },
    {
      title: "Remaining",
      dataIndex: "remaining",
      key: "remaining",
      render: (val) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatCurrency(val)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Title
              level={2}
              className="m-0! text-slate-900 dark:text-slate-50 font-bold"
            >
              Legacy Member Migration
            </Title>
            <Tag color="cyan" className="font-semibold text-xs">
              Opening Balance Engine
            </Tag>
          </div>
          <Text type="secondary" className="text-sm">
            Onboard existing/old members with their historical savings balance,
            ongoing loans, and active DPS accounts without distorting today's
            cash drawer.
          </Text>
        </div>

        <Button onClick={() => navigate("/members")}>Back to Members</Button>
      </div>

      {/* Safety Notice Banner */}
      <Alert
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined className="text-base text-blue-600" />}
        message="Zero Cash Drawer Distortion Guarantee"
        description="Migrating members, opening savings balances, or ongoing loans through this module will NOT deduct money from your current cash drawer or create false collections in today's Daily Cash Sheet. All records are initialized in past ledger state."
        className="mb-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20"
        style={{ marginBottom: 20 }}
      />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: "single",
            label: (
              <span>
                <UserAddOutlined /> Single Member Migration
              </span>
            ),
            children: (
              <div className="space-y-4">
                {singleResult && (
                  <Card className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-base text-emerald-800 dark:text-emerald-200">
                          <CheckCircleOutlined className="text-emerald-600" />
                          <span>Member Migrated Successfully!</span>
                        </div>
                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                          <div>
                            <strong>Name:</strong> {singleResult.fullName} (
                            <span className="font-mono">
                              {singleResult.memberCode}
                            </span>
                            )
                          </div>
                          <div>
                            <strong>Savings Account:</strong>{" "}
                            {singleResult.savingsAccount?.accountId} · Balance:
                            ৳
                            {(
                              (singleResult.savingsAccount?.generalBalance ||
                                0) +
                              (singleResult.savingsAccount?.specialBalance || 0)
                            ).toLocaleString()}
                          </div>
                          {singleResult.loan && (
                            <div>
                              <strong>Loan ID:</strong>{" "}
                              {singleResult.loan.loanId} · Status:{" "}
                              <Tag color="green">
                                {singleResult.loan.status}
                              </Tag>{" "}
                              · Remaining:{" "}
                              {singleResult.loan.remainingInstallments}{" "}
                              installments
                            </div>
                          )}
                          {singleResult.dps && (
                            <div>
                              <strong>DPS Number:</strong>{" "}
                              {singleResult.dps.dpsNumber} · Status:{" "}
                              <Tag color="purple">
                                {singleResult.dps.status}
                              </Tag>{" "}
                              · Total Deposited: ৳
                              {singleResult.dps.totalPaid.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() =>
                          navigate(`/members/${singleResult.memberId}`)
                        }
                      >
                        View Member Profile
                      </Button>
                    </div>
                  </Card>
                )}

                <Form
                  form={singleForm}
                  layout="vertical"
                  onFinish={handleSingleSubmit}
                  className="flex flex-col gap-6"
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                  initialValues={{
                    admissionFee: 0,
                    joinDate: dayjs(),
                    includeSavings: true,
                    includeLoan: false,
                    includeDps: false,
                    savings: {
                      generalSavingsBalance: 0,
                      specialSavingsBalance: 0,
                    },
                    loan: {
                      chargeValue: 10,
                      installmentCount: 46,
                      frequency: "WEEKLY",
                      disbursementDate: dayjs().subtract(2, "month"),
                      firstDueDate: dayjs().subtract(2, "month").add(7, "day"),
                      paidInstallments: 0,
                    },
                    dps: {
                      frequency: "MONTHLY",
                      installmentAmount: 500,
                      durationMonths: 36,
                      interestRate: 8,
                      startDate: dayjs().subtract(6, "month"),
                      paidInstallments: 0,
                    },
                  }}
                >
                  {/* 1. Basic Member Details */}
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                          <TeamOutlined className="text-base" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          1. Member Personal Information
                        </span>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                  >
                    <Row gutter={[16, 12]}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Legacy Member ID / Code"
                          name="memberId"
                          extra="e.g. M-1002 (Leave blank for auto-generation)"
                        >
                          <Input
                            placeholder="M-1001"
                            className="rounded-lg font-mono"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Full Name"
                          name="fullName"
                          rules={[
                            {
                              required: true,
                              message: "Member full name is required",
                            },
                          ]}
                        >
                          <Input
                            placeholder="e.g. Md. Rafiqul Islam"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Father's Name"
                          name="fatherName"
                          rules={[
                            {
                              required: true,
                              message: "Father's name is required",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Father's Name"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Mother's Name"
                          name="motherName"
                          rules={[
                            {
                              required: true,
                              message: "Mother's name is required",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Mother's Name"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Guardian Name" name="guardianName">
                          <Input
                            placeholder="Guardian Name"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Mobile Number"
                          name="mobileNumber"
                          rules={[
                            {
                              required: true,
                              message: "Mobile number is required",
                            },
                            {
                              pattern: /^01[3-9]\d{8}$/,
                              message: "Valid 11-digit BD mobile number",
                            },
                          ]}
                        >
                          <Input
                            placeholder="01712345678"
                            className="rounded-lg font-mono"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="NID Number"
                          name="nidNumber"
                          rules={[
                            {
                              pattern: /^(\d{10}|\d{13}|\d{17})$/,
                              message: "NID must be 10, 13 or 17 digits",
                            },
                          ]}
                        >
                          <Input
                            placeholder="10, 13, or 17 digit NID"
                            className="rounded-lg font-mono"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[
                            {
                              type: "email",
                              message: "Enter a valid email address",
                            },
                          ]}
                        >
                          <Input
                            placeholder="member@example.com"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Occupation" name="occupation">
                          <Select
                            showSearch
                            allowClear
                            placeholder="Select occupation"
                            optionFilterProp="label"
                            options={occupationOptions}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Assign Somiti" name="somitiId">
                          <Select
                            placeholder="Select Somiti"
                            allowClear
                            options={somities.map((s) => ({
                              value: s.id,
                              label: `${s.name} (${s.code || s.somitiId || "No Code"})`,
                            }))}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Original Join Date" name="joinDate">
                          <DatePicker
                            className="w-full rounded-lg"
                            format="DD MMM YYYY"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label="Admission Fee"
                          name="admissionFee"
                          tooltip="Admission fee recorded historically"
                        >
                          <InputNumber
                            className="w-full rounded-lg"
                            prefix="৳"
                            min={0}
                            placeholder="0.00"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item label="Notes" name="notes">
                          <Input.TextArea
                            rows={2}
                            placeholder="Additional information about the member..."
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  {/* Member Present Address */}
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                          <HomeOutlined className="text-base" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          Member Present Address
                        </span>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                  >
                    <AddressFields name="presentAddress" />
                  </Card>

                  {/* Member Father Address */}
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <HomeOutlined className="text-base" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          Member Father Address
                        </span>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                    extra={
                      <Checkbox
                        checked={hasFatherAddress}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setHasFatherAddress(checked);
                          if (!checked) {
                            singleForm.resetFields(["fatherAddress"]);
                          }
                        }}
                      >
                        Add Father Address
                      </Checkbox>
                    }
                  >
                    {hasFatherAddress ? (
                      <AddressFields name="fatherAddress" />
                    ) : (
                      <Text type="secondary">
                        Father address is optional. Enable &ldquo;Add Father
                        Address&rdquo; if you want to store it for this member.
                      </Text>
                    )}
                  </Card>

                  {/* Guarantor */}
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                          <ContactsOutlined className="text-base" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          Guarantor
                        </span>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                    extra={
                      <Checkbox
                        checked={hasGuarantor}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setHasGuarantor(checked);
                          if (!checked) {
                            singleForm.resetFields(["guarantor"]);
                          }
                        }}
                      >
                        Add Guarantor
                      </Checkbox>
                    }
                  >
                    {!hasGuarantor ? (
                      <Text type="secondary">
                        Guarantor information is optional. Enable &ldquo;Add
                        Guarantor&rdquo; if this member has a guarantor.
                      </Text>
                    ) : (
                      <>
                        <Title
                          level={5}
                          className="text-slate-800 dark:text-slate-200 mb-3"
                        >
                          Guarantor Information
                        </Title>
                        <Row gutter={[16, 12]}>
                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="Full Name"
                              name={["guarantor", "fullName"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Enter guarantor's full name",
                                },
                              ]}
                            >
                              <Input
                                placeholder="Enter full name"
                                className="rounded-lg"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="Father Name"
                              name={["guarantor", "fatherName"]}
                            >
                              <Input
                                placeholder="Enter father's name"
                                className="rounded-lg"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="Mother Name"
                              name={["guarantor", "motherName"]}
                            >
                              <Input
                                placeholder="Enter mother's name"
                                className="rounded-lg"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="Mobile Number"
                              name={["guarantor", "mobileNumber"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Enter guarantor's mobile number",
                                },
                                {
                                  pattern: /^01[3-9]\d{8}$/,
                                  message:
                                    "Enter a valid Bangladeshi mobile number",
                                },
                              ]}
                            >
                              <Input
                                maxLength={11}
                                placeholder="01711223344"
                                className="rounded-lg font-mono"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="NID Number"
                              name={["guarantor", "nidNumber"]}
                              rules={[
                                {
                                  pattern: /^(\d{10}|\d{13}|\d{17})$/,
                                  message: "NID must be 10, 13 or 17 digits",
                                },
                              ]}
                            >
                              <Input
                                placeholder="Enter NID number"
                                className="rounded-lg font-mono"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="Relationship"
                              name={["guarantor", "relationship"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Select relationship",
                                },
                              ]}
                            >
                              <Select
                                showSearch
                                allowClear
                                placeholder="Select relationship"
                                optionFilterProp="label"
                                options={relationshipOptions}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12} lg={8}>
                            <Form.Item
                              label="Occupation"
                              name={["guarantor", "occupation"]}
                            >
                              <Select
                                showSearch
                                allowClear
                                placeholder="Select occupation"
                                optionFilterProp="label"
                                options={occupationOptions}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24}>
                            <Form.Item
                              label="Notes"
                              name={["guarantor", "notes"]}
                            >
                              <Input.TextArea
                                rows={2}
                                placeholder="Additional guarantor information..."
                                className="rounded-lg"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <div
                          style={{
                            marginTop: 12,
                            marginBottom: 20,
                            borderTop:
                              "1px solid var(--ant-color-border-secondary, #e2e8f0)",
                          }}
                        />

                        <Title
                          level={5}
                          className="text-slate-800 dark:text-slate-200 mb-3"
                        >
                          Guarantor Address
                        </Title>
                        <AddressFields name={["guarantor", "address"]} />
                      </>
                    )}
                  </Card>

                  {/* 2. Opening Savings Balances */}
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-700 dark:text-blue-300">
                            <WalletOutlined className="text-base" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                            2. Savings Opening Balances
                          </span>
                        </div>
                        <Form.Item
                          name="includeSavings"
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch
                            checkedChildren="Include"
                            unCheckedChildren="Skip"
                          />
                        </Form.Item>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                  >
                    {includeSavings ? (
                      <Row gutter={[16, 12]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="General Savings Opening Balance"
                            name={["savings", "generalSavingsBalance"]}
                            extra="Pre-existing regular savings balance"
                          >
                            <InputNumber
                              prefix="৳"
                              min={0}
                              precision={2}
                              className="w-full rounded-lg"
                              placeholder="0.00"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Special Savings Opening Balance"
                            name={["savings", "specialSavingsBalance"]}
                            extra="Pre-existing voluntary special savings balance"
                          >
                            <InputNumber
                              prefix="৳"
                              min={0}
                              precision={2}
                              className="w-full rounded-lg"
                              placeholder="0.00"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        Savings opening balance skipped. An empty savings
                        account will be initialized with ৳0.00.
                      </div>
                    )}
                  </Card>

                  {/* 3. Ongoing Loan Migration */}
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                            <BankOutlined className="text-base" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                            3. Ongoing / Active Loan Migration
                          </span>
                        </div>
                        <Form.Item
                          name="includeLoan"
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch
                            checkedChildren="Include"
                            unCheckedChildren="None"
                          />
                        </Form.Item>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                  >
                    {includeLoan ? (
                      <>
                        <Row gutter={[16, 12]}>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Loan ID / Ref Code"
                              name={["loan", "loanId"]}
                              extra="e.g. LN-0042 (optional)"
                            >
                              <Input
                                placeholder="LN-..."
                                className="rounded-lg font-mono"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Principal Disbursed Amount"
                              name={["loan", "principalAmount"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Principal amount is required",
                                },
                              ]}
                            >
                              <InputNumber
                                prefix="৳"
                                min={1000}
                                precision={2}
                                className="w-full rounded-lg"
                                placeholder="50000"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Loan Charge / Profit %"
                              name={["loan", "chargeValue"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Charge % is required",
                                },
                              ]}
                            >
                              <InputNumber
                                suffix="%"
                                min={0}
                                max={100}
                                className="w-full rounded-lg"
                                placeholder="10"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Total Installments"
                              name={["loan", "installmentCount"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Installment count is required",
                                },
                              ]}
                            >
                              <InputNumber
                                min={1}
                                max={300}
                                className="w-full rounded-lg"
                                placeholder="46"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Frequency"
                              name={["loan", "frequency"]}
                            >
                              <Radio.Group buttonStyle="solid">
                                <Radio.Button value="WEEKLY">
                                  Weekly
                                </Radio.Button>
                                <Radio.Button value="MONTHLY">
                                  Monthly
                                </Radio.Button>
                              </Radio.Group>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Original Disbursement Date"
                              name={["loan", "disbursementDate"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Disbursement date is required",
                                },
                              ]}
                            >
                              <DatePicker
                                className="w-full rounded-lg"
                                format="DD MMM YYYY"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="First Due Date"
                              name={["loan", "firstDueDate"]}
                              rules={[
                                {
                                  required: true,
                                  message: "First due date is required",
                                },
                              ]}
                            >
                              <DatePicker
                                className="w-full rounded-lg"
                                format="DD MMM YYYY"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Already Paid Installments Count"
                              name={["loan", "paidInstallments"]}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Paid installments count is required",
                                },
                              ]}
                              extra="Installments 1 to N will be marked PAID automatically"
                            >
                              <InputNumber
                                min={0}
                                max={loanInstallmentCount}
                                style={{ width: "100%" }}
                                className="w-full rounded-lg"
                              />
                            </Form.Item>
                          </Col>

                          {/* Custom Installment Control Panel */}
                          <Col xs={24}>
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 mt-1 mb-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <SettingOutlined className="text-blue-600 text-base" />
                                  <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                      Custom Installment Amount
                                    </span>
                                    <Tag
                                      color={
                                        isCustomInstallment ? "blue" : "default"
                                      }
                                      className="ml-2 text-[10px] font-semibold"
                                    >
                                      {isCustomInstallment
                                        ? "Manual Mode"
                                        : "Auto Mode"}
                                    </Tag>
                                  </div>
                                </div>
                                <Switch
                                  checked={isCustomInstallment}
                                  onChange={(checked) => {
                                    setIsCustomInstallment(checked);
                                    if (
                                      checked &&
                                      loanCalc?.autoInstallmentAmount
                                    ) {
                                      singleForm.setFieldsValue({
                                        loan: {
                                          ...singleForm.getFieldValue("loan"),
                                          customInstallmentAmount:
                                            loanCalc.autoInstallmentAmount,
                                        },
                                      });
                                    }
                                  }}
                                  checkedChildren="Manual"
                                  unCheckedChildren="Auto"
                                />
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">
                                {isCustomInstallment
                                  ? `Specify regular installments (1 to ${Math.max(
                                      1,
                                      (loanInstallmentCount || 1) - 1,
                                    )}). The final installment auto-adjusts to cover the remaining balance.`
                                  : "Regular installments are auto-calculated using the standard lower-10s rule. Toggle ON to manually specify regular installments."}
                              </div>

                              {isCustomInstallment && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                  <Row gutter={[16, 12]} align="middle">
                                    <Col xs={24} sm={14}>
                                      <Form.Item
                                        label={
                                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Regular Installment (1st to{" "}
                                            {Math.max(
                                              1,
                                              (loanInstallmentCount || 1) - 1,
                                            )}
                                            th):
                                          </span>
                                        }
                                        name={["loan", "customInstallmentAmount"]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <InputNumber
                                          style={{ width: "100%" }}
                                          className="rounded-lg text-base font-semibold"
                                          prefix="৳"
                                          min={1}
                                          precision={2}
                                          placeholder="e.g. 1200"
                                        />
                                      </Form.Item>
                                      {loanCalc?.autoInstallmentAmount ? (
                                        <div className="text-[11px] text-slate-500 mt-1">
                                          System auto amount was:{" "}
                                          <button
                                            type="button"
                                            className="text-blue-600 underline font-medium cursor-pointer"
                                            onClick={() =>
                                              singleForm.setFieldsValue({
                                                loan: {
                                                  ...singleForm.getFieldValue(
                                                    "loan",
                                                  ),
                                                  customInstallmentAmount:
                                                    loanCalc.autoInstallmentAmount,
                                                },
                                              })
                                            }
                                          >
                                            {formatCurrency(
                                              loanCalc.autoInstallmentAmount,
                                            )}
                                          </button>
                                        </div>
                                      ) : null}
                                    </Col>

                                    <Col xs={24} sm={10}>
                                      <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/30">
                                        <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                                          Final ({loanInstallmentCount || 1}th)
                                          Installment:
                                        </div>
                                        <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-0.5">
                                          {loanCalc
                                            ? formatCurrency(
                                                loanCalc.lastInstallmentAmount,
                                              )
                                            : "৳0.00"}
                                        </div>
                                        <div className="text-[10px] text-purple-600 dark:text-purple-400">
                                          Remainder auto-adjusted
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>

                                  {loanCalc && !loanCalc.isValidCustomAmount && (
                                    <Alert
                                      type="error"
                                      showIcon
                                      message="Invalid Installment Amount"
                                      description={loanCalc.customAmountError}
                                      className="mt-3 rounded-lg"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </Col>
                        </Row>

                        {/* Live Calculation Preview Banner */}
                        {loanCalc && (
                          <div className="mt-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs sm:text-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                              <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                <InfoCircleOutlined /> Loan Schedule Live Calculation Preview:
                              </div>
                              <Button
                                size="small"
                                icon={<TableOutlined />}
                                onClick={() => setLoanScheduleModalOpen(true)}
                              >
                                View Schedule Breakdown ({loanCalc.installmentCount} Inst)
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-slate-800 dark:text-slate-200">
                              <div>
                                <div className="text-[11px] text-slate-500">
                                  Total Payable:
                                </div>
                                <strong className="text-sm font-semibold">
                                  {formatCurrency(loanCalc.totalPayable)}
                                </strong>
                              </div>
                              <div>
                                <div className="text-[11px] text-slate-500">
                                  Regular (1 to {loanCalc.regularInstallmentCount}):
                                </div>
                                <strong className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                  {formatCurrency(loanCalc.regularInstallmentAmount)}
                                </strong>
                              </div>
                              <div>
                                <div className="text-[11px] text-slate-500">
                                  Final ({loanCalc.installmentCount}th):
                                </div>
                                <strong className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                  {formatCurrency(loanCalc.lastInstallmentAmount)}
                                </strong>
                              </div>
                              <div>
                                <div className="text-[11px] text-slate-500">
                                  Historical Paid:
                                </div>
                                <strong className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                  {formatCurrency(loanCalc.paidAmount)}{" "}
                                  <span className="text-[10px] font-normal text-slate-500">
                                    ({loanPaidCount} inst)
                                  </span>
                                </strong>
                              </div>
                              <div>
                                <div className="text-[11px] text-slate-500">
                                  Remaining Balance:
                                </div>
                                <strong className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                                  {formatCurrency(loanCalc.remainingAmount)}{" "}
                                  <span className="text-[10px] font-normal text-slate-500">
                                    ({loanCalc.remainingInstallments} inst)
                                  </span>
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modal to preview schedule */}
                        <Modal
                          title={
                            <div className="flex items-center gap-2">
                              <TableOutlined className="text-blue-600" />
                              <span>Migrated Loan Repayment Schedule Preview</span>
                            </div>
                          }
                          open={loanScheduleModalOpen}
                          onCancel={() => setLoanScheduleModalOpen(false)}
                          width={750}
                          footer={[
                            <Button
                              key="close"
                              type="primary"
                              onClick={() => setLoanScheduleModalOpen(false)}
                            >
                              Done
                            </Button>,
                          ]}
                        >
                          <div className="py-2">
                            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs flex justify-between items-center">
                              <div>
                                Total: <strong>{formatCurrency(loanCalc?.totalPayable || 0)}</strong> · Installments:{" "}
                                <strong>{loanCalc?.installmentCount || 0}</strong>
                              </div>
                              <div className="text-emerald-700 font-semibold">
                                {loanPaidCount} Paid · {loanCalc?.remainingInstallments || 0} Remaining
                              </div>
                            </div>
                            <Table
                              columns={scheduleColumns}
                              dataSource={loanCalc?.schedule || []}
                              rowKey="installmentNo"
                              pagination={false}
                              size="small"
                              scroll={{ y: 350 }}
                            />
                          </div>
                        </Modal>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        No ongoing loan for this member.
                      </div>
                    )}
                  </Card>

                  {/* 4. Ongoing DPS Migration */}
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-700 dark:text-purple-300">
                            <SafetyCertificateOutlined className="text-base" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                            4. Ongoing / Active DPS Migration
                          </span>
                        </div>
                        <Form.Item
                          name="includeDps"
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch
                            checkedChildren="Include"
                            unCheckedChildren="None"
                          />
                        </Form.Item>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 24 }}
                  >
                    {includeDps ? (
                      <>
                        <Row gutter={[16, 12]}>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="DPS Number / Code"
                              name={["dps", "dpsNumber"]}
                            >
                              <Input
                                placeholder="DPS-..."
                                className="rounded-lg font-mono"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Monthly Installment Amount"
                              name={["dps", "installmentAmount"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Installment amount is required",
                                },
                              ]}
                            >
                              <InputNumber
                                prefix="৳"
                                min={100}
                                className="w-full rounded-lg"
                                placeholder="500"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Duration (Months)"
                              name={["dps", "durationMonths"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Duration is required",
                                },
                              ]}
                            >
                              <InputNumber
                                min={6}
                                max={120}
                                className="w-full rounded-lg"
                                placeholder="36"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Interest Rate %"
                              name={["dps", "interestRate"]}
                            >
                              <InputNumber
                                suffix="%"
                                min={0}
                                max={30}
                                className="w-full rounded-lg"
                                placeholder="8"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Original Start Date"
                              name={["dps", "startDate"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Start date is required",
                                },
                              ]}
                            >
                              <DatePicker
                                className="w-full rounded-lg"
                                format="DD MMM YYYY"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              label="Already Paid Installments Count"
                              name={["dps", "paidInstallments"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Paid count is required",
                                },
                              ]}
                            >
                              <InputNumber
                                min={0}
                                max={dpsDurationMonths}
                                className="w-full rounded-lg"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        {dpsCalc && (
                          <div className="mt-2 p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/20 text-xs sm:text-sm">
                            Total Deposited So Far:{" "}
                            <strong className="text-purple-700">
                              ৳{dpsCalc.totalPaid.toLocaleString()} (
                              {dpsPaidCount} installments)
                            </strong>{" "}
                            · Remaining Installments:{" "}
                            <strong>{dpsCalc.remainingInstallments}</strong>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        No active DPS for this member.
                      </div>
                    )}
                  </Card>

                  {/* Submit Action Card */}
                  <Card
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-slate-50/70 dark:bg-slate-900/50"
                    styles={{ body: { padding: "16px 24px" } }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          Ready to Migrate Member
                        </div>
                        <div className="text-xs text-slate-500">
                          Please verify all historical balances and terms before confirming.
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="large"
                          onClick={() => {
                            singleForm.resetFields();
                            setHasFatherAddress(false);
                            setHasGuarantor(false);
                            setIsCustomInstallment(false);
                          }}
                          style={{ minWidth: 120 }}
                        >
                          Reset Form
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isSubmittingSingle}
                          size="large"
                          className="bg-emerald-600 hover:bg-emerald-700 font-semibold px-8 shadow-md"
                          style={{
                            backgroundColor: "#059669",
                            borderColor: "#059669",
                            minWidth: 220,
                          }}
                        >
                          Confirm & Migrate Member
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Form>
              </div>
            ),
          },
          {
            key: "bulk",
            label: (
              <span>
                <FileExcelOutlined /> Excel / CSV Bulk Migration
              </span>
            ),
            children: (
              <div className="space-y-4">
                {/* Step 1 & 2 Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <DownloadOutlined className="text-blue-600" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            Step 1: Download Excel / CSV Template
                          </span>
                        </div>
                      }
                      className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm h-full"
                    >
                      <Paragraph
                        type="secondary"
                        className="text-xs sm:text-sm"
                      >
                        Download the standard Excel-compatible CSV template
                        formatted with all member columns, savings balances,
                        ongoing loans, and DPS details.
                      </Paragraph>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadTemplate}
                        className="bg-blue-600 hover:bg-blue-700 font-medium"
                      >
                        Download Template (.csv)
                      </Button>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <CloudUploadOutlined className="text-emerald-600" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            Step 2: Upload Filled CSV File
                          </span>
                        </div>
                      }
                      className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm h-full"
                    >
                      <Paragraph
                        type="secondary"
                        className="text-xs sm:text-sm"
                      >
                        Upload your saved CSV file to preview and validate the
                        data before executing the migration.
                      </Paragraph>
                      <Upload
                        beforeUpload={handleFileUpload}
                        showUploadList={false}
                        accept=".csv,text/csv"
                      >
                        <Button
                          icon={<CloudUploadOutlined />}
                          className="font-medium"
                        >
                          Select CSV File
                        </Button>
                      </Upload>
                    </Card>
                  </Col>
                </Row>

                {/* Batch Migration Summary Results */}
                {batchResults && (
                  <Card
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    style={{ marginBottom: 20 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                        Migration Execution Results:
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag color="blue">
                          Total: {batchResults.totalProcessed}
                        </Tag>
                        <Tag color="green">
                          Success: {batchResults.successfulCount}
                        </Tag>
                        <Tag color="red">
                          Failed: {batchResults.failedCount}
                        </Tag>
                      </div>
                    </div>
                    {batchResults.failedCount > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="text-xs font-semibold text-rose-600">
                          Failed Records:
                        </div>
                        {batchResults.results
                          .filter((r) => !r.success)
                          .map((f, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                            >
                              <strong>
                                {f.memberName ||
                                  f.memberId ||
                                  `Row #${idx + 1}`}
                                :
                              </strong>{" "}
                              {f.error}
                            </div>
                          ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Step 3: Preview Table */}
                {parsedRows.length > 0 && (
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircleOutlined className="text-emerald-600" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            Parsed Data Preview ({parsedRows.length} members
                            found)
                          </span>
                        </div>
                        <Button
                          type="primary"
                          size="large"
                          loading={isSubmittingBatch}
                          onClick={handleBatchSubmit}
                          className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                          style={{
                            backgroundColor: "#059669",
                            borderColor: "#059669",
                          }}
                        >
                          Execute Batch Migration (
                          {parsedRows.filter((r) => r.isValid).length} Valid)
                        </Button>
                      </div>
                    }
                    className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                  >
                    <Table
                      dataSource={parsedRows}
                      columns={previewColumns}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 800 }}
                    />
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
