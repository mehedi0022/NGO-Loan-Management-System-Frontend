import { Col, Form, Input, Row, Select } from "antd";

import divisions from "../../../assets/address/divisions.json";
import districts from "../../../assets/address/districts.json";
import upazilas from "../../../assets/address/upazilas.json";
import unions from "../../../assets/address/unions.json";

const normalizeNamePath = (name) => (Array.isArray(name) ? name : [name]);

export function AddressFields({ name }) {
  const form = Form.useFormInstance();

  const basePath = normalizeNamePath(name);

  const divisionId = Form.useWatch([...basePath, "divisionId"], form);

  const districtId = Form.useWatch([...basePath, "districtId"], form);

  const upazilaId = Form.useWatch([...basePath, "upazilaId"], form);

  const filteredDistricts = divisionId
    ? districts.filter(
        (item) => String(item.division_id) === String(divisionId),
      )
    : [];

  const filteredUpazilas = districtId
    ? upazilas.filter((item) => String(item.district_id) === String(districtId))
    : [];

  const filteredUnions = upazilaId
    ? unions.filter((item) => String(item.upazila_id) === String(upazilaId))
    : [];

  const clearFields = (fields) => {
    const currentValue = form.getFieldValue(basePath) || {};

    const nextValue = {
      ...currentValue,
    };

    fields.forEach((field) => {
      nextValue[field] = undefined;
    });

    form.setFieldValue(basePath, nextValue);
  };

  const handleDivisionChange = () => {
    clearFields(["districtId", "upazilaId", "unionId"]);
  };

  const handleDistrictChange = () => {
    clearFields(["upazilaId", "unionId"]);
  };

  const handleUpazilaChange = () => {
    clearFields(["unionId"]);
  };

  return (
    <Row gutter={[20, 0]}>
      <Col xs={24} md={12} lg={6}>
        <Form.Item
          label="Division"
          name={[...basePath, "divisionId"]}
          rules={[
            {
              required: true,
              message: "Select division",
            },
          ]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Select division"
            optionFilterProp="label"
            onChange={handleDivisionChange}
            options={divisions.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.bn_name})`,
            }))}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item
          label="District"
          name={[...basePath, "districtId"]}
          rules={[
            {
              required: true,
              message: "Select district",
            },
          ]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Select district"
            optionFilterProp="label"
            disabled={!divisionId}
            onChange={handleDistrictChange}
            options={filteredDistricts.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.bn_name})`,
            }))}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item
          label="Upazila"
          name={[...basePath, "upazilaId"]}
          rules={[
            {
              required: true,
              message: "Select upazila",
            },
          ]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Select upazila"
            optionFilterProp="label"
            disabled={!districtId}
            onChange={handleUpazilaChange}
            options={filteredUpazilas.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.bn_name})`,
            }))}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item label="Union" name={[...basePath, "unionId"]}>
          <Select
            showSearch
            allowClear
            placeholder="Select union"
            optionFilterProp="label"
            disabled={!upazilaId}
            options={filteredUnions.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.bn_name})`,
            }))}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item
          label="Village"
          name={[...basePath, "village"]}
          rules={[
            {
              required: true,
              message: "Enter village",
            },
          ]}
        >
          <Input placeholder="Enter village" />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item
          label="Post Office"
          name={[...basePath, "postOffice"]}
          rules={[
            {
              required: true,
              message: "Enter post office",
            },
          ]}
        >
          <Input placeholder="Enter post office" />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item
          label="House / Holding"
          name={[...basePath, "houseOrHolding"]}
        >
          <Input placeholder="House / holding no." />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Form.Item label="Road" name={[...basePath, "road"]}>
          <Input placeholder="Road name / number" />
        </Form.Item>
      </Col>
    </Row>
  );
}
