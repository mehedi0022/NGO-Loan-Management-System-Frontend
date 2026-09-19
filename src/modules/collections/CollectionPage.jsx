import {
  ArrowLeftOutlined,
  CheckOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const collectionRows = [
  {
    key: "M-0104",
    initials: "AK",
    member: "Abdul Karim",
    phone: "01812-556677",
    loan: "L-3034",
    installment: "#3 of 10",
    due: 3180,
    dps: 500,
    outstanding: "৳12,720",
    days: 47,
    status: "Overdue",
  },
  {
    key: "M-0135",
    initials: "SK",
    member: "Salma Khatun",
    phone: "01511-667788",
    loan: "L-3061",
    installment: "#2 of 10",
    due: 2110,
    dps: 300,
    outstanding: "৳18,990",
    days: 12,
    status: "Overdue",
  },
  {
    key: "M-0122",
    initials: "JU",
    member: "Jasim Uddin",
    phone: "01611-334455",
    loan: "L-3052",
    installment: "#4 of 8",
    due: 1590,
    dps: 500,
    outstanding: "৳7,950",
    days: 0,
    status: "Due Today",
  },
];

export function CollectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [paymentType, setPaymentType] = useState("Full Payment");
  const [confirmation, setConfirmation] = useState(null);
  const [form] = Form.useForm();
  const queryMember = searchParams.get("member");
  const [individualMember, setIndividualMember] = useState(
    queryMember || "M-0135",
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return collectionRows.filter((row) => {
      const matchesMember = !queryMember || row.key === queryMember;
      const matchesSearch =
        !query ||
        [row.member, row.key, row.phone, row.loan].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      return matchesMember && matchesSearch && matchesStatus;
    });
  }, [queryMember, search, statusFilter]);

  const selectedRows = collectionRows.filter((row) =>
    selectedRowKeys.includes(row.key),
  );
  const selectedLoanTotal = selectedRows.reduce(
    (total, row) => total + row.due,
    0,
  );
  const selectedDpsTotal = selectedRows.reduce(
    (total, row) => total + row.dps,
    0,
  );
  const selectedTotal = selectedLoanTotal + selectedDpsTotal;
  const individualRow = filteredRows[0];

  useEffect(() => {
    if (individualRow)
      form.setFieldsValue({
        amount: individualRow.due,
        dps: individualRow.dps,
      });
  }, [form, individualRow]);

  const openCollection = (rows) => {
    if (rows.length) setConfirmation({ rows });
  };

  const completeCollection = () => {
    setConfirmation(null);
    setSelectedRowKeys([]);
    form.resetFields();
  };

  const columns = [
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (value, row) => (
        <div className="loan-member-cell">
          <span className="member-avatar">{row.initials}</span>
          <span>
            <b>{value}</b>
            <small>{row.key}</small>
          </span>
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Loan", dataIndex: "loan", key: "loan" },
    { title: "Installment", dataIndex: "installment", key: "installment" },
    {
      title: "Loan due",
      dataIndex: "due",
      key: "due",
      align: "right",
      render: (value) => `৳${value.toLocaleString("en-IN")}`,
    },
    {
      title: "DPS / savings",
      dataIndex: "dps",
      key: "dps",
      align: "right",
      render: (value) => `৳${value.toLocaleString("en-IN")}`,
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag
          className={`loan-status-tag ${value === "Overdue" ? "overdue" : "pending"}`}
        >
          {value}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => (
        <Button
          size="small"
          type="primary"
          onClick={() => openCollection([row])}
        >
          Collect
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-1">
        <div>
          <Button
            type="text"
            className="w-fit px-0!"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/loans/overdue")}
          >
            Back to Due &amp; Overdue
          </Button>
          <Typography.Title className="mb-0! text-2xl!" level={2}>
            Collections
          </Typography.Title>
          <Typography.Text>
            Collect installments from all due loans or a single member.
          </Typography.Text>
        </div>
      </div>

      <Card className="mb-4 border-[#deded7] shadow-none">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography.Text strong>Collection mode</Typography.Text>
            <Typography.Text type="secondary" className="block text-xs">
              Choose one or collect multiple due loans together.
            </Typography.Text>
          </div>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="all">All due loans</Radio.Button>
            <Radio.Button value="individual">
              Individual collection
            </Radio.Button>
          </Radio.Group>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:max-w-md"
            placeholder="Search member, ID, phone or loan"
          />
          <Select
            className="md:w-40"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All due" },
              { value: "Due Today", label: "Due today" },
              { value: "Overdue", label: "Overdue" },
            ]}
          />
          {queryMember && (
            <Button onClick={() => navigate("/collections")}>
              Show all loans
            </Button>
          )}
        </div>
      </Card>

      {mode === "all" ? (
        <Card
          className="overflow-hidden border-[#deded7] shadow-none"
          title={
            <div className="collection-table-title">
              <span>Due collections</span>
              <Typography.Text
                type="secondary"
                className="ml-2 text-xs font-normal"
              >
                {filteredRows.length} loans ready for collection
              </Typography.Text>
            </div>
          }
          extra={
            selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <Button type="link" onClick={() => setSelectedRowKeys([])}>
                  Clear
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => openCollection(selectedRows)}
                >
                  Collect selected · ৳{selectedTotal.toLocaleString("en-IN")}
                </Button>
              </div>
            )
          }
        >
          <Table
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            columns={columns}
            dataSource={filteredRows}
            pagination={false}
            scroll={{ x: 1050 }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-[#deded7] shadow-none">
            <Typography.Text strong className="mb-2 block">
              Choose member
            </Typography.Text>
            <Select
              className="w-full"
              value={individualMember}
              onChange={setIndividualMember}
              options={collectionRows.map((row) => ({
                value: row.key,
                label: `${row.member} · ${row.loan} · ৳${row.due.toLocaleString("en-IN")}`,
              }))}
            />
          </Card>
          <IndividualCollection
            row={
              collectionRows.find((row) => row.key === individualMember) ||
              individualRow
            }
            paymentType={paymentType}
            setPaymentType={setPaymentType}
            form={form}
            onCollect={openCollection}
          />
        </div>
      )}

      <Modal
        open={Boolean(confirmation)}
        title="Confirm collection"
        okText="Confirm payment"
        onOk={completeCollection}
        onCancel={() => setConfirmation(null)}
      >
        {confirmation && (
          <Typography.Paragraph>
            Record <strong>{paymentType.toLowerCase()}</strong> for{" "}
            <strong>
              {confirmation.rows.length} loan
              {confirmation.rows.length > 1 ? "s" : ""}
            </strong>{" "}
            with a total amount of{" "}
            <strong>
              ৳
              {confirmation.rows
                .reduce((total, row) => total + row.due + row.dps, 0)
                .toLocaleString("en-IN")}
            </strong>
            ?
          </Typography.Paragraph>
        )}
      </Modal>
    </PageContainer>
  );
}

function IndividualCollection({
  row,
  paymentType,
  setPaymentType,
  form,
  onCollect,
}) {
  if (!row)
    return (
      <Card className="border-[#deded7] shadow-none">
        No due loan found for this filter.
      </Card>
    );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_.85fr]">
      <Card className="border-[#deded7] shadow-none">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dbeee7] text-xs font-bold text-[#176b57]">
            {row.initials}
          </div>
          <div className="flex flex-col gap-1">
            <b>{row.member}</b>
            <small className="text-gray-500">
              {row.key} · Loan {row.loan}
            </small>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Current installment</span>
            <b>{row.installment}</b>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Outstanding</span>
            <b>{row.outstanding}</b>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Status</span>
            <Tag
              className={`w-fit ${row.status === "Overdue" ? "loan-status-tag overdue" : "loan-status-tag pending"}`}
            >
              {row.status}
            </Tag>
          </div>
          <div className="col-span-2 mt-1 grid grid-cols-2 gap-4 sm:col-span-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Loan due today</span>
              <strong className="text-2xl text-[#176b57]">
                ৳{row.due.toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">DPS / savings</span>
              <strong className="text-2xl text-[#176b57]">
                ৳{row.dps.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      </Card>
      <Card className="border-[#deded7] shadow-none" title="Payment">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ amount: row.due, dps: row.dps }}
        >
          <Form.Item label="Payment type">
            <div className="flex flex-wrap gap-2">
              {["Full Payment", "Partial", "Advance"].map((type) => (
                <Button
                  key={type}
                  type={paymentType === type ? "primary" : "default"}
                  icon={paymentType === type ? <CheckOutlined /> : undefined}
                  onClick={() => setPaymentType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </Form.Item>
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item label="Loan installment" name="amount">
              <InputNumber className="w-full" min={0} prefix="৳" />
            </Form.Item>
            <Form.Item label="DPS / savings deposit" name="dps">
              <InputNumber className="w-full" min={0} prefix="৳" />
            </Form.Item>
          </div>
          <Button
            block
            type="primary"
            size="large"
            onClick={() => onCollect([row])}
          >
            Confirm payment
          </Button>
        </Form>
      </Card>
    </div>
  );
}
