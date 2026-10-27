import { Form, Input, InputNumber, Modal, Select, Switch, message } from "antd";
import { useEffect } from "react";
import { useCreateAccountMutation, useUpdateAccountMutation } from "../accountsApi.js";

const accountTypeOptions = [
  { value: "CASH", label: "Cash Account" },
  { value: "BANK", label: "Bank Account" },
  { value: "MOBILE_BANKING", label: "Mobile Banking (bKash / Nagad / Rocket)" },
];

export function CreateAccountModal({ open, onClose, account = null }) {
  const [form] = Form.useForm();
  const isEditing = Boolean(account);
  const selectedType = Form.useWatch("accountType", form);

  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();

  useEffect(() => {
    if (open) {
      if (account) {
        form.setFieldsValue({
          accountName: account.accountName,
          accountType: account.accountType,
          accountNumber: account.accountNumber,
          bankName: account.bankName,
          branchName: account.branchName,
          isDefault: account.isDefault,
          isActive: account.isActive,
          notes: account.notes,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          accountType: "CASH",
          initialBalance: 0,
          isActive: true,
          isDefault: false,
        });
      }
    }
  }, [open, account, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing) {
        await updateAccount({ id: account.id, ...values }).unwrap();
        message.success("Account updated successfully");
      } else {
        await createAccount({
          ...values,
          initialBalance: Number(values.initialBalance || 0),
        }).unwrap();
        message.success("Account created successfully");
      }
      onClose();
    } catch (error) {
      if (error?.data?.message) {
        message.error(error.data.message);
      }
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Account" : "Add New Account"}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isCreating || isUpdating}
      okText={isEditing ? "Update" : "Create"}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Account Name"
          name="accountName"
          rules={[{ required: true, message: "Please enter account name" }]}
        >
          <Input placeholder="e.g. Branch Main Cash, Sonali Bank Ltd, bKash" />
        </Form.Item>

        <Form.Item
          label="Account Type"
          name="accountType"
          rules={[{ required: true, message: "Please select account type" }]}
        >
          <Select options={accountTypeOptions} />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            label="Initial Balance / Opening Cash"
            name="initialBalance"
            tooltip="Starting balance already in this account (automatically recorded as capital injection)"
          >
            <InputNumber
              style={{ width: "100%" }}
              prefix="৳"
              min={0}
              placeholder="0.00"
            />
          </Form.Item>
        )}

        {(selectedType === "BANK" || selectedType === "MOBILE_BANKING") && (
          <Form.Item
            label="Account / Mobile Number"
            name="accountNumber"
            rules={[{ required: true, message: "Please enter account number" }]}
          >
            <Input placeholder="e.g. 1029384756 or 01711XXXXXX" />
          </Form.Item>
        )}

        {selectedType === "BANK" && (
          <>
            <Form.Item label="Bank Name" name="bankName">
              <Input placeholder="e.g. Sonali Bank, Dutch-Bangla Bank" />
            </Form.Item>

            <Form.Item label="Branch Name" name="branchName">
              <Input placeholder="e.g. Motijheel Branch" />
            </Form.Item>
          </>
        )}

        <Form.Item label="Notes / Description" name="notes">
          <Input.TextArea rows={2} placeholder="Optional notes about this account" />
        </Form.Item>

        <div className="flex gap-6 items-center">
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="Set as Default Cash Account"
            name="isDefault"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
