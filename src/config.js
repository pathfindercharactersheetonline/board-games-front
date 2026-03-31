// const CONFIG = {
//   // Пытаемся взять из окружения, если нет — ставим дефолт
//   API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
//   YANDEX_LOGIN_URL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/yandex/login`
// };

// export default CONFIG;

const CONFIG = {
  // Оставляем пустым, чтобы fetch(`${CONFIG.API_BASE_URL}/api/v1/...`) 
  // превратился в fetch(`/api/v1/...`)
  API_BASE_URL: '', 
  
  // Здесь склеится в /api/v1/auth/yandex/login
  YANDEX_LOGIN_URL: '/api/v1/auth/yandex/login'
};

export default CONFIG;
