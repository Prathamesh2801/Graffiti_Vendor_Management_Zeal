import api from "./api";

/* ================= GET VENDOR DATA ================= */
export const getVendorRecords = async (params = {}) => {
  const res = await api.get("/Vendor/dashboard.php", {
    params,
  });
  console.log("Fetch Vendor Data : ", res.data);
  return res.data;
};

/* ================= UPLOAD VENDOR IMAGES ================= */
export const uploadVendorImages = async ({ code, geoLocation, images }) => {
  const formData = new FormData();

  formData.append("Code", code);
  formData.append("Geo_Location", geoLocation);

  images.forEach((file) => {
    formData.append("Wall_Image[]", file);
  });

  const res = await api.post("/Vendor/dashboard.php", formData);
  console.log("upload Vendor Data : ", res.data);

  return res.data;
};


// export const validateCampaignCode = async (code) => {
//   const res = await api.get(`/validateCampaign.php?code=${code}`);
//   return res.data;
// };
