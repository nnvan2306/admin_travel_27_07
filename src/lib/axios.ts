import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers["ngrok-skip-browser-warning"]) {
    config.headers["ngrok-skip-browser-warning"] = "true";
  }
  return config;
});

const BACKEND = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

export { API, BACKEND };
