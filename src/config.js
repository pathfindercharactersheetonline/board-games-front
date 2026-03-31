const CONFIG = {
  // Пытаемся взять из окружения, если нет — ставим дефолт
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  YANDEX_LOGIN_URL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/yandex/login`
};

export default CONFIG;