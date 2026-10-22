import api from "./axiosInstance";

export const register = async (userData) => (await api.post("/auth/register", userData)).data;
export const login = async (credentials) => (await api.post("/auth/login", credentials)).data;
export const getMe = async () => (await api.get("/auth/me")).data;
