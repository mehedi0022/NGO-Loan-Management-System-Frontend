import { SaveOutlined, UploadOutlined } from "@ant-design/icons";

import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Typography,
  Upload,
  message,
} from "antd";

import { useState } from "react";
import { AddressFields } from "./AddressFields.jsx";
import { resolveUploadUrl } from "../../../utils/uploadUrl.js";

const { TextArea } = Input;

const occupationOptions = [
  { value: "Housewife", label: "Housewife" },
  { value: "Farmer", label: "Farmer" },
  { value: "Day Laborer", label: "Day Laborer" },
  {
    value: "Agricultural Worker",
    label: "Agricultural Worker",
  },
  {
    value: "Small Business",
    label: "Small Business",
  },
  { value: "Shopkeeper", label: "Shopkeeper" },
  { value: "Tailor", label: "Tailor / Sewing" },
  {
    value: "Poultry Farmer",
    label: "Poultry Farmer",
  },
  {
    value: "Livestock Farmer",
    label: "Livestock Farmer",
  },
  { value: "Fisherman", label: "Fisherman" },
  {
    value: "Handicraft Worker",
    label: "Handicraft Worker",
  },
  {
    value: "Home-based Business",
    label: "Home-based Business",
  },
  { value: "Driver", label: "Driver" },
  {
    value: "Rickshaw / Van Driver",
    label: "Rickshaw / Van Driver",
  },
  { value: "Teacher", label: "Teacher" },
  {
    value: "Service Holder",
    label: "Service Holder",
  },
  {
    value: "Garment Worker",
    label: "Garment Worker",
  },
  {
    value: "Domestic Worker",
    label: "Domestic Worker",
  },
  { value: "Student", label: "Student" },
  { value: "Unemployed", label: "Unemployed" },
  { value: "Other", label: "Other" },
];

const relationshipOptions = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Husband", label: "Husband" },
  { value: "Wife", label: "Wife" },
  { value: "Brother", label: "Brother" },
  { value: "Sister", label: "Sister" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Relative", label: "Relative" },
  { value: "Neighbor", label: "Neighbor" },
  { value: "Other", label: "Other" },
];

export function MemberForm({
  form,
  mode = "create",
  onSubmit,
  loading = false,
  hasFatherAddress,
  setHasFatherAddress,
  hasGuarantor,
  setHasGuarantor,
  imageUrl,
  onCancel,
  initialValues,
  onImageChange,
}) {
  const [imagePreview, setImagePreview] = useState(
    resolveUploadUrl(imageUrl) || "",
  );

  const isEdit = mode === "edit";

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      requiredMark
      onFinish={onSubmit}
      className="member-form"
      scrollToFirstError
    >
      {/* Profile + Member Information */}

      <Row gutter={[20, 20]} className="member-form-row">
        <Col xs={24} lg={6}>
          <Card
            title="Profile Image"
            className="member-form-card profile-image-card"
          >
            <div className="profile-image-uploader">
              <Avatar
                className="profile-image-preview"
                size={96}
                src={imagePreview || resolveUploadUrl(imageUrl) || undefined}
              >
                M
              </Avatar>

              <div>
                <Typography.Text strong>Member profile photo</Typography.Text>

                <Typography.Paragraph type="secondary">
                  Use a clear JPG, PNG, or WebP image. Maximum size 5 MB.
                </Typography.Paragraph>

                <Upload
                  accept="image/png,image/jpeg,image/webp"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
                    const isValidSize = file.size / 1024 / 1024 <= 5;

                    if (!supportedTypes.includes(file.type)) {
                      message.error("Use a JPG, PNG, or WebP image");
                      return Upload.LIST_IGNORE;
                    }

                    if (!isValidSize) {
                      message.error("Image must be 5 MB or smaller");

                      return Upload.LIST_IGNORE;
                    }

                    const reader = new FileReader();

                    reader.onload = () => setImagePreview(reader.result);

                    reader.readAsDataURL(file);
                    onImageChange?.(file);

                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    {isEdit ? "Change Image" : "Choose Image"}
                  </Button>
                </Upload>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Member Information" className="member-form-card">
            <Row gutter={[20, 0]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Full Name"
                  name="fullName"
                  rules={[
                    {
                      required: true,
                      message: "Enter member's full name",
                    },
                  ]}
                >
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Father Name"
                  name="fatherName"
                  rules={[
                    {
                      required: true,
                      message: "Enter father's name",
                    },
                  ]}
                >
                  <Input placeholder="Enter father's name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Mother Name"
                  name="motherName"
                  rules={[
                    {
                      required: true,
                      message: "Enter mother's name",
                    },
                  ]}
                >
                  <Input placeholder="Enter mother's name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Guardian Name" name="guardianName">
                  <Input placeholder="Enter guardian's name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
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
                      message: "Enter a valid Bangladeshi mobile number",
                    },
                  ]}
                >
                  <Input maxLength={11} placeholder="01711223344" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="NID Number"
                  name="nidNumber"
                  rules={[
                    {
                      required: true,
                      message: "NID number is required",
                    },
                    {
                      pattern: /^(\d{10}|\d{13}|\d{17})$/,
                      message: "NID must be 10, 13 or 17 digits",
                    },
                  ]}
                >
                  <Input placeholder="Enter NID number" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
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
                  <Input placeholder="member@example.com" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
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

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Join Date"
                  name="joinDate"
                  rules={[
                    {
                      required: true,
                      message: "Select join date",
                    },
                  ]}
                >
                  <DatePicker
                    style={{
                      width: "100%",
                    }}
                    format="DD MMM YYYY"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Notes" name="notes">
                  <TextArea
                    rows={3}
                    placeholder="Additional information about the member..."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Present Address */}

      <Card title="Member Present Address" className="member-form-card">
        <AddressFields name="presentAddress" />
      </Card>

      {/* Father Address */}

      <Card
        title="Member Father Address"
        className="member-form-card"
        extra={
          <Checkbox
            checked={hasFatherAddress}
            onChange={(event) => {
              const checked = event.target.checked;

              setHasFatherAddress(checked);

              if (!checked) {
                form.resetFields(["fatherAddress"]);
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
          <Typography.Text type="secondary">
            Father address is optional. Enable "Add Father Address" if you want
            to store it for this member.
          </Typography.Text>
        )}
      </Card>

      {/* Guarantor */}

      <Card
        title="Guarantor"
        className="member-form-card"
        extra={
          <Checkbox
            checked={hasGuarantor}
            onChange={(event) => {
              const checked = event.target.checked;

              setHasGuarantor(checked);

              if (!checked) {
                form.resetFields(["guarantor"]);
              }
            }}
          >
            Add Guarantor
          </Checkbox>
        }
      >
        {!hasGuarantor ? (
          <Typography.Text type="secondary">
            Guarantor information is optional. Enable "Add Guarantor" if this
            member has a guarantor.
          </Typography.Text>
        ) : (
          <>
            <Typography.Title level={5}>Guarantor Information</Typography.Title>

            <Row gutter={[20, 0]}>
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
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Father Name"
                  name={["guarantor", "fatherName"]}
                >
                  <Input placeholder="Enter father's name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Mother Name"
                  name={["guarantor", "motherName"]}
                >
                  <Input placeholder="Enter mother's name" />
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
                      message: "Enter a valid Bangladeshi mobile number",
                    },
                  ]}
                >
                  <Input maxLength={11} placeholder="01711223344" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="NID Number"
                  name={["guarantor", "nidNumber"]}
                  rules={[
                    {
                      required: true,
                      message: "Enter guarantor's NID number",
                    },
                    {
                      pattern: /^(\d{10}|\d{13}|\d{17})$/,
                      message: "NID must be 10, 13 or 17 digits",
                    },
                  ]}
                >
                  <Input placeholder="Enter NID number" />
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
                <Form.Item label="Notes" name={["guarantor", "notes"]}>
                  <TextArea
                    rows={3}
                    placeholder="Additional guarantor information..."
                  />
                </Form.Item>
              </Col>
            </Row>

            <div
              style={{
                marginTop: 8,
                marginBottom: 20,
                borderTop: "1px solid var(--ant-color-border-secondary)",
              }}
            />

            <Typography.Title level={5}>Guarantor Address</Typography.Title>

            <AddressFields name={["guarantor", "address"]} />
          </>
        )}
      </Card>

      {/* Actions */}

      <div className="member-form-actions">
        <Button onClick={onCancel}>Cancel</Button>

        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={loading}
          disabled={loading}
        >
          {isEdit ? "Update Member" : "Save Member"}
        </Button>
      </div>
    </Form>
  );
}
