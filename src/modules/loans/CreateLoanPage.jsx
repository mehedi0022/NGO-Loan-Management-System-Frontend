import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { useGetAllMembersQuery, useGetMemberByIdQuery } from "../members/membersApi.js";
import { useCreateLoanMutation } from "./loansApi.js";

export function CreateLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [formError, setFormError] = useState("");
  const memberIdFromQuery = Number(searchParams.get("memberId") ?? searchParams.get("member"));
  const validMemberId = Number.isSafeInteger(memberIdFromQuery) && memberIdFromQuery > 0;

  const { data: membersResponse, isLoading: membersLoading } = useGetAllMembersQuery({
    page: 1,
    limit: 100,
    status: "ACTIVE",
    sortBy: "fullName",
    sortOrder: "asc",
  });
  const { data: selectedMemberResponse } = useGetMemberByIdQuery(memberIdFromQuery, {
    skip: !validMemberId,
  });
  const [createLoan, { isLoading: isCreating }] = useCreateLoanMutation();

  const memberOptions = useMemo(() => {
    const members = [...(membersResponse?.data ?? [])];
    const selectedMember = selectedMemberResponse?.data;

    if (selectedMember && !members.some((member) => member.id === selectedMember.id)) {
      members.push(selectedMember);
    }

    return members.map((member) => ({
      value: member.id,
      label: `${member.fullName} (${member.memberId || "Pending ID"})`,
    }));
  }, [membersResponse?.data, selectedMemberResponse?.data]);

  const handleSubmit = async (values) => {
    setFormError("");

    try {
      const response = await createLoan(values).unwrap();
      message.success("Loan created successfully");
      navigate(`/loans/${response.data.id}`);
    } catch (error) {
      setFormError(error?.data?.message || "Unable to create the loan. Please review the form and try again.");
    }
  };

  return (
    <PageContainer>
      <div className="loan-page-heading">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/loans")}>
          Back to Loans
        </Button>
        <Typography.Title level={2}>Create Loan</Typography.Title>
        <Typography.Text>Create a loan application for an existing member.</Typography.Text>
      </div>

      {formError && <Alert type="error" showIcon message="Failed to create loan" description={formError} style={{ marginBottom: 16 }} />}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          memberId: validMemberId ? memberIdFromQuery : undefined,
          chargeType: "PERCENTAGE",
          frequency: "MONTHLY",
          installmentCount: 12,
        }}
        onFinish={handleSubmit}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Loan Application" className="member-profile-card">
              <Row gutter={[16, 0]}>
                <Col xs={24}>
                  <Form.Item label="Member" name="memberId" rules={[{ required: true, message: "Select a member" }]}>
                    <Select showSearch optionFilterProp="label" loading={membersLoading} options={memberOptions} placeholder="Select member" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Principal Amount" name="principalAmount" rules={[{ required: true, message: "Enter the principal amount" }]}>
                    <InputNumber className="full-width-control" min={0.01} precision={2} prefix="৳" placeholder="50000" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Installment Count" name="installmentCount" rules={[{ required: true, message: "Enter the installment count" }]}>
                    <InputNumber className="full-width-control" min={1} precision={0} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Charge Type" name="chargeType" rules={[{ required: true }]}>
                    <Select options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FLAT", label: "Flat amount" }]} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Charge Value" name="chargeValue" rules={[{ required: true, message: "Enter the charge value" }]}>
                    <InputNumber className="full-width-control" min={0} precision={2} placeholder="10" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Repayment Frequency" name="frequency" rules={[{ required: true }]}>
                    <Select options={[{ value: "MONTHLY", label: "Monthly" }, { value: "WEEKLY", label: "Weekly" }]} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Purpose" name="purpose"><Input placeholder="Small business" /></Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Notes" name="notes"><Input.TextArea rows={4} placeholder="Optional notes" /></Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Before you submit" className="loan-summary-card">
              <Typography.Paragraph type="secondary">
                The service charge, total payable, and installment amount are calculated by the backend when the loan is created.
              </Typography.Paragraph>
              <Button block type="primary" htmlType="submit" loading={isCreating}>
                Create Loan
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </PageContainer>
  );
}
