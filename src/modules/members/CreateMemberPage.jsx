import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Typography,
  Upload,
} from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

function AddressFields({ prefix }) {
  return (
    <Row gutter={[20, 0]}>
      <Col xs={24} md={8}>
        <Form.Item label="Village" name={`${prefix}Village`}>
          <Input placeholder="Enter village name" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Post office" name={`${prefix}PostOffice`}>
          <Input placeholder="Enter post office" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Union" name={`${prefix}Union`}>
          <Input placeholder="Enter union" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Thana" name={`${prefix}Thana`}>
          <Input placeholder="Enter thana" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="District" name={`${prefix}District`}>
          <Input placeholder="Enter district" />
        </Form.Item>
      </Col>
    </Row>
  );
}

export function CreateMemberPage({ isEdit = false }) {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [imagePreview, setImagePreview] = useState("");

  const handleSubmit = () => {
    navigate(isEdit ? `/members/${memberId}` : "/members");
  };

  const initialValues = isEdit
    ? {
        name: "Rahima Begum",
        fatherName: "Abdul Majid",
        motherName: "Ayesha Begum",
        guardianName: "Abdul Majid",
        mobileNumber: "01711-223344",
        nidNumber: "1987654321",
        fatherHomeVillage: "Rahim Para",
        fatherHomePostOffice: "Palli Bikash",
        fatherHomeUnion: "Palli Bikash Union",
        fatherHomeThana: "Sadar",
        fatherHomeDistrict: "Dhaka",
        granterVillage: "Rahim Para",
        granterPostOffice: "Palli Bikash",
        granterUnion: "Palli Bikash Union",
        granterThana: "Sadar",
        granterDistrict: "Dhaka",
      }
    : undefined;

  return (
    <PageContainer>
      <div className="create-member-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(isEdit ? `/members/${memberId}` : "/members")}
        >
          {isEdit ? "Back to profile" : "Back to members"}
        </Button>
        <Typography.Title level={2}>
          {isEdit ? "Edit Member" : "Add Member"}
        </Typography.Title>
        <Typography.Text>
          {isEdit
            ? "Update this member's information and address details."
            : "Register a new member in your organisation."}
        </Typography.Text>
      </div>

      <Form
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        initialValues={initialValues}
        className="member-form"
      >
        <Row gutter={[20, 0]} className="member-form-row">
          <Col xs={24} md={8}>
            <Card
              title="Profile image"
              className="member-form-card profile-image-card"
            >
              <div className="profile-image-uploader">
                <Avatar
                  className="profile-image-preview"
                  size={96}
                  src={imagePreview || undefined}
                >
                  M
                </Avatar>
                <div>
                  <Typography.Text strong>Member profile photo</Typography.Text>
                  <Typography.Paragraph type="secondary">
                    Use a clear JPG or PNG image. Maximum size 2 MB.
                  </Typography.Paragraph>
                  <Upload
                    accept="image/png,image/jpeg"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = () => setImagePreview(reader.result);
                      reader.readAsDataURL(file);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>
                      {isEdit ? "Change image" : "Choose image"}
                    </Button>
                  </Upload>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <Card title="Member details" className="member-form-card">
              <Row gutter={[20, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                      { required: true, message: "Enter the member's name" },
                    ]}
                  >
                    <Input placeholder="Enter member name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Father name"
                    name="fatherName"
                    rules={[{ required: true, message: "Enter father's name" }]}
                  >
                    <Input placeholder="Enter father's name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Mother name" name="motherName">
                    <Input placeholder="Enter mother's name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Guardian name" name="guardianName">
                    <Input placeholder="Enter guardian's name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Mobile number"
                    name="mobileNumber"
                    rules={[{ required: true, message: "Enter mobile number" }]}
                  >
                    <Input placeholder="e.g. 01711-223344" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="NID number" name="nidNumber">
                    <Input placeholder="Enter NID number" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={[20, 0]} className="member-form-row">
          <Col xs={24} md={12}>
            <Card title="Father Home Address" className="member-form-card">
              <AddressFields prefix="fatherHome" />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Granter Address" className="member-form-card">
              <AddressFields prefix="granter" />
            </Card>
          </Col>
        </Row>

        <div className="member-form-actions">
          <Button
            onClick={() =>
              navigate(isEdit ? `/members/${memberId}` : "/members")
            }
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            {isEdit ? "Update member" : "Save member"}
          </Button>
        </div>
      </Form>
    </PageContainer>
  );
}
