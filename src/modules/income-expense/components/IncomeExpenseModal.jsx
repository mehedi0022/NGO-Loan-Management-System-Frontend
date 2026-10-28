import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import { useGetAccountsQuery } from "../../accounts/accountsApi.js";
import {
  useCreateIncomeExpenseMutation,
  useGetCategoriesQuery,
} from "../incomeExpenseApi.js";
import { useGetActiveSomitiesQuery } from "../../somities/somitiesApi.js";

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment (bKash/Nagad)" },
  { value: "CHEQUE", label: "Bank Cheque" },
  { value: "OTHER", label: "Other" },
];

export function IncomeExpenseModal({
  open,
  onClose,
  initialType = "INCOME",
}) {
  const [form] = Form.useForm();
  const selectedType = Form.useWatch("type", form) || initialType;
  const selectedPaymentMethod = Form.useWatch("paymentMethod", form) || "CASH";
  const enteredAmount = Form.useWatch("amount", form) || 0;

  const [createVoucher, { isLoading: isCreating }] =
    useCreateIncomeExpenseMutation();

  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategoriesQuery({ isActive: true });
  const { data: somitiesData, isLoading: somitiesLoading } =
    useGetActiveSomitiesQuery();
  const { data: accountsData } = useGetAccountsQuery();

  const accounts = useMemo(() => {
    if (Array.isArray(accountsData?.data)) return accountsData.data;
    if (Array.isArray(accountsData?.data?.accounts))
      return accountsData.data.accounts;
    return [];
  }, [accountsData]);

  // Resolve target account for this transaction
  const targetAccount = useMemo(() => {
    if (selectedPaymentMethod === "BANK_TRANSFER") {
      return (
        accounts.find((a) => a.accountType === "BANK" && a.isActive) ||
        accounts.find((a) => a.isDefault && a.isActive) ||
        accounts[0]
      );
    }
    if (selectedPaymentMethod === "MOBILE_PAYMENT") {
      return (
        accounts.find((a) => a.accountType === "MOBILE_BANKING" && a.isActive) ||
        accounts.find((a) => a.isDefault && a.isActive) ||
        accounts[0]
      );
    }
    return (
      accounts.find((a) => a.isDefault && a.isActive) ||
      accounts.find((a) => a.accountType === "CASH" && a.isActive) ||
      accounts[0]
    );
  }, [accounts, selectedPaymentMethod]);

  const availableBalance = Number(targetAccount?.currentBalance) || 0;
  const isShortage = selectedType === "EXPENSE" && Number(enteredAmount) > availableBalance;
  const shortageAmount = isShortage ? Number(enteredAmount) - availableBalance : 0;

  // Filter categories by selected voucher type
  const categoryOptions = (categoriesData?.data ?? [])
    .filter((c) => c.type === selectedType)
    .map((c) => ({
      value: c.id,
      label: c.name,
    }));

  const somitiOptions = [
    { value: null, label: "None (Branch / Head Office)" },
    ...(somitiesData?.data ?? []).map((s) => ({
      value: s.id,
      label: `${s.name} (${s.code || s.somitiId})`,
    })),
  ];

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    form.setFieldsValue({
      type: initialType,
      date: dayjs(),
      paymentMethod: "CASH",
      somitiId: null,
    });
  }, [open, initialType, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        type: values.type,
        categoryId: values.categoryId,
        amount: Number(values.amount),
        date: values.date ? values.date.format("YYYY-MM-DD") : undefined,
        paymentMethod: values.paymentMethod,
        reference: values.reference || undefined,
        description: values.description || undefined,
        somitiId: values.somitiId || undefined,
      };

      await createVoucher(payload).unwrap();
      message.success(
        `${values.type === "INCOME" ? "Income" : "Expense"} voucher created successfully`,
      );

      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.data?.message || "Failed to save voucher transaction");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isCreating}
      okButtonProps={{ disabled: isShortage }}
      title={
        selectedType === "INCOME"
          ? "+ Add Income Voucher (Credit)"
          : "+ Add Expense Voucher (Debit)"
      }
      okText="Create Voucher"
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="type"
              label="Transaction Type"
              rules={[{ required: true }]}
            >
              <Radio.Group
                buttonStyle="solid"
                onChange={() => form.setFieldValue("categoryId", undefined)}
              >
                <Radio.Button value="INCOME">Income (Credit)</Radio.Button>
                <Radio.Button value="EXPENSE">Expense (Debit)</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>

          {selectedType === "EXPENSE" && targetAccount && (
            <Col span={24} style={{ marginBottom: 16 }}>
              <Alert
                type={isShortage ? "error" : "info"}
                showIcon
                message={
                  <div className="flex justify-between items-center flex-wrap gap-2 text-xs sm:text-sm">
                    <span>
                      Account: <strong>{targetAccount.accountName}</strong>
                    </span>
                    <span>
                      Available Balance:{" "}
                      <strong className={isShortage ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                        ৳{availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </span>
                    {isShortage && (
                      <span className="text-rose-600 font-semibold w-full mt-1">
                        ⚠️ Shortage: ৳{shortageAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Cannot create expense voucher exceeding available balance)
                      </span>
                    )}
                  </div>
                }
              />
            </Col>
          )}

          <Col xs={24} sm={12}>
            <Form.Item
              name="categoryId"
              label="Account Head / Category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                placeholder="Select category"
                options={categoryOptions}
                loading={categoriesLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="amount"
              label="Amount (BDT)"
              rules={[
                { required: true, message: "Please enter transaction amount" },
                {
                  type: "number",
                  min: 1,
                  message: "Amount must be at least 1 Tk",
                },
                {
                  validator: (_, val) => {
                    if (selectedType === "EXPENSE" && val && Number(val) > availableBalance) {
                      return Promise.reject(
                        new Error(
                          `Insufficient balance in ${targetAccount?.accountName || "account"} (Available: ৳${availableBalance.toLocaleString("en-IN")})`
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                prefix="৳"
                placeholder="0.00"
                precision={2}
                min={1}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="date"
              label="Voucher Date"
              rules={[{ required: true, message: "Please select voucher date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[{ required: true, message: "Select payment method" }]}
            >
              <Select options={paymentMethods} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="somitiId" label="Associated Somiti (Optional)">
              <Select
                options={somitiOptions}
                loading={somitiesLoading}
                placeholder="Select somiti if applicable"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="reference" label="Reference / Cheque / TrxID">
              <Input placeholder="e.g. Memo #1024 or bKash TrxID" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="description" label="Particulars / Description">
              <Input.TextArea
                rows={3}
                placeholder="Enter description, purpose or recipient details..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
