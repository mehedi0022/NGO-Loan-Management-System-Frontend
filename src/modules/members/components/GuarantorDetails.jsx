import { Divider, Typography } from "antd";
import { DetailItem } from "./DetailItem.jsx";

export function GuarantorDetails({ guarantor }) {
  if (!guarantor) {
    return (
      <Typography.Text type="secondary">
        No guarantor information available
      </Typography.Text>
    );
  }

  return (
    <>
      {/* Personal Information */}
      <div className="member-profile-info-list">
        <DetailItem label="Full Name" value={guarantor.fullName} />
        <DetailItem label="Relationship" value={guarantor.relationship} />
        <DetailItem label="Mobile Number" value={guarantor.mobileNumber} />
        <DetailItem label="NID" value={guarantor.nidNumber} />
        <DetailItem label="Father Name" value={guarantor.fatherName} />
        <DetailItem label="Mother Name" value={guarantor.motherName} />
        <DetailItem label="Occupation" value={guarantor.occupation} />
      </div>
      <Divider orientation="left">Address</Divider>

      {/* Address */}
      <div className="member-profile-info-list">
        <DetailItem label="House / Holding" value={guarantor.houseOrHolding} />
        <DetailItem label="Road" value={guarantor.road} />
        <DetailItem label="Village" value={guarantor.village} />
        <DetailItem label="Post Office" value={guarantor.postOffice} />
        <DetailItem label="Union" value={guarantor.union} />
        <DetailItem label="Upazila" value={guarantor.upazila} />
        <DetailItem label="District" value={guarantor.district} />
        <DetailItem label="Division" value={guarantor.division} />
      </div>

      {guarantor.notes && (
        <>
          <Divider orientation="left">Notes</Divider>
          <Typography.Paragraph>{guarantor.notes}</Typography.Paragraph>
        </>
      )}
    </>
  );
}
