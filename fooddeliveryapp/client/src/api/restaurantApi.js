import api from "./axiosInstance";

export const list = async (params = {}) => (await api.get("/restaurants", { params })).data;
export const getById = async (id) => (await api.get(`/restaurants/${id}`)).data;
export const create = async (restaurant) => (await api.post("/restaurants", restaurant)).data;
export const update = async (id, restaurant) => (await api.put(`/restaurants/${id}`, restaurant)).data;
export const remove = async (id) => (await api.delete(`/restaurants/${id}`)).data;
export const search = async (params = {}) => (await api.get("/restaurants/search", { params })).data;
