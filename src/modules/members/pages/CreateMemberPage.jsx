import { ArrowLeftOutlined, ImportOutlined } from "@ant-design/icons";

import { Alert, Button, Form, Typography, message } from "antd";

import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { buildCreateMemberPayload } from "../../../utils/memberPayload.js";

import { MemberForm } from "../components/MemberForm.jsx";
import {
  useCreateMemberMutation,
  useUploadMemberPhotoMutation,
} from "../membersApi.js";
import { useGetActiveBusinessDayQuery } from "../../dayClosing/dayClosingApi.js";

export function CreateMemberPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { data: activeDayData } = useGetActiveBusinessDayQuery();
  const activeBusinessDate = activeDayData?.data?.businessDate;

  const [hasFatherAddress, setHasFatherAddress] = useState(false);

  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  const [createMember, { isLoading: isCreating }] = useCreateMemberMutation();
  const [uploadMemberPhoto, { isLoading: isUploadingPhoto }] =
    useUploadMemberPhotoMutation();

  const handleSubmit = async (values) => {
    try {
      const payload = buildCreateMemberPayload(values, {
        hasFatherAddress,
        hasGuarantor,
      });

      const created = await createMember(payload).unwrap();

      if (photoFile) {
        try {
          await uploadMemberPhoto({
            id: created.data.id,
            file: photoFile,
          }).unwrap();
        } catch (uploadError) {
          message.warning(
            uploadError?.data?.message ||
              "Member created, but profile photo could not be uploaded",
          );
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

      <Alert
        className="mb-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20"
        type="info"
        showIcon
        message="Onboarding an existing / legacy member?"
        description={
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
            <span>
              If this member already has existing savings balances, ongoing
              loans, or active DPS, use the Migration tool to preserve their
              historical ledger without affecting today's cash drawer.
            </span>
            <Button
              type="primary"
              size="small"
              icon={<ImportOutlined />}
              onClick={() => navigate("/members/migration")}
              className="bg-blue-600 hover:bg-blue-700 font-medium"
            >
              Go to Member Migration
            </Button>
          </div>
        }
      />

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
          joinDate: activeBusinessDate ? dayjs(activeBusinessDate) : dayjs(),
        }}
      />
    </PageContainer>
  );
}
