import dayjs from "dayjs";

import divisions from "../assets/address/divisions.json";
import districts from "../assets/address/districts.json";
import upazilas from "../assets/address/upazilas.json";
import unions from "../assets/address/unions.json";

const normalize = (value) => value?.trim().toLowerCase();

const findIdByName = (items, name) => {
  if (!name) {
    return undefined;
  }

  return items.find((item) => normalize(item.name) === normalize(name))?.id;
};

const toAddressFormValue = (address) => {
  if (!address) {
    return undefined;
  }

  return {
    houseOrHolding: address.houseOrHolding || "",

    road: address.road || "",

    village: address.village || "",

    postOffice: address.postOffice || "",

    divisionId: findIdByName(divisions, address.division),

    districtId: findIdByName(districts, address.district),

    upazilaId: findIdByName(upazilas, address.upazila),

    unionId: findIdByName(unions, address.union),
  };
};

export const buildMemberFormValues = (member) => {
  const presentAddress = member.addresses?.find(
    (address) => address.type === "PRESENT",
  );

  const fatherAddress = member.addresses?.find(
    (address) => address.type === "FATHER_HOME",
  );

  const guarantor = member.guarantors?.[0];

  return {
    fullName: member.fullName || "",

    fatherName: member.fatherName || "",

    motherName: member.motherName || "",

    guardianName: member.guardianName || "",

    mobileNumber: member.mobileNumber || "",

    nidNumber: member.nidNumber || "",

    email: member.email || "",

    occupation: member.occupation || undefined,

    joinDate: member.joinDate ? dayjs(member.joinDate) : null,

    notes: member.notes || "",

    presentAddress: toAddressFormValue(presentAddress),

    fatherAddress: toAddressFormValue(fatherAddress),

    guarantor: guarantor
      ? {
          fullName: guarantor.fullName || "",

          fatherName: guarantor.fatherName || "",

          motherName: guarantor.motherName || "",

          mobileNumber: guarantor.mobileNumber || "",

          nidNumber: guarantor.nidNumber || "",

          relationship: guarantor.relationship || undefined,

          occupation: guarantor.occupation || undefined,

          notes: guarantor.notes || "",

          address: toAddressFormValue(guarantor),
        }
      : undefined,
  };
};
