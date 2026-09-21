import { ArrowLeftOutlined } from "@ant-design/icons";

import { Button, Form, Result, Skeleton, Typography, message } from "antd";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";

import { MemberForm } from "../components/MemberForm.jsx";

import {
  useGetMemberByIdQuery,
  useUpdateMemberMutation,
} from "../membersApi.js";

import { buildMemberFormValues } from "../../../utils/memberForm.js";

import { buildUpdateMemberPayload } from "../../../utils/memberPayload.js";

export function EditMemberPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form] = Form.useForm();

  const [hasFatherAddress, setHasFatherAddress] = useState(false);

  const [hasGuarantor, setHasGuarantor] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMemberByIdQuery(id);

  const [updateMember, { isLoading: isUpdating }] = useUpdateMemberMutation();

  const member = response?.data;

  useEffect(() => {
    if (!member) {
      return;
    }

    const values = buildMemberFormValues(member);

    form.setFieldsValue(values);

    const fatherAddress = member.addresses?.some(
      (address) => address.type === "FATHER_HOME",
    );

    setHasFatherAddress(Boolean(fatherAddress));

    setHasGuarantor(Boolean(member.guarantors?.length));
  }, [member, form]);

  const handleSubmit = async (values) => {
    try {
      const payload = buildUpdateMemberPayload(values, {
        hasFatherAddress,
        hasGuarantor,
        photoUrl: member?.photoUrl,
      });

      await updateMember({
        id: Number(id),
        payload,
      }).unwrap();

      message.success("Member updated successfully");

      navigate(`/members/${id}`);
    } catch (error) {
      message.error(error?.data?.message || "Failed to update member");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton active />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <Result
          status="error"
          title="Failed to load member"
          subTitle={
            error?.data?.message || "Unable to load member information."
          }
          extra={
            <Button type="primary" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!member) {
    return (
      <PageContainer>
        <Result
          status="404"
          title="Member not found"
          extra={
            <Button onClick={() => navigate("/members")}>
              Back to Members
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="create-member-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/members/${id}`)}
        >
          Back to Profile
        </Button>

        <Typography.Title level={2}>Edit Member</Typography.Title>

        <Typography.Text>
          Update member information, addresses and guarantor details.
        </Typography.Text>
      </div>

      <MemberForm
        form={form}
        mode="edit"
        imageUrl={member.photoUrl}
        hasFatherAddress={hasFatherAddress}
        setHasFatherAddress={setHasFatherAddress}
        hasGuarantor={hasGuarantor}
        setHasGuarantor={setHasGuarantor}
        onSubmit={handleSubmit}
        loading={isUpdating}
        onCancel={() => navigate(`/members/${id}`)}
      />
    </PageContainer>
  );
}
