import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  EditOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Result,
  Row,
  Skeleton,
  Space,
  Tag,
  Tabs,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { AddressDetails } from "../components/AddressDetails.jsx";
import { DetailItem } from "../components/DetailItem.jsx";
import { GuarantorDetails } from "../components/GuarantorDetails.jsx";
import { useGetMemberByIdQuery } from "../membersApi.js";

const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatStatus = (status) => {
  if (!status) {
    return "—";
  }

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const MemberStatusTag = ({ status }) => {
  if (!status) {
    return "—";
  }

  return (
    <Tag className={`member-status-tag ${status.toLowerCase()}`}>
      <CheckCircleFilled /> {formatStatus(status)}
    </Tag>
  );
};

export function MemberProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMemberByIdQuery(id, {
    skip: !id,
  });

  const member = response?.data;

  console.log(member);

  const presentAddress = member?.addresses?.find(
    (address) => address.type === "PRESENT",
  );

  const fatherAddress = member?.addresses?.find(
    (address) => address.type === "FATHER_HOME",
  );

  const guarantor = member?.guarantors?.[0];

  if (isLoading) {
    return (
      <PageContainer>
        <Card>
          <Skeleton
            active
            avatar={{
              size: 92,
            }}
            paragraph={{
              rows: 8,
            }}
          />
        </Card>
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
            error?.data?.message ||
            "Something went wrong while loading the member."
          }
          extra={[
            <Button key="retry" type="primary" onClick={refetch}>
              Try Again
            </Button>,

            <Button key="back" onClick={() => navigate("/members")}>
              Back to Members
            </Button>,
          ]}
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
          subTitle="The member you are looking for does not exist."
          extra={
            <Button type="primary" onClick={() => navigate("/members")}>
              Back to Members
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const tabItems = [
    {
      key: "overview",
      label: "Overview",

      children: (
        <Row gutter={[16, 16]}>
          {/* Basic Information */}
          <Col xs={24} lg={14}>
            <Card title="Basic Information" className="member-profile-card">
              <div className="member-profile-info-list">
                <DetailItem label="Member ID" value={member.memberId} />

                <DetailItem label="Mobile Number" value={member.mobileNumber} />

                <DetailItem label="NID" value={member.nidNumber} />

                <DetailItem label="Email" value={member.email} />

                <DetailItem label="Occupation" value={member.occupation} />

                <DetailItem label="Father Name" value={member.fatherName} />

                <DetailItem label="Mother Name" value={member.motherName} />

                <DetailItem label="Guardian Name" value={member.guardianName} />

                <DetailItem
                  label="Join Date"
                  value={formatDate(member.joinDate)}
                />

                <DetailItem
                  label="Status"
                  value={<MemberStatusTag status={member.status} />}
                />
              </div>
            </Card>
          </Col>

          {/* Present Address */}
          <Col xs={24} lg={10}>
            <Card title="Present Address" className="member-profile-card">
              <AddressDetails address={presentAddress} />
            </Card>
          </Col>

          {/* Father Address */}
          {fatherAddress && (
            <Col xs={24} lg={12}>
              <Card title="Father Address" className="member-profile-card">
                <AddressDetails address={fatherAddress} />
              </Card>
            </Col>
          )}

          {/* Guarantor */}
          {guarantor && (
            <Col xs={24} lg={12}>
              <Card
                title="Guarantor Information"
                className="member-profile-card"
              >
                <GuarantorDetails guarantor={guarantor} />
              </Card>
            </Col>
          )}

          {/* Notes */}
          {member.notes && (
            <Col xs={24}>
              <Card title="Notes" className="member-profile-card">
                <Typography.Paragraph
                  style={{
                    marginBottom: 0,
                  }}
                >
                  {member.notes}
                </Typography.Paragraph>
              </Card>
            </Col>
          )}
        </Row>
      ),
    },

    {
      key: "loans",
      label: "Loans",

      children: (
        <Card className="member-profile-card">
          <Empty description="No loan information available yet">
            <Button
              type="primary"
              onClick={() => navigate(`/loans/new?member=${member.id}`)}
            >
              Create New Loan
            </Button>
          </Empty>
        </Card>
      ),
    },

    {
      key: "installments",
      label: "Installments",

      children: (
        <Card className="member-profile-card">
          <Empty description="No installment information available yet" />
        </Card>
      ),
    },

    {
      key: "savings",
      label: "Savings",

      children: (
        <Card className="member-profile-card">
          <Empty description="No savings information available yet" />
        </Card>
      ),
    },

    {
      key: "transactions",
      label: "Transactions",

      children: (
        <Card className="member-profile-card">
          <Empty description="No transaction information available yet" />
        </Card>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="member-profile-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/members")}
        >
          Back to Members
        </Button>

        <Space wrap>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/members/${member.id}/edit`)}
          >
            Edit Member
          </Button>

          <Button
            type="primary"
            onClick={() => navigate(`/loans/new?member=${member.id}`)}
          >
            Create New Loan
          </Button>
        </Space>
      </div>

      {/* Refetch indicator */}
      {isFetching && (
        <Alert
          type="info"
          showIcon
          message="Refreshing member information..."
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {/* Member Hero */}
      <Card className="member-profile-hero">
        <div className="member-profile-identity">
          <Avatar
            size={92}
            className="member-profile-avatar"
            src={member.photoUrl || undefined}
          >
            {getInitials(member.fullName)}
          </Avatar>

          <div>
            <Typography.Title
              level={2}
              style={{
                marginBottom: 4,
              }}
            >
              {member.fullName}
            </Typography.Title>

            <Typography.Text type="secondary">
              Member ID: {member.memberId || "—"}
            </Typography.Text>

            <div className="member-profile-status">
              <MemberStatusTag status={member.status} />
            </div>
          </div>
        </div>

        <div className="member-profile-contact">
          <Typography.Text type="secondary">Mobile Number</Typography.Text>

          <Typography.Text strong>
            <PhoneOutlined /> {member.mobileNumber || "—"}
          </Typography.Text>
        </div>
      </Card>

      {/* Member Summary */}
      <Row gutter={[16, 16]} className="member-profile-summary">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Typography.Text type="secondary">Member Status</Typography.Text>

            <div
              style={{
                marginTop: 10,
              }}
            >
              <MemberStatusTag status={member.status} />
            </div>

            <Typography.Text
              type="secondary"
              style={{
                display: "block",
                marginTop: 8,
              }}
            >
              Current account status
            </Typography.Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Typography.Text type="secondary">Joined</Typography.Text>

            <Typography.Title
              level={4}
              style={{
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              {formatDate(member.joinDate)}
            </Typography.Title>

            <Typography.Text type="secondary">Member since</Typography.Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Typography.Text type="secondary">Guarantor</Typography.Text>

            <Typography.Title
              level={4}
              style={{
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              {guarantor ? guarantor.fullName : "Not Added"}
            </Typography.Title>

            <Typography.Text type="secondary">
              {guarantor?.relationship || "No guarantor information"}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <div className="member-profile-tabs">
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </div>
    </PageContainer>
  );
}
