import axios from "axios";

const apiClient = axios.create({
    baseURL: "/",
    withCredentials: true,
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data?.message) {
            error.userMessage = error.response.data.message;
        }
        return Promise.reject(error);
    },
);

export default apiClient;