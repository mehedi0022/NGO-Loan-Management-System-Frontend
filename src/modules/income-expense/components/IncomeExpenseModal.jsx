import {
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
import { useEffect } from "react";
import {
  useCreateIncomeExpenseMutation,
  useGetCategoriesQuery,
  useUpdateIncomeExpenseMutation,
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
  voucher = null,
}) {
  const [form] = Form.useForm();
  const isEditing = Boolean(voucher);
  const selectedType = Form.useWatch("type", form) || initialType;

  const [createVoucher, { isLoading: isCreating }] =
    useCreateIncomeExpenseMutation();
  const [updateVoucher, { isLoading: isUpdating }] =
    useUpdateIncomeExpenseMutation();

  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategoriesQuery({ isActive: true });
  const { data: somitiesData, isLoading: somitiesLoading } =
    useGetActiveSomitiesQuery();

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

    if (voucher) {
      form.setFieldsValue({
        type: voucher.type,
        categoryId: voucher.categoryId || voucher.category?.id,
        amount: voucher.amount,
        date: voucher.date ? dayjs(voucher.date) : dayjs(),
        paymentMethod: voucher.paymentMethod || "CASH",
        reference: voucher.reference || "",
        description: voucher.description || "",
        somitiId: voucher.somitiId || voucher.somiti?.id || null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: initialType,
        date: dayjs(),
        paymentMethod: "CASH",
        somitiId: null,
      });
    }
  }, [open, voucher, initialType, form]);

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

      if (isEditing) {
        await updateVoucher({ id: voucher.id, ...payload }).unwrap();
        message.success("Voucher transaction updated successfully");
      } else {
        await createVoucher(payload).unwrap();
        message.success(
          `${values.type === "INCOME" ? "Income" : "Expense"} voucher created successfully`,
        );
      }

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
      confirmLoading={isCreating || isUpdating}
      title={
        isEditing
          ? `Edit Voucher — ${voucher?.voucherNo}`
          : selectedType === "INCOME"
            ? "+ Add Income Voucher (Credit)"
            : "+ Add Expense Voucher (Debit)"
      }
      okText={isEditing ? "Save Changes" : "Create Voucher"}
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
                disabled={isEditing}
                buttonStyle="solid"
                onChange={() => form.setFieldValue("categoryId", undefined)}
              >
                <Radio.Button value="INCOME">Income (Credit)</Radio.Button>
                <Radio.Button value="EXPENSE">Expense (Debit)</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>

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
