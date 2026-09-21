import { Typography } from "antd";
import { DetailItem } from "./DetailItem.jsx";

export function AddressDetails({ address }) {
  if (!address) {
    return (
      <Typography.Text type="secondary">
        No address information available
      </Typography.Text>
    );
  }

  return (
    <div className="member-profile-info-list">
      <DetailItem label="House / Holding" value={address.houseOrHolding} />
      <DetailItem label="Road" value={address.road} />
      <DetailItem label="Village" value={address.village} />
      <DetailItem label="Post Office" value={address.postOffice} />
      <DetailItem label="Union" value={address.union} />
      <DetailItem label="Upazila" value={address.upazila} />
      <DetailItem label="District" value={address.district} />
      <DetailItem label="Division" value={address.division} />
    </div>
  );
}
