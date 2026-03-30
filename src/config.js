// 1. Сначала берем "сырой" URL
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 2. Гарантируем, что в конце нет лишнего слэша, но есть /api
const cleanUrl = rawApiUrl.replace(/\/$/, "");
const finalApiUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const CONFIG = {
  API_BASE_URL: finalApiUrl,
  YANDEX_LOGIN_URL: `${finalApiUrl}/v1/auth/yandex/login`
};

export default CONFIG;
