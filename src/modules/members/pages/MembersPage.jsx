import {
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Dropdown,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { useGetAllMembersQuery } from "../membersApi.js";
import { useDebounce } from "../../../hooks/useDebounce.js";

const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const statusOptions = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
];

export function MembersPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [status, setStatus] = useState("all");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllMembersQuery({
    page: pagination.current,
    limit: pagination.pageSize,

    search: debouncedSearch.trim() || undefined,

    status: status === "all" ? undefined : status,

    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });

  const members = response?.data ?? [];
  const meta = response?.meta;

  const handleStatusChange = (value) => {
    setStatus(value);

    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleTableChange = (tablePagination, _filters, sorter) => {
    setPagination({
      current: tablePagination.current,
      pageSize: tablePagination.pageSize,
    });

    if (sorter?.field && sorter?.order) {
      setSorting({
        sortBy: sorter.field,
        sortOrder: sorter.order === "ascend" ? "asc" : "desc",
      });

      return;
    }

    setSorting({
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const columns = [
    {
      title: "Member",
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      sortOrder:
        sorting.sortBy === "fullName"
          ? sorting.sortOrder === "asc"
            ? "ascend"
            : "descend"
          : null,

      render: (fullName, member) => (
        <div className="member-table-identity">
          <span className="member-avatar">{getInitials(fullName)}</span>

          <span>
            <strong>{fullName}</strong>

            <small>{member.memberId ?? "Pending ID"}</small>
          </span>
        </div>
      ),
    },

    {
      title: "Phone",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },

    {
      title: "NID",
      dataIndex: "nidNumber",
      key: "nidNumber",

      render: (value) => value || "—",
    },

    {
      title: "Occupation",
      dataIndex: "occupation",
      key: "occupation",

      render: (value) => value || "—",
    },

    {
      title: "Join Date",
      dataIndex: "joinDate",
      key: "joinDate",
      sorter: true,

      sortOrder:
        sorting.sortBy === "joinDate"
          ? sorting.sortOrder === "asc"
            ? "ascend"
            : "descend"
          : null,

      render: (value) => {
        if (!value) {
          return "—";
        }

        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(value));
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",

      render: (value) => (
        <Tag className={`member-status-tag ${value?.toLowerCase()}`}>
          {value}
        </Tag>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      width: 52,

      render: (_, member) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "View member",
                icon: <EyeOutlined />,

                onClick: () => navigate(`/members/${member.id}`),
              },

              {
                key: "edit",
                label: "Edit member",
                icon: <EditOutlined />,

                onClick: () => navigate(`/members/${member.id}/edit`),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            aria-label="Member actions"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="members-page-heading">
        <div>
          <Typography.Title level={2}>Members</Typography.Title>

          <Typography.Text type="secondary">
            {meta?.total ?? 0} members registered
          </Typography.Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/members/new")}
        >
          Add Member
        </Button>
      </div>

      <div className="members-toolbar">
        <Input
          allowClear
          value={search}
          prefix={<SearchOutlined />}
          placeholder="Search by name, ID, phone or NID"
          onChange={(event) => {
            setSearch(event.target.value);

            setPagination((prev) => ({
              ...prev,
              current: 1,
            }));
          }}
        />

        <Select
          value={status}
          onChange={handleStatusChange}
          options={statusOptions}
        />
      </div>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load members"
          description={
            error?.data?.message ||
            "Something went wrong while loading members."
          }
          action={
            <Button size="small" onClick={refetch}>
              Retry
            </Button>
          }
          style={{
            marginBottom: 16,
          }}
        />
      )}

      <div className="members-table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={members}
          loading={isLoading || isFetching}
          scroll={{
            x: 900,
          }}
          pagination={{
            current: meta?.page ?? pagination.current,

            pageSize: meta?.limit ?? pagination.pageSize,

            total: meta?.total ?? 0,

            showSizeChanger: true,

            pageSizeOptions: [10, 20, 50, 100],

            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} members`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </PageContainer>
  );
}
