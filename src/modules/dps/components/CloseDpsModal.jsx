import {
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";
import { useCloseDpsAccountMutation } from "../dpsApi.js";

const { Text, Title } = Typography;

export function CloseDpsModal({ open, onClose, dps, initialMode, onSuccess }) {
  const [form] = Form.useForm();
  const [closeDps, { isLoading }] = useCloseDpsAccountMutation();

  const isAlreadyMatured =
    dps?.status === "MATURED" ||
    (dps?.paidInstallments || 0) >= (dps?.durationMonths || 1);

  // Default closeType: MATURITY_PAYOUT if matured, otherwise PREMATURE_CLOSE
  const [closeType, setCloseType] = useState(
    initialMode === "MATURITY" || isAlreadyMatured
      ? "MATURITY_PAYOUT"
      : "PREMATURE_CLOSE",
  );

  useEffect(() => {
    if (open && dps) {
      const defaultType =
        initialMode === "MATURITY" || isAlreadyMatured
          ? "MATURITY_PAYOUT"
          : "PREMATURE_CLOSE";

      setCloseType(defaultType);

      const defaultAmount =
        defaultType === "MATURITY_PAYOUT"
          ? Number(dps.maturityAmount || 0)
          : Number(dps.totalPaidAmount || 0);

      form.setFieldsValue({
        closeType: defaultType,
        payoutAmount: defaultAmount,
        paymentMethod: "CASH",
        transactionDate: dayjs(),
        notes:
          defaultType === "MATURITY_PAYOUT"
            ? "Maturity tenure completed. Full maturity settlement paid to member."
            : "Premature DPS cancellation requested by member. Total deposited principal refunded.",
      });
    }
  }, [open, dps, initialMode, isAlreadyMatured, form]);

  const handleCloseTypeChange = (e) => {
    const newType = e.target.value;
    setCloseType(newType);

    const newAmount =
      newType === "MATURITY_PAYOUT"
        ? Number(dps?.maturityAmount || 0)
        : Number(dps?.totalPaidAmount || 0);

    form.setFieldsValue({
      closeType: newType,
      payoutAmount: newAmount,
      notes:
        newType === "MATURITY_PAYOUT"
          ? "Maturity tenure completed. Full maturity settlement paid to member."
          : "Premature DPS cancellation requested by member. Total deposited principal refunded.",
    });
  };

  const handleSubmit = async (values) => {
    if (!dps) return;
    try {
      const payload = {
        closeType: values.closeType,
        payoutAmount: Number(values.payoutAmount),
        paymentMethod: values.paymentMethod,
        transactionDate: values.transactionDate
          ? values.transactionDate.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        notes: values.notes?.trim() || undefined,
      };

      await closeDps({ id: dps.id, ...payload }).unwrap();
      message.success(
        values.closeType === "MATURITY_PAYOUT"
          ? "DPS maturity payout completed and account closed successfully."
          : "DPS account cancelled early and refund processed successfully.",
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.data?.message || "Failed to process DPS payout.");
    }
  };

  if (!dps) return null;

  const totalPaid = Number(dps.totalPaidAmount || 0);
  const maturityVal = Number(dps.maturityAmount || 0);
  const profitInterest = Math.max(0, maturityVal - totalPaid);

  const isMaturityPayout = closeType === "MATURITY_PAYOUT";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={640}
      title={
        <Space>
          {isMaturityPayout ? (
            <SafetyCertificateOutlined style={{ color: "#059669", fontSize: 20 }} />
          ) : (
            <StopOutlined style={{ color: "#dc2626", fontSize: 20 }} />
          )}
          <span style={{ fontSize: 17, fontWeight: 600 }}>
            {isMaturityPayout
              ? "DPS Maturity Settlement & Payout"
              : "Premature DPS Closure & Cancellation"}
          </span>
        </Space>
      }
    >
      <div style={{ marginTop: 12 }}>
        {/* Context Alert Banner */}
        {isMaturityPayout ? (
          <Alert
            type="success"
            showIcon
            icon={<SafetyCertificateOutlined />}
            message="Tenure Maturity Settlement"
            description="This account has completed its tenure. Settle the promised maturity payout (principal deposit + accumulated interest) with the member and mark the account as closed."
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="Premature Cancellation (Breaking DPS)"
            description="The member has requested early termination before full maturity. Under standard rules, the deposited principal amount is refunded to the member."
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Account Details Box */}
        <Descriptions
          size="small"
          bordered
          column={{ xs: 1, sm: 2 }}
          style={{ marginBottom: 20, background: "#f8fafc" }}
        >
          <Descriptions.Item label="DPS Number">
            <strong>{dps.dpsNumber || `DPS-${dps.id}`}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Member Name">
            <strong>{dps.member?.fullName || "—"}</strong>{" "}
            <Text type="secondary" style={{ fontSize: 11 }}>
              ({dps.member?.memberId || `#${dps.member?.id}`})
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Monthly Deposit">
            {formatCurrency(dps.installmentAmount)}
          </Descriptions.Item>
          <Descriptions.Item label="Installments Paid">
            <strong>
              {dps.paidInstallments || 0} / {dps.durationMonths}
            </strong>{" "}
            Months
          </Descriptions.Item>
          <Descriptions.Item label="Total Deposited">
            <span style={{ color: "#047857", fontWeight: 700 }}>
              {formatCurrency(totalPaid)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Target Maturity">
            <span style={{ color: "#0284c7", fontWeight: 700 }}>
              {formatCurrency(maturityVal)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {formatDate(dps.startDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Maturity Date">
            {formatDate(dps.maturityDate)}
          </Descriptions.Item>
          {isMaturityPayout && (
            <Descriptions.Item label="Profit / Interest Bonus" span={2}>
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                +{formatCurrency(profitInterest)}
              </span>{" "}
              <Text type="secondary" style={{ fontSize: 11 }}>
                (at {dps.interestRate}% per annum)
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Closure Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            paymentMethod: "CASH",
            transactionDate: dayjs(),
          }}
        >
          {/* Closure Type Switch */}
          <Form.Item
            name="closeType"
            label="Closure & Settlement Mode"
            rules={[{ required: true }]}
          >
            <Radio.Group onChange={handleCloseTypeChange} style={{ width: "100%" }}>
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Radio value="MATURITY_PAYOUT" disabled={!isAlreadyMatured}>
                  <Space orientation="vertical" size={0}>
                    <strong>Full Maturity Payout ({formatCurrency(maturityVal)})</strong>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Pay full maturity value (principal + earned interest). Available
                      when all installments are paid or tenure has matured.
                    </Text>
                  </Space>
                </Radio>
                <Radio value="PREMATURE_CLOSE">
                  <Space orientation="vertical" size={0}>
                    <strong>Premature Cancellation / Refund ({formatCurrency(totalPaid)})</strong>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Member breaks DPS early. Refunds total deposited principal to the
                      member.
                    </Text>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="payoutAmount"
            label="Payout / Refund Amount (Tk)"
            rules={[
              { required: true, message: "Please enter the payout amount" },
              {
                type: "number",
                min: 0,
                message: "Payout amount cannot be negative",
              },
            ]}
            extra="You may adjust the amount if any premature penalty fee or adjustments apply."
          >
            <InputNumber
              prefix="৳"
              style={{ width: "100%", fontSize: 16 }}
              size="large"
              placeholder="0.00"
              precision={2}
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[{ required: true, message: "Select payment method" }]}
            >
              <Select
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                  { value: "MOBILE_PAYMENT", label: "Mobile Payment" },
                  { value: "CHEQUE", label: "Cheque" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="transactionDate"
              label="Settlement Date"
              rules={[{ required: true, message: "Select settlement date" }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Settlement Notes / Remarks">
            <Input.TextArea
              rows={2}
              placeholder="e.g. Member requested premature encashment due to personal emergency."
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 20,
              borderTop: "1px solid #f1f5f9",
              paddingTop: 16,
            }}
          >
            <Button onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="primary"
              danger={!isMaturityPayout}
              style={
                isMaturityPayout
                  ? { background: "#059669", borderColor: "#059669" }
                  : undefined
              }
              htmlType="submit"
              loading={isLoading}
            >
              {isMaturityPayout
                ? "Confirm Maturity Payout & Close Account"
                : "Confirm Cancellation & Refund Principal"}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
