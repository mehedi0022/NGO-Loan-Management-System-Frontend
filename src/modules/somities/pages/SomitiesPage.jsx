import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ApartmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { can, permissions } from "../../auth/permissions.js";
import { useGetUsersQuery } from "../../users/usersApi.js";
import {
  useCreateSomitiMutation,
  useDeleteSomitiMutation,
  useGetSomitiesQuery,
  useUpdateSomitiMutation,
} from "../somitiesApi.js";
import { SomitiFormDrawer } from "../components/SomitiFormDrawer.jsx";
import { SomitiMembersModal } from "../components/SomitiMembersModal.jsx";

const dayLabels = {
  SATURDAY: { label: "Saturday", color: "blue" },
  SUNDAY: { label: "Sunday", color: "cyan" },
  MONDAY: { label: "Monday", color: "green" },
  TUESDAY: { label: "Tuesday", color: "gold" },
  WEDNESDAY: { label: "Wednesday", color: "purple" },
  THURSDAY: { label: "Thursday", color: "magenta" },
  FRIDAY: { label: "Friday", color: "volcano" },
};

const dayFilterOptions = [
  { value: "ALL", label: "All Days" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

const statusFilterOptions = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function SomitiesPage() {
  const currentUser = useSelector((state) => state.auth.user);

  const [search, setSearch] = useState("");
  const [meetingDay, setMeetingDay] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [fieldOfficerId, setFieldOfficerId] = useState("ALL");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorting, setSorting] = useState({ sortBy: "createdAt", sortOrder: "desc" });

  const [formOpen, setFormOpen] = useState(false);
  const [editingSomiti, setEditingSomiti] = useState(null);
  const [membersModalSomiti, setMembersModalSomiti] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSomitiesQuery({
    page: pagination.current,
    limit: pagination.pageSize,
    search: debouncedSearch.trim() || undefined,
    status: status === "ALL" ? undefined : status,
    meetingDay: meetingDay === "ALL" ? undefined : meetingDay,
    fieldOfficerId: fieldOfficerId === "ALL" ? undefined : Number(fieldOfficerId),
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });

  const { data: usersData } = useGetUsersQuery({
    limit: 100,
    status: "ACTIVE",
  });

  const officerOptions = useMemo(() => {
    const list = [
      { value: "ALL", label: "All Field Officers" },
      ...(usersData?.data ?? [])
        .filter((u) => u.role === "FIELD_OFFICER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN" || u.role === "MANAGER")
        .map((u) => ({
          value: String(u.id),
          label: `${u.fullName} (${u.role.replace("_", " ")})`,
        })),
    ];
    return list;
  }, [usersData]);

  const [createSomiti, { isLoading: isCreating }] = useCreateSomitiMutation();
  const [updateSomiti, { isLoading: isUpdating }] = useUpdateSomitiMutation();
  const [deleteSomiti, { isLoading: isDeleting }] = useDeleteSomitiMutation();

  const somities = response?.data ?? [];
  const meta = response?.meta;

  const totalMembersCount = useMemo(() => {
    return somities.reduce((acc, s) => acc + (s.memberCount || 0), 0);
  }, [somities]);

  const activeSomitiesCount = useMemo(() => {
    return somities.filter((s) => s.status === "ACTIVE").length;
  }, [somities]);

  const canCreate = can(currentUser, permissions.somitiesCreate);
  const canUpdate = can(currentUser, permissions.somitiesUpdateAny);
  const canDelete = can(currentUser, permissions.somitiesDeleteAny);

  const handleFormSubmit = async (payload) => {
    try {
      if (editingSomiti) {
        await updateSomiti({ id: editingSomiti.id, payload }).unwrap();
        message.success("Somiti updated successfully");
      } else {
        await createSomiti(payload).unwrap();
        message.success("Somiti created successfully");
      }
      setFormOpen(false);
      setEditingSomiti(null);
    } catch (err) {
      message.error(err?.data?.message || "Failed to save somiti");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSomiti(id).unwrap();
      message.success("Somiti deleted successfully");
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete somiti");
    }
  };

  const columns = [
    {
      title: "Somiti Details",
      key: "name",
      sorter: true,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Typography.Text strong style={{ fontSize: 15 }}>
              {record.name}
            </Typography.Text>
            <Tag color="geekblue">{record.somitiId || record.code || "No Code"}</Tag>
          </Space>
          {record.area && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              📍 {record.area} {record.address ? `• ${record.address}` : ""}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "Meeting Day & Time",
      key: "meetingDay",
      render: (_, record) => {
        const dayInfo = dayLabels[record.meetingDay] || {
          label: record.meetingDay,
          color: "default",
        };
        return (
          <Space direction="vertical" size={2}>
            <Tag color={dayInfo.color} icon={<CalendarOutlined />}>
              {dayInfo.label}
            </Tag>
            {record.meetingTime && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {record.meetingTime}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Field Officer",
      key: "fieldOfficer",
      render: (_, record) => {
        if (!record.fieldOfficer) {
          return <Tag color="warning">Unassigned</Tag>;
        }
        return (
          <Space size={8}>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#52c41a" }} />
            <div>
              <Typography.Text strong style={{ display: "block", fontSize: 13 }}>
                {record.fieldOfficer.fullName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {record.fieldOfficer.userName}
              </Typography.Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Members",
      key: "members",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Click to view enrolled members">
          <Button
            type="text"
            icon={<TeamOutlined />}
            onClick={() => setMembersModalSomiti(record)}
            style={{ fontWeight: 600, color: "#1890ff" }}
          >
            {record.memberCount || 0} Members
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <Tag color={status === "ACTIVE" ? "success" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Members">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setMembersModalSomiti(record)}
            />
          </Tooltip>
          {canUpdate && (
            <Tooltip title="Edit Somiti">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingSomiti(record);
                  setFormOpen(true);
                }}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Delete Somiti"
              description={
                record.memberCount > 0
                  ? "Cannot delete somiti with registered members. Move or remove members first."
                  : "Are you sure you want to delete this somiti?"
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              disabled={record.memberCount > 0}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.memberCount > 0}
                loading={isDeleting}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Somiti Management
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage borrower groups, meeting days, and assign responsible Field Officers.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSomiti(null);
                setFormOpen(true);
              }}
            >
              Create Somiti
            </Button>
          )}
        </Space>
      </div>

      {/* Summary KPI Cards */}
      <Row gutter={[8, 8]} style={{ marginBottom: 20 }}>
        <Col xs={8} sm={8}>
          <Card bordered={false} styles={{ body: { padding: "10px 8px" } }} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <Statistic
              title={<span className="text-[10px] sm:text-xs">Total Somities</span>}
              value={meta?.total ?? somities.length}
              prefix={<ApartmentOutlined className="text-blue-500" style={{ marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card bordered={false} styles={{ body: { padding: "10px 8px" } }} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <Statistic
              title={<span className="text-[10px] sm:text-xs">Active Somities</span>}
              value={activeSomitiesCount}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card bordered={false} styles={{ body: { padding: "10px 8px" } }} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <Statistic
              title={<span className="text-[10px] sm:text-xs">Enrolled Members</span>}
              value={totalMembersCount}
              prefix={<TeamOutlined style={{ color: "#722ed1", marginRight: 4 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Toolbar */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search by somiti name, code, or area"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              style={{ width: "100%" }}
              value={meetingDay}
              options={dayFilterOptions}
              onChange={(val) => {
                setMeetingDay(val);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              style={{ width: "100%" }}
              value={status}
              options={statusFilterOptions}
              onChange={(val) => {
                setStatus(val);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              style={{ width: "100%" }}
              value={fieldOfficerId}
              options={officerOptions}
              onChange={(val) => {
                setFieldOfficerId(val);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
        </Row>
      </Card>

      {/* Error alert if any */}
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load somities"
          description={error?.data?.message || "An error occurred."}
          action={<Button size="small" onClick={refetch}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Main Table */}
      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={somities}
          loading={isLoading || isFetching}
          scroll={{ x: 750 }}
          pagination={{
            current: meta?.page ?? pagination.current,
            pageSize: meta?.limit ?? pagination.pageSize,
            total: meta?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} somities`,
          }}
          onChange={(tablePagination, _filters, sorter) => {
            setPagination({
              current: tablePagination.current,
              pageSize: tablePagination.pageSize,
            });
            if (sorter?.field) {
              setSorting({
                sortBy: sorter.field,
                sortOrder: sorter.order === "ascend" ? "asc" : "desc",
              });
            }
          }}
        />
      </Card>

      {/* Drawer for Create / Edit */}
      <SomitiFormDrawer
        open={formOpen}
        somiti={editingSomiti}
        loading={isCreating || isUpdating}
        onClose={() => {
          setFormOpen(false);
          setEditingSomiti(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Modal for viewing enrolled members */}
      <SomitiMembersModal
        open={Boolean(membersModalSomiti)}
        somiti={membersModalSomiti}
        onClose={() => setMembersModalSomiti(null)}
      />
    </PageContainer>
  );
}
