import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useSelector } from "react-redux";

import { DataTable } from "../../../components/data-table/DataTable.jsx";
import { EmptyState } from "../../../components/empty-state/EmptyState.jsx";
import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { PageHeader } from "../../../components/page-header/PageHeader.jsx";
import { SearchInput } from "../../../components/search-input/SearchInput.jsx";
import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { formatDate } from "../../loans/loanFormatters.js";
import { useGetUsersQuery } from "../usersApi.js";
import {
  useCreateUserMutation,
  useChangeUserRoleMutation,
  useChangeUserStatusMutation,
  useResetUserPasswordMutation,
  useUpdateUserMutation,
} from "../usersApi.js";
import { UserFormDrawer } from "../components/UserFormDrawer.jsx";
import { ChangeRoleModal } from "../components/ChangeRoleModal.jsx";
import { ResetPasswordModal } from "../components/ResetPasswordModal.jsx";
import { RoleTag } from "../components/RoleTag.jsx";
import { UserDetailsDrawer } from "../components/UserDetailsDrawer.jsx";
import { UserStatusAction } from "../components/UserStatusAction.jsx";
import { can, permissions } from "../../auth/permissions.js";

const roleOptions = [
  { value: "ALL", label: "All roles" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
];
const assignableRoleOptions = roleOptions.filter((option) => option.value !== "ALL");
const managerRoleOptions = roleOptions.filter(
  (option) => option.value === "MANAGER",
);

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export function UsersPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorting, setSorting] = useState({
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [changeUserRole, { isLoading: changingRole }] =
    useChangeUserRoleMutation();
  const [changeUserStatus, { isLoading: changingStatus }] =
    useChangeUserStatusMutation();
  const [resetUserPassword, { isLoading: resettingPassword }] =
    useResetUserPasswordMutation();
  const debouncedSearch = useDebounce(search, 400);

  const { data: response, isLoading, isFetching, isError, error, refetch } =
    useGetUsersQuery({
      page: pagination.current,
      limit: pagination.pageSize,
      search: debouncedSearch.trim() || undefined,
      role: role === "ALL" ? undefined : role,
      status: status === "ALL" ? undefined : status,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
    });

  const users = response?.data ?? [];
  const meta = response?.meta;
  const resetPage = () =>
    setPagination((current) => ({ ...current, current: 1 }));
  const resetFilters = () => {
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    resetPage();
  };
  const hasFilters = Boolean(search || role !== "ALL" || status !== "ALL");
  const tableSortOrder = (field) =>
    sorting.sortBy === field
      ? sorting.sortOrder === "asc"
        ? "ascend"
        : "descend"
      : null;
  const canCreateUser = can(currentUser, permissions.usersCreate);
  const canUpdateUser = can(currentUser, permissions.usersUpdateAny);
  const canChangeRoles = can(currentUser, permissions.usersChangeRole);
  const canChangeStatus = can(currentUser, permissions.usersChangeStatus);
  const canResetPassword = can(currentUser, permissions.usersResetPassword);
  const createRoleOptions = canChangeRoles
    ? assignableRoleOptions
    : managerRoleOptions;
  const canEditTarget = (target) =>
    canUpdateUser && (canChangeRoles || target.role === "MANAGER");
  const canManageTarget = (target) =>
    canChangeRoles || target.role === "MANAGER";
  const closeForm = () => {
    setFormOpen(false);
    setEditingUser(null);
  };
  const submitForm = async (values) => {
    try {
      if (editingUser) {
        await updateUser({ id: editingUser.id, body: values }).unwrap();
        message.success("User updated successfully");
      } else {
        await createUser(values).unwrap();
        message.success("User created successfully");
      }
      closeForm();
    } catch (requestError) {
      message.error(
        requestError?.data?.message ||
          `Unable to ${editingUser ? "update" : "create"} user`,
      );
    }
  };
  const submitRoleChange = async (newRole) => {
    try {
      await changeUserRole({ id: roleTarget.id, role: newRole }).unwrap();
      message.success("User role updated successfully");
      setRoleTarget(null);
    } catch (requestError) {
      message.error(requestError?.data?.message || "Unable to change user role");
    }
  };
  const submitStatusChange = async () => {
    try {
      await changeUserStatus({
        id: statusTarget.id,
        isActive: !statusTarget.isActive,
      }).unwrap();
      message.success(
        `User ${statusTarget.isActive ? "deactivated" : "activated"} successfully`,
      );
      setStatusTarget(null);
    } catch (requestError) {
      message.error(requestError?.data?.message || "Unable to change user status");
    }
  };
  const submitPasswordReset = async (newPassword) => {
    try {
      await resetUserPassword({ id: passwordTarget.id, newPassword }).unwrap();
      message.success("Password reset and existing sessions revoked");
      setPasswordTarget(null);
    } catch (requestError) {
      message.error(requestError?.data?.message || "Unable to reset password");
    }
  };
  const userActions = (target) => {
    const isSelf = target.id === currentUser?.id;
    const manageable = canManageTarget(target);

    return [
      { key: "view", label: "View Details", icon: <EyeOutlined /> },
      canEditTarget(target) && {
        key: "edit",
        label: "Edit Profile",
        icon: <EditOutlined />,
      },
      canChangeRoles && !isSelf && {
        key: "role",
        label: "Change Role",
        icon: <SafetyCertificateOutlined />,
      },
      canResetPassword && manageable && !isSelf && {
        key: "password",
        label: "Reset Password",
        icon: <KeyOutlined />,
      },
      canChangeStatus && manageable && !isSelf && {
        key: "status",
        label: target.isActive ? "Deactivate" : "Activate",
        icon: <StopOutlined />,
        danger: target.isActive,
      },
    ].filter(Boolean);
  };
  const handleUserAction = (key, target) => {
    if (key === "view") setDetailsUser(target);
    if (key === "edit") {
      setEditingUser(target);
      setFormOpen(true);
    }
    if (key === "role") setRoleTarget(target);
    if (key === "password") setPasswordTarget(target);
    if (key === "status") setStatusTarget(target);
  };

  const columns = [
    {
      title: "User",
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      sortOrder: tableSortOrder("fullName"),
      render: (fullName, user) => (
        <Space size={12}>
          <Avatar className="user-list-avatar" icon={<UserOutlined />}>
            {initials(fullName || user.userName || user.email)}
          </Avatar>
          <div className="user-list-identity">
            <Typography.Text strong className="block">
              {fullName || user.userName || "Unnamed user"}
            </Typography.Text>
            <Typography.Text type="secondary" className="block text-xs">
              @{user.userName || `user-${user.id}`}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
      sortOrder: tableSortOrder("email"),
      responsive: ["sm"],
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: true,
      sortOrder: tableSortOrder("role"),
      render: (value) => <RoleTag role={value} />,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (isActive) => (
        <StatusTag
          status={isActive ? "ACTIVE" : "INACTIVE"}
          label={isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      sortOrder: tableSortOrder("createdAt"),
      responsive: ["lg"],
      render: formatDate,
    },
    {
      title: "Actions",
      key: "actions",
      width: 70,
      fixed: "right",
      render: (_, user) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: userActions(user),
            onClick: ({ key }) => handleUserAction(key, user),
          }}
        >
          <Button
            className="user-action-button"
            icon={<MoreOutlined />}
            aria-label="User actions"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description={`${meta?.total ?? 0} staff accounts · Manage access, roles and account status.`}
        actions={
          canCreateUser ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null);
                setFormOpen(true);
              }}
            >
              Add User
            </Button>
          ) : null
        }
      />

      <Card className="users-filter-card">
        <div className="users-filter-layout">
          <div className="users-search-field">
            <Typography.Text strong>Search users</Typography.Text>
            <SearchInput
              value={search}
              placeholder="Search name, username or email"
              onChange={(value) => {
                setSearch(value);
                resetPage();
              }}
            />
          </div>
          <div className="users-filter-field">
            <Typography.Text strong>Role</Typography.Text>
            <Select
              value={role}
              options={roleOptions}
              aria-label="Filter users by role"
              onChange={(value) => {
                setRole(value);
                resetPage();
              }}
            />
          </div>
          <div className="users-filter-field">
            <Typography.Text strong>Status</Typography.Text>
            <Select
              value={status}
              options={statusOptions}
              aria-label="Filter users by status"
              onChange={(value) => {
                setStatus(value);
                resetPage();
              }}
            />
          </div>
          <Button
            className="users-reset-button"
            icon={<ReloadOutlined />}
            disabled={!hasFilters}
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>
      </Card>

      {isError && (
        <Card className="mb-4">
          <Space direction="vertical">
            <Typography.Text type="danger">
              {error?.data?.message || "Unable to load users."}
            </Typography.Text>
            <Button icon={<ReloadOutlined />} onClick={refetch}>
              Retry
            </Button>
          </Space>
        </Card>
      )}

      <Card
        className="users-table-card"
        title={
          <Space>
            <span className="users-table-icon"><TeamOutlined /></span>
            <span>Staff accounts</span>
          </Space>
        }
        extra={
          <Typography.Text type="secondary">
            {meta?.total ?? 0} total
          </Typography.Text>
        }
        styles={{ body: { padding: 0 } }}
      >
        <DataTable
          rowKey="id"
          columns={columns}
          data={users}
          loading={isLoading || isFetching}
          scroll={{ x: 760 }}
          emptyState={<EmptyState description="No users match these filters." />}
          pagination={{
            current: meta?.page ?? pagination.current,
            pageSize: meta?.limit ?? pagination.pageSize,
            total: meta?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          onPaginationChange={(next) =>
            setPagination({
              current: next.current,
              pageSize: next.pageSize,
            })
          }
          onSortChange={(sorter) =>
            setSorting(
              sorter?.field && sorter?.order
                ? {
                    sortBy: sorter.field,
                    sortOrder: sorter.order === "ascend" ? "asc" : "desc",
                  }
                : { sortBy: "createdAt", sortOrder: "desc" },
            )
          }
        />
      </Card>

      <UserFormDrawer
        open={formOpen}
        user={editingUser}
        roleOptions={createRoleOptions}
        loading={creating || updating}
        onClose={closeForm}
        onSubmit={submitForm}
      />
      <UserDetailsDrawer
        open={Boolean(detailsUser)}
        user={detailsUser}
        onClose={() => setDetailsUser(null)}
      />
      <ChangeRoleModal
        open={Boolean(roleTarget)}
        user={roleTarget}
        loading={changingRole}
        onCancel={() => setRoleTarget(null)}
        onSubmit={submitRoleChange}
      />
      <ResetPasswordModal
        open={Boolean(passwordTarget)}
        user={passwordTarget}
        loading={resettingPassword}
        onCancel={() => setPasswordTarget(null)}
        onSubmit={submitPasswordReset}
      />
      <UserStatusAction
        user={statusTarget}
        loading={changingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={submitStatusChange}
      />
    </PageContainer>
  );
}
