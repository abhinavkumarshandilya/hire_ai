import axios from "axios";

const API = axios.create({
  //baseURL: process.env.REACT_APP_API_URL || "/api",


// Naya:
baseURL: process.env.REACT_APP_API_URL || "https://hireai-backend.onrender.com/api",
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("hireai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("hireai_token");
      localStorage.removeItem("hireai_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default API;
