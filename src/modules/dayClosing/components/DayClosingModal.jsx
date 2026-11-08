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
  Modal,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  useExecuteDayClosingMutation,
  useGetDayClosingPreviewQuery,
} from "../dayClosingApi.js";

const { Title, Text, Paragraph } = Typography;

export function DayClosingModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [isHoliday, setIsHoliday] = useState(false);

  const { data: previewData, isLoading, refetch } = useGetDayClosingPreviewQuery(
    undefined,
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const [executeDayClosing, { isLoading: isClosing }] = useExecuteDayClosingMutation();

  const preview = previewData?.data;

  useEffect(() => {
    if (preview && open) {
      form.setFieldsValue({
        nextBusinessDate: preview.suggestedNextDate
          ? dayjs(preview.suggestedNextDate)
          : dayjs(preview.businessDate).add(1, "day"),
        notes: "",
        isNextDayHoliday: false,
      });
      setIsHoliday(false);
    }
  }, [preview, open, form]);

  const handleSubmit = async (values) => {
    try {
      const payload = {
        notes: values.notes,
        nextBusinessDate: values.nextBusinessDate
          ? values.nextBusinessDate.format("YYYY-MM-DD")
          : undefined,
        isNextDayHoliday: isHoliday,
      };

      await executeDayClosing(payload).unwrap();
      message.success("Business day closed and locked successfully!");
      onClose();
    } catch (err) {
      message.error(err?.data?.message || "Failed to execute day closing");
    }
  };

  const formatTk = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <LockOutlined className="text-amber-600 text-lg" />
          <span className="font-semibold text-lg">Execute Day Closing & Lock</span>
        </div>
      }
      footer={null}
      width={720}
      destroyOnClose
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <Spin size="large" tip="Generating final financial snapshot..." />
        </div>
      ) : !preview ? (
        <Alert
          type="error"
          message="Failed to load closing preview"
          description="No active open business day found."
          showIcon
          className="my-4"
        />
      ) : (
        <div className="space-y-4 pt-2">
          {/* Deferred Notice Banner */}
          {preview.isDeferred && (
            <Alert
              type="warning"
              showIcon
              icon={<ClockCircleOutlined />}
              message="Deferred Day Closing"
              description={
                <span>
                  You are closing the business day for <strong>{preview.businessDate}</strong> on today's calendar date (
                  {preview.calendarDate}). Upon closing, the next business day will be initialized automatically.
                </span>
              }
              className="border-amber-200 bg-amber-50"
            />
          )}

          {/* Business Date Header */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-slate-500 text-base" />
              <Text strong className="text-slate-700">Active Business Day:</Text>
              <Tag color="geekblue" className="text-sm font-semibold px-2 py-0.5">
                {preview.businessDate}
              </Tag>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                OPEN
              </Tag>
            </div>
            <div>
              <Text type="secondary" className="text-xs">
                Total Transactions: {preview.totalTransactionsCount}
              </Text>
            </div>
          </div>

          {/* Snapshot Summary Cards */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card size="small" className="bg-blue-50/50 border-blue-200">
                <Statistic
                  title={<span className="text-slate-600 font-medium">Opening Balance</span>}
                  value={preview.openingBalance}
                  precision={2}
                  prefix="৳"
                  valueStyle={{ color: "#1d4ed8", fontSize: "1.15rem", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small" className="bg-emerald-50/50 border-emerald-200">
                <Statistic
                  title={<span className="text-slate-600 font-medium">Total Cash In</span>}
                  value={preview.cashIn.total}
                  precision={2}
                  prefix="৳"
                  valueStyle={{ color: "#059669", fontSize: "1.15rem", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small" className="bg-rose-50/50 border-rose-200">
                <Statistic
                  title={<span className="text-slate-600 font-medium">Total Cash Out</span>}
                  value={preview.cashOut.total}
                  precision={2}
                  prefix="৳"
                  valueStyle={{ color: "#e11d48", fontSize: "1.15rem", fontWeight: 600 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Closing Balance Highlight */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-lg flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                Final Closing Balance
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Automatically carried forward as Opening Balance for the next business day
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {formatTk(preview.closingBalance)}
            </div>
          </div>

          {/* Breakdown Details */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
            <div className="font-semibold text-slate-700 mb-1">Cash Flow Breakdown:</div>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-600">• Loan Collection:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashIn.loanCollection)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-600">• Savings Deposit:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashIn.savingsDeposit)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-600">• DPS Deposit:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashIn.dpsDeposit)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">• Admission & Other Income:</span>
                  <span className="font-semibold text-slate-800">
                    {formatTk(preview.cashIn.admissionFee + preview.cashIn.capitalReceived + preview.cashIn.otherIncome)}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-600">• Loan Disbursement:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashOut.loanDisbursed)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-600">• Savings Withdrawal:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashOut.savingsWithdrawn)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-600">• DPS Payouts:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashOut.dpsWithdrawn)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">• Office Expenses:</span>
                  <span className="font-semibold text-slate-800">{formatTk(preview.cashOut.officeExpense)}</span>
                </div>
              </Col>
            </Row>
          </div>

          {/* Form Controls for Next Day and Notes */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mt-4"
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="nextBusinessDate"
                  label={<span className="font-semibold text-slate-700">Next Business Day</span>}
                  rules={[{ required: true, message: "Please select next business date" }]}
                  extra="You may skip weekends (e.g. Friday) and pick the next working day directly."
                >
                  <DatePicker
                    className="w-full"
                    format="YYYY-MM-DD"
                    disabledDate={(current) =>
                      current && current <= dayjs(preview.businessDate).endOf("day")
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="font-semibold text-slate-700">Holiday Flag</span>}
                >
                  <div className="pt-2">
                    <Checkbox
                      checked={isHoliday}
                      onChange={(e) => setIsHoliday(e.target.checked)}
                    >
                      Mark next business day as an official holiday
                    </Checkbox>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label={<span className="font-medium text-slate-700">Closing Notes / Remarks (Optional)</span>}
            >
              <Input.TextArea
                rows={2}
                placeholder="Enter remarks regarding daily reconciliation, physical cash count, or shortages/surpluses..."
                maxLength={500}
                showCount
              />
            </Form.Item>

            {/* Warning Callout */}
            <Alert
              type="error"
              showIcon
              icon={<WarningOutlined />}
              message="Irreversible Lock Notice"
              description="Once day closing is confirmed, this business day will be permanently LOCKED. Backdated transactions, loan disbursements, or expense vouchers cannot be posted to this date."
              className="mb-4 bg-red-50 border-red-200"
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <Button onClick={onClose} disabled={isClosing}>
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={isClosing}
                icon={<LockOutlined />}
                className="bg-amber-600 hover:bg-amber-700 border-none font-semibold px-6"
              >
                Confirm & Close Business Day
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
}
