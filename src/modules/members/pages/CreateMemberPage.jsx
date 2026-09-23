import { ArrowLeftOutlined } from "@ant-design/icons";

import { Button, Form, Typography, message } from "antd";

import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { buildCreateMemberPayload } from "../../../utils/memberPayload.js";

import { MemberForm } from "../components/MemberForm.jsx";
import { useCreateMemberMutation, useUploadMemberPhotoMutation } from "../membersApi.js";

export function CreateMemberPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [hasFatherAddress, setHasFatherAddress] = useState(false);

  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  const [createMember, { isLoading: isCreating }] = useCreateMemberMutation();
  const [uploadMemberPhoto, { isLoading: isUploadingPhoto }] = useUploadMemberPhotoMutation();

  const handleSubmit = async (values) => {
    try {
      const payload = buildCreateMemberPayload(values, {
        hasFatherAddress,
        hasGuarantor,
      });

      const created = await createMember(payload).unwrap();

      if (photoFile) {
        try {
          await uploadMemberPhoto({ id: created.data.id, file: photoFile }).unwrap();
        } catch (uploadError) {
          message.warning(uploadError?.data?.message || "Member created, but profile photo could not be uploaded");
          navigate(`/members/${created.data.id}`);
          return;
        }
      }

      message.success("Member created successfully");

      navigate("/members");
    } catch (error) {
      message.error(error?.data?.message || "Failed to create member");
    }
  };

  return (
    <PageContainer>
      <div className="create-member-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/members")}
        >
          Back to Members
        </Button>

        <Typography.Title level={2}>Add Member</Typography.Title>

        <Typography.Text>
          Register a new member with address and guarantor information.
        </Typography.Text>
      </div>

      <MemberForm
        form={form}
        mode="create"
        hasFatherAddress={hasFatherAddress}
        setHasFatherAddress={setHasFatherAddress}
        hasGuarantor={hasGuarantor}
        setHasGuarantor={setHasGuarantor}
        onSubmit={handleSubmit}
        loading={isCreating || isUploadingPhoto}
        onImageChange={setPhotoFile}
        onCancel={() => navigate("/members")}
        initialValues={{
    joinDate: dayjs(),
  }}
      />
    </PageContainer>
  );
}
