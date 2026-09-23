import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Alert, Avatar, Button, Input, Select, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { useGetAllMembersQuery } from "../membersApi.js";
import { resolveUploadUrl } from "../../../utils/uploadUrl.js";

const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function MembersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorting, setSorting] = useState({ sortBy: "createdAt", sortOrder: "desc" });
  const debouncedSearch = useDebounce(search, 500);
  const { data: response, isLoading, isFetching, isError, error, refetch } = useGetAllMembersQuery({
    page: pagination.current,
    limit: pagination.pageSize,
    search: debouncedSearch.trim() || undefined,
    status: status === "all" ? undefined : status,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });
  const members = response?.data ?? [];
  const meta = response?.meta;
  const resetToFirstPage = () => setPagination((current) => ({ ...current, current: 1 }));

  const columns = [
    {
      title: "Member", dataIndex: "fullName", key: "fullName", sorter: true,
      sortOrder: sorting.sortBy === "fullName" ? (sorting.sortOrder === "asc" ? "ascend" : "descend") : null,
      render: (fullName, member) => <div className="member-table-identity"><Avatar className="member-avatar" src={resolveUploadUrl(member.photoUrl) || undefined}>{getInitials(fullName)}</Avatar><span><strong>{fullName}</strong><small>{member.memberId ?? "Pending ID"}</small></span></div>,
    },
    { title: "Phone", dataIndex: "mobileNumber", key: "mobileNumber" },
    { title: "NID", dataIndex: "nidNumber", key: "nidNumber", responsive: ["md"], render: (value) => value || "—" },
    { title: "Status", dataIndex: "status", key: "status", render: (value) => <Tag className={`member-status-tag ${value?.toLowerCase()}`}>{value}</Tag> },
    {
      title: "Actions", key: "actions", width: 150,
      render: (_, member) => <Space size={4}><Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/members/${member.id}`)}>View</Button><Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/members/${member.id}/edit`)}>Edit</Button></Space>,
    },
  ];

  return <PageContainer><div className="members-page-heading"><div><Typography.Title level={2}>Members</Typography.Title><Typography.Text type="secondary">{meta?.total ?? 0} members registered</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/members/new")}>Add Member</Button></div><div className="members-toolbar"><Input allowClear value={search} prefix={<SearchOutlined />} placeholder="Search name, ID, phone or NID" onChange={(event) => { setSearch(event.target.value); resetToFirstPage(); }} /><Select value={status} aria-label="Filter members by status" options={statusOptions} onChange={(value) => { setStatus(value); resetToFirstPage(); }} /></div>{isError && <Alert type="error" showIcon message="Failed to load members" description={error?.data?.message || "Something went wrong while loading members."} action={<Button size="small" onClick={refetch}>Retry</Button>} style={{ marginBottom: 16 }} />}<div className="members-table-card"><Table rowKey="id" columns={columns} dataSource={members} loading={isLoading || isFetching} scroll={{ x: 680 }} pagination={{ current: meta?.page ?? pagination.current, pageSize: meta?.limit ?? pagination.pageSize, total: meta?.total ?? 0, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members` }} onChange={(tablePagination, _filters, sorter) => { setPagination({ current: tablePagination.current, pageSize: tablePagination.pageSize }); setSorting(sorter?.field && sorter?.order ? { sortBy: sorter.field, sortOrder: sorter.order === "ascend" ? "asc" : "desc" } : { sortBy: "createdAt", sortOrder: "desc" }); }} /></div></PageContainer>;
}
