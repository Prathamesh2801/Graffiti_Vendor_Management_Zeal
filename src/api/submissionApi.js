import api from "./api";

export const getSubmissions = async (params = {}) => {
  const res = await api.get("/Vendor/dashboard.php", {
    params,
  });

  return res.data;
};

export const updateSubmissionStatus = async ({ uniqueId, status }) => {
  const res = await api.put("/Vendor/dashboard.php", {
    Unique_ID: uniqueId,
    Status: status,
  });

  return res.data;
};

export const updateImageStatus = async ({ imageId, campaignId, status }) => {
  const res = await api.put("/Vendor/dashboard.php", {
    Image_ID: imageId,
    Campaign_ID: campaignId,
    Status: status,
  });

  return res.data;
};
