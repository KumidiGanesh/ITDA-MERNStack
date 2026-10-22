import api from "./axiosInstance";

export const list = async (params = {}) => (await api.get("/menu-items", { params })).data;
export const getById = async (id) => (await api.get(`/menu-items/${id}`)).data;
export const create = async (menuItem) => (await api.post("/menu-items", menuItem)).data;
export const update = async (id, menuItem) => (await api.put(`/menu-items/${id}`, menuItem)).data;
export const remove = async (id) => (await api.delete(`/menu-items/${id}`)).data;
