import divisions from "../assets/address/divisions.json";
import districts from "../assets/address/districts.json";
import upazilas from "../assets/address/upazilas.json";
import unions from "../assets/address/unions.json";

export const getDivisions = () => {
  return divisions;
};

export const getDistrictsByDivision = (divisionId) => {
  if (!divisionId) return [];

  return districts.filter(
    (district) => String(district.division_id) === String(divisionId),
  );
};

export const getUpazilasByDistrict = (districtId) => {
  if (!districtId) return [];

  return upazilas.filter(
    (upazila) => String(upazila.district_id) === String(districtId),
  );
};

export const getUnionsByUpazila = (upazilaId) => {
  if (!upazilaId) return [];

  return unions.filter(
    (union) => String(union.upazila_id) === String(upazilaId),
  );
};
