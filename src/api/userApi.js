import api from "./api";

export const getUsers = async () => {
  const res = await api.get("/Admin/user.php");
  return res.data;
};

export const createUser = async (data) => {
  const formData = new FormData();
  formData.append("Username", data.username);
  formData.append("Password", data.password);
  formData.append("Role", data.role);

  const res = await api.post("/Admin/user.php", formData);
  return res.data;
};

export const updateUser = async (data) => {
  const res = await api.put("/Admin/user.php", {
    Username: data.username,
    Role: data.role,
    ...(data.password && { Password: data.password }),
  });

  return res.data;
};

export const deleteUser = async (username) => {
  const res = await api.delete(`/Admin/user.php?Username=${username}`);
  return res.data;
};
