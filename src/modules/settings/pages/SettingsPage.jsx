import {
  BankOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  KeyOutlined,
  LockOutlined,
  PhoneOutlined,
  SaveOutlined,
  SettingOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { can, permissions } from "../../auth/permissions.js";
import {
  useChangePasswordMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "../settingsApi.js";

export function SettingsPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const canUpdate = can(currentUser, permissions.settingsUpdate);

  const [activeTab, setActiveTab] = useState("organization");

  // Form Instances
  const [orgForm] = Form.useForm();
  const [policyForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Queries & Mutations
  const { data: settingsResponse, isLoading: settingsLoading } =
    useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdatingSettings }] =
    useUpdateSettingsMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const settings = settingsResponse?.data;

  // Populate Org & Policy Forms when settings load
  useEffect(() => {
    if (settings) {
      orgForm.setFieldsValue({
        orgName: settings.orgName,
        orgShortName: settings.orgShortName || "",
        registrationNo: settings.registrationNo || "",
        establishedYear: settings.establishedYear || "",
        logoUrl: settings.logoUrl || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        website: settings.website || "",
      });

      policyForm.setFieldsValue({
        currencySymbol: settings.currencySymbol || "৳",
        currencyCode: settings.currencyCode || "BDT",
        defaultLoanChargeType: settings.defaultLoanChargeType || "PERCENTAGE",
        defaultLoanChargeValue: settings.defaultLoanChargeValue ?? 10,
        defaultLoanFrequency: settings.defaultLoanFrequency || "WEEKLY",
        defaultGraceDays: settings.defaultGraceDays ?? 0,
        latePenaltyPercentage: settings.latePenaltyPercentage ?? 0,
        minGeneralSavingsDeposit: settings.minGeneralSavingsDeposit ?? 50,
        minSpecialSavingsDeposit: settings.minSpecialSavingsDeposit ?? 100,
      });
    }
  }, [settings, orgForm, policyForm]);

  // Handle Save Org Info
  const handleSaveOrg = async () => {
    try {
      const values = await orgForm.validateFields();
      await updateSettings(values).unwrap();
      message.success("Organization profile updated successfully");
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.data?.message || "Failed to update organization profile");
    }
  };

  // Handle Save Policy Rules
  const handleSavePolicy = async () => {
    try {
      const values = await policyForm.validateFields();
      await updateSettings({
        ...values,
        defaultLoanChargeValue: Number(values.defaultLoanChargeValue),
        defaultGraceDays: Number(values.defaultGraceDays),
        latePenaltyPercentage: Number(values.latePenaltyPercentage),
        minGeneralSavingsDeposit: Number(values.minGeneralSavingsDeposit),
        minSpecialSavingsDeposit: Number(values.minSpecialSavingsDeposit),
      }).unwrap();
      message.success("Financial policy rules updated successfully");
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.data?.message || "Failed to update policy rules");
    }
  };

  // Handle Change Password
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      message.success("Your password has been changed successfully");
      passwordForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.data?.message || "Failed to change password");
    }
  };

  return (
    <PageContainer>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Settings & Configuration
        </Typography.Title>
        <Typography.Text type="secondary">
          Configure organization profile, default financial rules, and manage your account security.
        </Typography.Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        items={[
          {
            key: "organization",
            label: (
              <span>
                <ShopOutlined /> Organization Profile
              </span>
            ),
            children: (
              <Card
                bordered={false}
                className="shadow-sm"
                loading={settingsLoading}
              >
                {!canUpdate && (
                  <Alert
                    type="info"
                    showIcon
                    message="View Only"
                    description="You have view-only access. Only administrators can modify organization details."
                    style={{ marginBottom: 20 }}
                  />
                )}

                <Form
                  form={orgForm}
                  layout="vertical"
                  disabled={!canUpdate}
                >
                  <Typography.Title level={4} style={{ marginTop: 0 }}>
                    Organization Identity
                  </Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} md={16}>
                      <Form.Item
                        name="orgName"
                        label="Full Organization Name"
                        rules={[
                          { required: true, message: "Organization name is required" },
                        ]}
                      >
                        <Input placeholder="e.g. Purbasha Financial Development Organization" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="orgShortName" label="Short Name / Acronym">
                        <Input placeholder="e.g. PFDO" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={12}>
                      <Form.Item name="registrationNo" label="Govt. Registration No.">
                        <Input placeholder="e.g. REG-NGO-2024-001" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={12}>
                      <Form.Item name="establishedYear" label="Established Year">
                        <Input placeholder="e.g. 2018" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        name="logoUrl"
                        label="Logo Image URL"
                        extra="Enter a web URL for your NGO logo to display on collection sheets and vouchers."
                      >
                        <Input placeholder="https://example.com/logo.png" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  <Typography.Title level={4}>
                    Contact & Headquarters Address
                  </Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="Official Email Address"
                        rules={[{ type: "email", message: "Enter a valid email address" }]}
                      >
                        <Input placeholder="info@purbasha.org" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="phone" label="Helpline / Contact Phone">
                        <Input placeholder="+8801700000000" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="website" label="Official Website">
                        <Input placeholder="https://purbasha.org" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="address" label="Head / Branch Office Address">
                        <Input placeholder="Main Road, Branch Office, Bangladesh" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {canUpdate && (
                    <div style={{ marginTop: 24, textAlign: "right" }}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={isUpdatingSettings}
                        onClick={handleSaveOrg}
                      >
                        Save Organization Profile
                      </Button>
                    </div>
                  )}
                </Form>
              </Card>
            ),
          },
          {
            key: "policy",
            label: (
              <span>
                <BankOutlined /> Financial & Loan Rules
              </span>
            ),
            children: (
              <Card
                bordered={false}
                className="shadow-sm"
                loading={settingsLoading}
              >
                {!canUpdate && (
                  <Alert
                    type="info"
                    showIcon
                    message="View Only"
                    description="You have view-only access. Only administrators can modify financial policy defaults."
                    style={{ marginBottom: 20 }}
                  />
                )}

                <Form
                  form={policyForm}
                  layout="vertical"
                  disabled={!canUpdate}
                >
                  <Typography.Title level={4} style={{ marginTop: 0 }}>
                    Currency & Units
                  </Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        name="currencySymbol"
                        label="Currency Symbol"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="৳" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        name="currencyCode"
                        label="Currency Code"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="BDT" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  <Typography.Title level={4}>
                    Loan Default Policy
                  </Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="defaultLoanChargeType"
                        label="Default Service Charge Type"
                        rules={[{ required: true }]}
                      >
                        <Radio.Group buttonStyle="solid">
                          <Radio.Button value="PERCENTAGE">Percentage (%)</Radio.Button>
                          <Radio.Button value="FLAT">Flat Fee (Tk)</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="defaultLoanChargeValue"
                        label="Default Charge Rate/Value"
                        rules={[{ required: true }]}
                      >
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="defaultLoanFrequency"
                        label="Default Repayment Frequency"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={[
                            { value: "WEEKLY", label: "Weekly" },
                            { value: "MONTHLY", label: "Monthly" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="defaultGraceDays"
                        label="Default Grace Period (Days)"
                        extra="Days before installment is marked overdue"
                      >
                        <InputNumber style={{ width: "100%" }} min={0} max={365} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="latePenaltyPercentage"
                        label="Late Fine / Penalty (%)"
                        extra="Default fine percentage for delayed return"
                      >
                        <InputNumber style={{ width: "100%" }} min={0} max={100} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  <Typography.Title level={4}>
                    Savings Policy Defaults
                  </Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="minGeneralSavingsDeposit"
                        label="Minimum General Savings Deposit (৳)"
                      >
                        <InputNumber style={{ width: "100%" }} min={0} prefix="৳" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="minSpecialSavingsDeposit"
                        label="Minimum Special Savings Deposit (৳)"
                      >
                        <InputNumber style={{ width: "100%" }} min={0} prefix="৳" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {canUpdate && (
                    <div style={{ marginTop: 24, textAlign: "right" }}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={isUpdatingSettings}
                        onClick={handleSavePolicy}
                      >
                        Save Financial Policy Rules
                      </Button>
                    </div>
                  )}
                </Form>
              </Card>
            ),
          },
          {
            key: "security",
            label: (
              <span>
                <KeyOutlined /> My Profile & Security
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                {/* User Identity Card */}
                <Col xs={24} md={10}>
                  <Card
                    bordered={false}
                    className="shadow-sm"
                    title={<Space><UserOutlined /> User Information</Space>}
                  >
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <Avatar
                        size={64}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                      />
                      <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 2 }}>
                        {currentUser?.fullName || "Staff Member"}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        @{currentUser?.userName || "user"}
                      </Typography.Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="geekblue" style={{ fontSize: 12 }}>
                          {currentUser?.role?.replace("_", " ")}
                        </Tag>
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Active
                        </Tag>
                      </div>
                    </div>

                    <Divider />

                    <div style={{ fontSize: 13 }}>
                      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                        <Typography.Text type="secondary">Email:</Typography.Text>
                        <Typography.Text strong>{currentUser?.email || "—"}</Typography.Text>
                      </div>
                      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                        <Typography.Text type="secondary">User ID:</Typography.Text>
                        <Typography.Text strong>#{currentUser?.id}</Typography.Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Change Password Card */}
                <Col xs={24} md={14}>
                  <Card
                    bordered={false}
                    className="shadow-sm"
                    title={<Space><LockOutlined /> Change Password</Space>}
                  >
                    <Form
                      form={passwordForm}
                      layout="vertical"
                    >
                      <Form.Item
                        name="currentPassword"
                        label="Current Password"
                        rules={[
                          { required: true, message: "Please enter your current password" },
                        ]}
                      >
                        <Input.Password placeholder="Enter current password" />
                      </Form.Item>

                      <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                          { required: true, message: "Please enter new password" },
                          { min: 8, message: "Password must be at least 8 characters" },
                        ]}
                      >
                        <Input.Password placeholder="Enter new password (min 8 chars)" />
                      </Form.Item>

                      <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={["newPassword"]}
                        rules={[
                          { required: true, message: "Please confirm your new password" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue("newPassword") === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("The passwords you entered do not match!"),
                              );
                            },
                          }),
                        ]}
                      >
                        <Input.Password placeholder="Re-enter new password" />
                      </Form.Item>

                      <div style={{ marginTop: 24, textAlign: "right" }}>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={isChangingPassword}
                          onClick={handleChangePassword}
                        >
                          Update Password
                        </Button>
                      </div>
                    </Form>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
