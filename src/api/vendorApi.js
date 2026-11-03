import api from "./api";

/* ================= GET VENDOR DATA ================= */
export const getVendorRecords = async (params = {}) => {
  const res = await api.get("/Vendor/dashboard.php", {
    params,
  });
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

  return res.data;
};

export const addMoreImages = async ({ uniqueId, images }) => {
  const formData = new FormData();

  images.forEach((file) => {
    formData.append("Wall_Image", file);
  });

  const res = await api.put("/Vendor/dashboard.php", formData, {
    params: { Unique_ID: uniqueId },
  });


  return res.data;
};
