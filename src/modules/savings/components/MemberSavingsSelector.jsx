import { Avatar, Select } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useState } from "react";

import { useGetAllMembersQuery } from "../../members/membersApi.js";

export function MemberSavingsSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Search by member name, ID, phone, or NID...",
  style,
  size,
}) {
  const [search, setSearch] = useState("");
  const { data, isFetching } = useGetAllMembersQuery({
    page: 1,
    limit: 25,
    search: search || undefined,
    status: "ACTIVE",
    sortBy: "fullName",
    sortOrder: "asc",
  });

  const members = data?.data ?? [];

  return (
    <Select
      showSearch
      allowClear
      value={value}
      disabled={disabled}
      loading={isFetching}
      filterOption={false}
      onSearch={setSearch}
      onChange={onChange}
      placeholder={placeholder}
      notFoundContent={isFetching ? "Searching..." : "No member found"}
      style={style}
      size={size}
      options={members.map((member) => ({
        value: member.id,
        label: `${member.fullName} (${member.memberId || `#${member.id}`}) · ${member.mobileNumber}`,
        member,
      }))}
      optionRender={(option) => {
        const m = option.data.member;
        if (!m) return option.label;
        return (
          <div className="flex items-center gap-2.5 py-0.5">
            <Avatar
              size="small"
              src={m.photoUrl}
              icon={!m.photoUrl && <UserOutlined />}
              className="bg-emerald-100 text-emerald-700 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                {m.fullName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {m.memberId || `#${m.id}`} · {m.mobileNumber}
                {m.somiti?.name ? ` · ${m.somiti.name}` : ""}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
