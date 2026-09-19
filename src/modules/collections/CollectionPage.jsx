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
import { useMemo, useState } from "react";
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
  const selectedTotal = selectedRows.reduce((total, row) => total + row.due, 0);
  const individualRow = filteredRows[0];

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
      title: "Due amount",
      dataIndex: "due",
      key: "due",
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
      <div className="collection-heading collection-page-heading">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/loans/overdue")}
          >
            Back to Due &amp; Overdue
          </Button>
          <Typography.Title level={2}>Collections</Typography.Title>
          <Typography.Text>
            Collect installments from all due loans or a single member.
          </Typography.Text>
        </div>
      </div>

      <Card className="collection-filter-card">
        <div className="collection-mode-row">
          <Typography.Text strong>Collection mode</Typography.Text>
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
        <div className="collection-filter-row">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, ID, phone or loan"
          />
          <Select
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
          className="collection-table-card"
          title={
            <div className="collection-table-title">
              <span>Due collections</span>
              <Typography.Text type="secondary">
                {filteredRows.length} loans ready for collection
              </Typography.Text>
            </div>
          }
          extra={
            selectedRows.length > 0 && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => openCollection(selectedRows)}
              >
                Collect selected ({selectedRows.length}) · ৳
                {selectedTotal.toLocaleString("en-IN")}
              </Button>
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
        <IndividualCollection
          rows={filteredRows}
          row={individualRow}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          form={form}
          onCollect={openCollection}
        />
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
                .reduce((total, row) => total + row.due, 0)
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
      <Card className="collection-empty-card">
        No due loan found for this filter.
      </Card>
    );

  return (
    <div className="individual-collection-layout">
      <Card className="collection-member-card">
        <div className="collection-member-heading">
          <div className="loan-member-cell">
            <span className="member-avatar">{row.initials}</span>
            <span>
              <b>{row.member}</b>
              <small>
                {row.key} · Loan {row.loan}
              </small>
            </span>
          </div>
        </div>
        <div className="collection-facts">
          <div>
            <span>Current installment</span>
            <b>{row.installment}</b>
          </div>
          <div>
            <span>Outstanding</span>
            <b>{row.outstanding}</b>
          </div>
          <div>
            <span>Status</span>
            <Tag
              className={`loan-status-tag ${row.status === "Overdue" ? "overdue" : "pending"}`}
            >
              {row.status}
            </Tag>
          </div>
          <div className="collection-due">
            <span>Amount due today</span>
            <strong>৳{row.due.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </Card>
      <Card className="collection-payment-card" title="Payment">
        <Form form={form} layout="vertical" initialValues={{ amount: row.due }}>
          <Form.Item label="Payment type">
            <div className="payment-type-buttons">
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
          <Form.Item label="Amount" name="amount">
            <InputNumber
              className="full-width-control collection-amount-input"
              min={1}
              prefix="৳"
            />
          </Form.Item>
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
