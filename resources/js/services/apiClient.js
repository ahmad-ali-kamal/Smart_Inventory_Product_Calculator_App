import axios from "axios";

const apiClient = axios.create({
    baseURL: "/",
    withCredentials: true,
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

export default apiClient;