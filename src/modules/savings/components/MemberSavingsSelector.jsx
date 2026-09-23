import { Select } from "antd";
import { useState } from "react";

import { useGetAllMembersQuery } from "../../members/membersApi.js";

export function MemberSavingsSelector({ value, onChange, disabled = false }) {
  const [search, setSearch] = useState("");
  const { data, isFetching } = useGetAllMembersQuery({
    page: 1,
    limit: 20,
    search: search || undefined,
    status: "ACTIVE",
    sortBy: "fullName",
    sortOrder: "asc",
  });

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
      placeholder="Search by name, member ID, phone or NID"
      notFoundContent={isFetching ? "Searching..." : "No member found"}
      options={(data?.data ?? []).map((member) => ({
        value: member.id,
        label: `${member.fullName} · ${member.memberId || `#${member.id}`} · ${member.mobileNumber}`,
      }))}
    />
  );
}
