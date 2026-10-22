import api from "./axiosInstance";

export const placeOrder = async (order) => (await api.post("/orders", order)).data;
export const getMyOrders = async (params = {}) => (await api.get("/orders/mine", { params })).data;
export const updateStatus = async (id, status) => (await api.patch(`/orders/${id}/status`, { status })).data;
