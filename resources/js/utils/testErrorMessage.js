import { getErrorMessage } from "@/utils/getErrorMessage";

// mock بسيط للـ t()
const t = (key) => key;

// جرب كل حالة
const cases = [
    { label: "Network", error: null },
    { label: "No response", error: {} },
    { label: "401", error: { response: { status: 401 }, userMessage: null } },
    {
        label: "401 + msg",
        error: { response: { status: 401 }, userMessage: "انتهت جلستك" },
    },
    { label: "404", error: { response: { status: 404 }, userMessage: null } },
    {
        label: "422",
        error: { response: { status: 422 }, userMessage: "اسم المنتج مطلوب" },
    },
    { label: "429", error: { response: { status: 429 }, userMessage: null } },
    { label: "500", error: { response: { status: 500 }, userMessage: null } },
    {
        label: "503",
        error: { response: { status: 503 }, userMessage: "الخادم في صيانة" },
    },
    {
        label: "Unknown 418",
        error: { response: { status: 418 }, userMessage: null },
    },
];

cases.forEach(({ label, error }) => {
    const result = getErrorMessage(error, t);
    console.log(`[${label}]`, result);
});
