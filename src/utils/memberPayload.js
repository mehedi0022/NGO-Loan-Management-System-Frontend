import divisions from "../assets/address/divisions.json";
import districts from "../assets/address/districts.json";
import upazilas from "../assets/address/upazilas.json";
import unions from "../assets/address/unions.json";

const findNameById = (items, id) => {
  if (!id) return undefined;

  return items.find((item) => String(item.id) === String(id))?.name;
};

const cleanOptionalString = (value) => {
  if (typeof value !== "string") {
    return value || undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
};

const transformAddress = (address, type) => {
  if (!address) return null;

  return {
    type,

    houseOrHolding: cleanOptionalString(address.houseOrHolding),

    road: cleanOptionalString(address.road),

    village: address.village?.trim(),

    postOffice: address.postOffice?.trim(),

    union: findNameById(unions, address.unionId),

    upazila: findNameById(upazilas, address.upazilaId),

    district: findNameById(districts, address.districtId),

    division: findNameById(divisions, address.divisionId),
  };
};

const transformGuarantor = (guarantor) => {
  if (!guarantor) return null;

  const address = guarantor.address;

  return {
    fullName: guarantor.fullName?.trim(),

    fatherName: cleanOptionalString(guarantor.fatherName),

    motherName: cleanOptionalString(guarantor.motherName),

    mobileNumber: guarantor.mobileNumber?.trim(),

    nidNumber: cleanOptionalString(guarantor.nidNumber),

    relationship: guarantor.relationship?.trim(),

    occupation: cleanOptionalString(guarantor.occupation),

    notes: cleanOptionalString(guarantor.notes),

    houseOrHolding: cleanOptionalString(address?.houseOrHolding),

    road: cleanOptionalString(address?.road),

    village: address?.village?.trim(),

    postOffice: address?.postOffice?.trim(),

    union: findNameById(unions, address?.unionId),

    upazila: findNameById(upazilas, address?.upazilaId),

    district: findNameById(districts, address?.districtId),

    division: findNameById(divisions, address?.divisionId),
  };
};

export const buildCreateMemberPayload = (
  values,
  { hasFatherAddress = false, hasGuarantor = false, photoUrl } = {},
) => {
  const addresses = [transformAddress(values.presentAddress, "PRESENT")];

  if (hasFatherAddress && values.fatherAddress) {
    addresses.push(transformAddress(values.fatherAddress, "FATHER_HOME"));
  }

  const payload = {
    fullName: values.fullName.trim(),
    fatherName: values.fatherName.trim(),
    motherName: values.motherName.trim(),

    guardianName: cleanOptionalString(values.guardianName),

    mobileNumber: values.mobileNumber.trim(),

    nidNumber: cleanOptionalString(values.nidNumber),

    email: cleanOptionalString(values.email),

    occupation: cleanOptionalString(values.occupation),

    notes: cleanOptionalString(values.notes),

    joinDate: values.joinDate?.toISOString(),

    photoUrl: cleanOptionalString(photoUrl),

    addresses,
  };

  if (hasGuarantor && values.guarantor) {
    payload.guarantors = [transformGuarantor(values.guarantor)];
  }

  return payload;
};
