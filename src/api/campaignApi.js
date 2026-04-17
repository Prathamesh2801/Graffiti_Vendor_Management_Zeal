import api from "./api";

/* ================= GET CAMPAIGNS ================= */
export const getCampaigns = async (params = {}) => {
  const res = await api.get("/Admin/campaigns.php", {
    params,
  });

  return res.data;
};

/* ================= CREATE CAMPAIGN ================= */
export const createCampaign = async (data) => {
  const formData = new FormData();

  formData.append("Name", data.name);
  formData.append("Description", data.description);
  formData.append("Start_Date", data.startDate);
  formData.append("End_Date", data.endDate);
  formData.append("State", data.state);
  formData.append("Number_of_Walls", data.walls);

  
  formData.append("Assigned_Users", JSON.stringify(data.assignedUsers));

  const res = await api.post("/Admin/campaigns.php", formData);

  return res.data;
};

/* ================= UPDATE CAMPAIGN ================= */
export const updateCampaign = async (data) => {
  const res = await api.put("/Admin/campaigns.php", {
    Campaign_ID: data.id,
    ...(data.name && { Name: data.name }),
    ...(data.description && { Description: data.description }),
    ...(data.startDate && { Start_Date: data.startDate }),
    ...(data.endDate && { End_Date: data.endDate }),
    ...(data.state && { State: data.state }),
    ...(data.walls && { Number_of_Walls: data.walls }),
    ...(data.assignedUsers && {
      Assigned_Users: JSON.stringify(data.assignedUsers),
    }),
  });
  console.log("Update Response:", res);
  return res.data;
};

/* ================= DELETE CAMPAIGN ================= */
export const deleteCampaign = async (id) => {
  const res = await api.delete(`/Admin/campaigns.php?Campaign_ID=${id}`);

  return res.data;
};

/* ================= GET CAMPAIGN CODES ================= */
export const getCampaignCodes = async (campaignId) => {
  const res = await api.get("/Admin/code.php", {
    params: {
      Campaign_ID: campaignId,
    },
  });

  return res.data;
};
