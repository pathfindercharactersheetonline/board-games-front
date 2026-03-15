import React, { useState, useEffect, useCallback } from 'react';
import CONFIG from './config';

const ROLES = { PLAYER: 'игрок', MASTER: 'мастер', ADMIN: 'администратор' };

export default function App() {
  // --- Вспомогательная функция для даты ---
  const getMoscowDefaultDateTime = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T19:00`;
  };

  // --- 1. СОСТОЯНИЯ (STATE) ---
  const [editingGame, setEditingGame] = useState(null);
  const [view, setView] = useState('loading'); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newGame, setNewGame] = useState({ 
    title: '', 
    max_players: 4,              // Было maxPlayers
    date_time: getMoscowDefaultDateTime(), // Было date
    description: '',             // Было desc
    image_url: 'https://images.unsplash.com', // Было image
    master_name: currentUser?.email || 'Мастер' // НОВОЕ ОБЯЗАТЕЛЬНОЕ ПОЛЕ
  });

  // --- 2. ЛОГИКА ЗАГРУЗКИ ДАННЫХ ---
  const fetchGames = async (userId) => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/games`, {
        headers: { 'x-user-id': String(userId) }
      });
      const data = await res.json();
      setGames(data);
      return data; // ВАЖНО: возвращаем данные, чтобы использовать их в цепочке
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const email = params.get('email');
    const role = params.get('role');

    if (id && email && role) {
      const userData = { id: Number(id), email, role };
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      fetchGames(userData.id);
      setView('list');
      window.history.replaceState({}, document.title, "/");
      return;
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      fetchGames(parsed.id);
      setView('list');
    } else {
      setView('login');
    }
  }, []);

  // Дополнительный эффект для синхронизации формы с пользователем
  useEffect(() => {
    if (currentUser) {
      setNewGame(prev => ({
        ...prev,
        master_name: currentUser.email,
        date_time: getMoscowDefaultDateTime() // Обновляем дату при загрузке юзера
      }));
    }
  }, [currentUser]); // Сработает сразу, как только currentUser перестанет быть null


  // --- 3. ОБРАБОТЧИКИ СОБЫТИЙ ---

//  запись
const handleJoinGame = async (gameId) => {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/bookings/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-user-id': String(currentUser.id) 
      },
      body: JSON.stringify({ game_id: gameId })
    });

    if (res.ok) {
      // КЛЮЧЕВОЙ МОМЕНТ: ждем обновления общего списка и получаем его
      const allGames = await fetchGames(currentUser.id);
      
      // Находим ЭТУ ЖЕ игру в свежем списке
      const freshGame = allGames.find(g => g.id === gameId);
      
      if (freshGame) {
        // Обновляем выбранную игру НОВЫМ объектом (смена ссылки заставит React перерисовать экран)
        setSelectedGame({...freshGame}); 
      }
    }
  } catch (e) { console.error(e); }
};

// отмена записи
const handleLeaveGame = async (gameId) => {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/bookings/leave/${gameId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': String(currentUser.id) }
    });

    if (res.ok) {
      const allGames = await fetchGames(currentUser.id);
      const freshGame = allGames.find(g => g.id === gameId);
      if (freshGame) {
        setSelectedGame({...freshGame}); // Обновляем через деструктуризацию для новой ссылки
      }
    }
  } catch (e) { console.error(e); }
};


  // Удаление игры
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту игру?")) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/games/${gameId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': String(currentUser.id) }
      });
      if (res.ok) {
        alert("Игра удалена");
        setView('list');
        fetchGames(currentUser.id);
      } else {
        const error = await res.json();
        alert(error.detail || "Ошибка при удалении");
      }
    } catch (e) { alert("Ошибка соединения"); }
  };

  // Обновление игры (логика похожа на создание, но метод PATCH/PUT)
  const handleUpdateGame = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/games/${editingGame.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id) 
        },
        // Отправляем ТОЛЬКО те поля, которые есть в GameBase
        body: JSON.stringify({
          title: editingGame.title,
          master_name: editingGame.master_name || currentUser.email, // ВАЖНО: берем из объекта или текущего юзера
          description: editingGame.description,
          image_url: editingGame.image_url,
          max_players: Number(editingGame.max_players),
          date_time: editingGame.date_time
        })
      });

      if (res.ok) {
        alert("Приключение обновлено!");
        setEditingGame(null);
        setView('list');
        fetchGames(currentUser.id);
      } else {
        const errorData = await res.json();
        alert(`Ошибка: ${errorData.detail}`);
      }
    } catch (e) {
      alert("Не удалось связаться с сервером");
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setView('login');
  };


  const handleSaveGame = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/games`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id) 
        },
        body: JSON.stringify(newGame)
      });
      if (res.ok) {
        await fetchGames(currentUser.id);
        setView('list');
        // Сброс формы с новой датой по умолчанию
        setNewGame({ 
          title: '', 
          max_players: 4,              // Было maxPlayers
          date_time: getMoscowDefaultDateTime(), // Было date
          description: '',             // Было desc
          image_url: 'https://images.unsplash.com', // Было image
          master_name: currentUser?.email || 'Мастер'
        });
      }
    } catch (e) { alert("Ошибка создания игры"); }
  };

  const handleCleanupOldGames = async () => {
    if (!window.confirm("Удалить все прошедшие игры?")) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/v1/admin/cleanup-old-games`, {
        method: 'DELETE',
        headers: { 'x-user-id': String(currentUser.id) }
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Удалено игр: ${result.deleted_count}`);
        fetchGames(currentUser.id);
      }
    } catch (e) { alert("Ошибка очистки"); }
  };

  // --- 4. КОМПОНЕНТЫ ИНТЕРФЕЙСА ---
  if (view === 'loading') return <div className="p-10 font-bold text-center">Загрузка...</div>;

  if (view === 'login') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full relative">
        <h1 className="text-4xl font-black text-emerald-600 mb-2">DICE & MEETS</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Клуб настольных игр</p>
        
        {/* Ссылка-кнопка с явными стилями кликабельности */}
        <a 
          href={CONFIG.YANDEX_LOGIN_URL} 
          onClick={(e) => {
            // Останавливаем "всплытие" события к родительским блокам
            e.stopPropagation();
            console.log("Клик по кнопке зафиксирован, переход на:", CONFIG.YANDEX_LOGIN_URL);
          }}
          className="relative z-50 inline-block w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-5 rounded-2xl transition-all shadow-lg cursor-pointer uppercase tracking-tighter text-sm active:scale-95 text-center"
        >
          Войти через Яндекс
        </a>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-sm px-6 py-4 flex justify-between items-center text-left">
      <h1 className="text-2xl font-black text-emerald-600 cursor-pointer" onClick={() => setView('list')}>DICE & MEETS</h1>
      <div className="flex items-center gap-6">
        {currentUser?.role === ROLES.ADMIN && (
          <button onClick={() => setView('admin')} className="text-slate-400 hover:text-emerald-600 text-[10px] font-black uppercase tracking-widest transition-colors">Админка</button>
        )}
        <div className="text-right border-l pl-4 font-bold">
          <p className="text-[10px] text-emerald-500 uppercase leading-none mb-1">{currentUser?.role}</p>
          <p className="text-sm text-slate-800 leading-none mb-1">{currentUser?.email}</p>
          <button onClick={handleLogout} className="text-[9px] text-red-300 hover:text-red-500 uppercase tracking-tighter">Выйти</button>
        </div>
      </div>
    </header>
  );

  if (view === 'list') {
    const filtered = games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <input type="text" placeholder="Поиск приключений..." className="w-full max-w-md px-6 py-4 rounded-3xl bg-white shadow-sm outline-none mb-10 font-bold border-none focus:ring-2 focus:ring-emerald-500 transition-all" onChange={e => setSearchTerm(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(currentUser?.role === ROLES.MASTER || currentUser?.role === ROLES.ADMIN) && (
              <div onClick={() => setView('create')} className="border-4 border-dashed border-emerald-100 rounded-[3rem] flex flex-col items-center justify-center p-10 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group h-[340px] text-center">
                <span className="text-5xl text-emerald-200 group-hover:scale-110 mb-2 transition-transform">+</span>
                <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Создать игру</span>
              </div>
            )}
            {filtered.map(game => (
              <div key={game.id} onClick={() => { setSelectedGame(game); setView('details'); }} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all cursor-pointer h-[340px] flex flex-col relative group">
                <img src={game.image_url} className="h-40 w-full object-cover" alt="" />
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <h2 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">{game.title}</h2>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 font-bold">
                    <span className="text-[10px] text-emerald-500 uppercase">{new Date(game.date_time).toLocaleDateString()}</span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[10px] uppercase font-black tracking-tighter">
                      {game.current_players}/{game.max_players} мест
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (view === 'admin') return (
    <div className="min-h-screen bg-slate-50 text-left">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <button onClick={() => setView('list')} className="text-emerald-600 font-black text-[10px] uppercase mb-6 tracking-widest">← Назад</button>
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
          <h2 className="text-3xl font-black text-slate-800 mb-4">Панель управления</h2>
          <p className="text-slate-400 font-medium mb-10">Обслуживание системы и базы данных приключений.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100">
              <h3 className="font-black text-red-600 uppercase text-xs tracking-widest mb-2">Очистка данных</h3>
              <p className="text-sm text-red-400 mb-6 font-bold">Удалить все завершенные игры, дата которых меньше текущей.</p>
              <button onClick={handleCleanupOldGames} className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-100 uppercase text-[10px] tracking-widest">
                Запустить очистку
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  if (view === 'create') return (
    <div className="min-h-screen bg-slate-50 text-left">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => setView('list')} className="text-slate-400 font-black text-[10px] uppercase mb-6 tracking-widest hover:text-emerald-600 transition-colors">← Отмена</button>
        <form onSubmit={handleSaveGame} className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-6">
          <h2 className="text-3xl font-black text-slate-800 leading-none">Новая игра</h2>
          <div className="space-y-4">
            <input required type="text" placeholder="Название" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border-none font-bold" value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} />
            <input required type="url" placeholder="URL картинки" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-mono border-none" value={newGame.image_url} onChange={e => setNewGame({...newGame, image_url: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input required type="datetime-local" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold border-none" value={newGame.date_time} onChange={e => setNewGame({...newGame, date_time: e.target.value})} />
              <input required type="number" placeholder="Мест" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold border-none" value={newGame.max_players} onChange={e => setNewGame({...newGame, max_players: Number(e.target.value)})} />
            </div>
            <textarea required rows="4" placeholder="Описание" className="w-full p-4 bg-slate-50 rounded-2xl outline-none resize-none font-medium border-none" value={newGame.description} onChange={e => setNewGame({...newGame, description: e.target.value})}></textarea>
          </div>
          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">Опубликовать</button>
        </form>
      </main>
    </div>
  );

  if (view === 'edit' && editingGame) {
    return (
      <div className="min-h-screen bg-slate-50 text-left flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-10 w-full">
          {/* Кнопка отмены */}
          <button 
            onClick={() => { setEditingGame(null); setView('details'); }} 
            className="text-slate-400 font-black text-[10px] uppercase mb-6 tracking-widest hover:text-emerald-600 transition-colors"
          >
            ← Отменить редактирование
          </button>

          <form 
            onSubmit={handleUpdateGame} 
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-6 border border-slate-100"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800">Редактирование</h2>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-tighter">ID игры: {editingGame.id}</p>
            </div>

            <div className="space-y-4">
              {/* Название игры */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Название приключения</label>
                <input 
                  required type="text" 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-2 border-transparent focus:border-emerald-100 outline-none transition-all" 
                  value={editingGame.title} 
                  onChange={e => setEditingGame({...editingGame, title: e.target.value})} 
                />
              </div>
              
              {/* Ссылка на картинку */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">URL обложки (картинка)</label>
                <input 
                  required type="url" 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-slate-600 border-2 border-transparent focus:border-emerald-100 outline-none transition-all" 
                  value={editingGame.image_url} 
                  onChange={e => setEditingGame({...editingGame, image_url: e.target.value})} 
                />
              </div>

              {/* Дата и Количество игроков в одну строку */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Дата и время (МСК)</label>
                  <input 
                    required type="datetime-local" 
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-2 border-transparent focus:border-emerald-100 outline-none transition-all" 
                    value={editingGame.date_time} 
                    onChange={e => setEditingGame({...editingGame, date_time: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Макс. игроков</label>
                  <input 
                    required type="number" min="1" max="20"
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-2 border-transparent focus:border-emerald-100 outline-none transition-all" 
                    value={editingGame.max_players} 
                    onChange={e => setEditingGame({...editingGame, max_players: Number(e.target.value)})} 
                  />
                </div>
              </div>

              {/* Описание */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Описание приключения</label>
                <textarea 
                  required rows="5" 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-slate-600 border-2 border-transparent focus:border-emerald-100 outline-none transition-all resize-none" 
                  value={editingGame.description} 
                  onChange={e => setEditingGame({...editingGame, description: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                type="submit" 
                className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all"
              >
                Сохранить изменения
              </button>
              <button 
                type="button"
                onClick={() => { setEditingGame(null); setView('details'); }}
                className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
              >
                Назад без сохранения
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  if (view === 'details' && selectedGame) {
    // 1. Сначала объявляем все расчетные переменные
    const isFull = selectedGame.current_players >= selectedGame.max_players;
    
    // Проверяем, записан ли текущий пользователь
    const isJoined = selectedGame.booked_users?.some(u => u.id === currentUser.id);

    // Проверка прав (админ или мастер игры)
    const canManage = currentUser.role === 'администратор' || 
                    (currentUser.role === 'мастер' && selectedGame.master_name === currentUser.email);

    // 2. Только после этого возвращаем JSX
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <button 
            onClick={() => setView('list')} 
            className="text-emerald-600 font-black text-[10px] uppercase mb-6 tracking-widest hover:opacity-70 transition-all"
          >
            ← Назад к списку
          </button>

          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-emerald-50">
            {/* Изображение */}
            <div className="md:w-1/2 relative h-80 md:h-auto">
              <img src={selectedGame.image_url} className="w-full h-full object-cover" alt={selectedGame.title} />
            </div>

            {/* Контент */}
            <div className="p-8 md:p-12 md:w-1/2 flex flex-col">
              <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-800 leading-tight mb-2">{selectedGame.title}</h1>
                <p className="text-emerald-600 font-bold mb-6 italic">Ведущий: {selectedGame.master_name}</p>
                
                <div className="text-slate-500 text-sm mb-8 leading-relaxed border-l-4 border-emerald-100 pl-6 whitespace-pre-line">
                  {selectedGame.description}
                </div>

                {/* Список участников */}
                <div className="mb-8 bg-slate-50 p-6 rounded-3xl">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
                    Участники ({selectedGame.current_players}/{selectedGame.max_players})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedGame.booked_users && selectedGame.booked_users.length > 0 ? (
                      selectedGame.booked_users.map((user, idx) => (
                        <span key={idx} className="bg-white px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 border border-slate-100 shadow-sm">
                          {user.email.split('@')[0]}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Пока никто не записался...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Блок управления (Редактировать/Удалить) — теперь canManage определен выше */}
              {canManage && (
                <div className="flex gap-3 mb-6">
                  <button 
                    onClick={() => { setEditingGame(selectedGame); setView('edit'); }} 
                    className="flex-1 bg-amber-100 text-amber-700 font-black py-3 rounded-xl uppercase text-[10px] hover:bg-amber-200 transition-all"
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={() => handleDeleteGame(selectedGame.id)} 
                    className="flex-1 bg-red-100 text-red-600 font-black py-3 rounded-xl uppercase text-[10px] hover:bg-red-200 transition-all"
                  >
                    Удалить
                  </button>
                </div>
              )}

              {/* Кнопка записи */}
              <div className="space-y-4">
                {isJoined ? (
                  <button 
                    onClick={() => handleLeaveGame(selectedGame.id)} 
                    className="w-full bg-red-50 text-red-500 font-black py-5 rounded-2xl uppercase tracking-widest border-2 border-red-100 hover:bg-red-100 transition-all"
                  >
                    Отписаться от приключения
                  </button>
                ) : (
                  <button 
                    disabled={isFull} 
                    onClick={() => handleJoinGame(selectedGame.id)} 
                    className={`w-full font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl transition-all ${isFull ? 'bg-slate-200 text-slate-400' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'}`}
                  >
                    {isFull ? 'МЕСТ НЕТ' : 'ЗАПИСАТЬСЯ НА ПРИКЛЮЧЕНИЕ'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
