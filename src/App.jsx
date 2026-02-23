import React, { useState } from 'react';

// --- 1. КОНСТАНТЫ ---
const ROLES = { 
  PLAYER: 'игрок', 
  MASTER: 'мастер', 
  ADMIN: 'администратор' 
};

const INITIAL_GAMES = [
  { id: 1, title: "D&D: Шахта Фанделвера", master: "Алексей С.", players: 5, maxPlayers: 6, date: "2023-10-25T18:00", image: "https://images.unsplash.com", desc: "Классическое приключение для новичков." },
  { id: 2, title: "Остров Катан", master: "Мария И.", players: 3, maxPlayers: 4, date: "2023-10-26T19:00", image: "https://images.unsplash.com", desc: "Мирная стратегия о колонизации острова." }
];

const INITIAL_PRIVILEGED_USERS = [
  { id: 1, name: "Иван (Главный)", role: ROLES.ADMIN },
  { id: 2, name: "Алексей С.", role: ROLES.MASTER },
];

export default function App() {
  // --- 2. СОСТОЯНИЯ (STATE) ---
  const [view, setView] = useState('list'); // 'list', 'details', 'admin', 'create'
  const [currentUser, setCurrentUser] = useState(INITIAL_PRIVILEGED_USERS[0]); 
  const [games, setGames] = useState(INITIAL_GAMES);
  const [privilegedUsers, setPrivilegedUsers] = useState(INITIAL_PRIVILEGED_USERS);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Состояния для форм
    // Функция для генерации даты: завтра в 19:00 по Московскому времени (UTC+3)
 const getMoscowDefaultDateTime = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Переходим на завтра
    
    // Получаем компоненты даты
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы в JS от 0 до 11
    const day = String(date.getDate()).padStart(2, '0');
    const hours = "19"; // Принудительно 19:00
    const minutes = "00";

    // Собираем строго по стандарту: YYYY-MM-DDTHH:mm
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Состояние формы новой игры
  const [newGame, setNewGame] = useState({ 
    title: '', 
    maxPlayers: 4, 
    date: getMoscowDefaultDateTime(), 
    desc: '', 
    image: 'https://images.unsplash.com' 
  });
  // Состояние формы нового пользователя
  const [newUser, setNewUser] = useState({ name: '', role: ROLES.MASTER });

  // Права доступа
  const isMasterOrAdmin = [ROLES.MASTER, ROLES.ADMIN].includes(currentUser.role);
  const isAdmin = currentUser.role === ROLES.ADMIN;

  // --- 3. ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handleSaveGame = (e) => {
    e.preventDefault();
    const gameToAdd = { ...newGame, id: Date.now(), master: currentUser.name, players: 0 };
    setGames([gameToAdd, ...games]);
    setView('list');
    setNewGame({ title: '', maxPlayers: 4, date: '', desc: '', image: 'https://images.unsplash.com' });
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name.trim()) return;
    const userToAdd = { ...newUser, id: Date.now() };
    setPrivilegedUsers([...privilegedUsers, userToAdd]);
    setNewUser({ name: '', role: ROLES.MASTER }); // Сброс формы
  };

  const deleteGame = (e, gameId) => {
    e.stopPropagation();
    if (window.confirm("Удалить эту игру?")) {
      setGames(games.filter(g => g.id !== gameId));
      if (selectedGame?.id === gameId) setView('list');
    }
  };

  const revokePrivileges = (userId) => {
    if (userId === currentUser.id) return alert("Нельзя лишить прав самого себя!");
    setPrivilegedUsers(privilegedUsers.filter(u => u.id !== userId));
  };

  // --- 4. КОМПОНЕНТ: ШАПКА ---
  const Header = () => (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-20 shadow-sm px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-emerald-600 cursor-pointer tracking-tighter" onClick={() => setView('list')}>DICE & MEETS</h1>
        <div className="flex items-center gap-6">
          {isAdmin && <button onClick={() => setView('admin')} className="text-slate-400 hover:text-emerald-600 text-sm font-black uppercase tracking-widest transition-colors">Персонал</button>}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-100 font-bold">
            <div className="text-right">
              <p className="text-[10px] text-emerald-500 uppercase font-black">{currentUser.role}</p>
              <p className="text-sm text-slate-800">{currentUser.name}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs">{currentUser.name[0]}</div>
          </div>
        </div>
      </div>
    </header>
  );

  // --- 5. ЭКРАН: СПИСОК ИГР ---
  if (view === 'list') {
    const filtered = games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <input 
            type="text" placeholder="Поиск приключений..." 
            className="w-full max-w-md px-6 py-4 rounded-3xl bg-white shadow-sm border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all mb-10 font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isMasterOrAdmin && (
              <div onClick={() => setView('create')} className="border-4 border-dashed border-emerald-100 rounded-[3rem] flex flex-col items-center justify-center p-10 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group h-[360px]">
                <div className="text-5xl text-emerald-200 group-hover:scale-110 transition-transform mb-2">+</div>
                <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest text-center">Новое приключение</span>
              </div>
            )}

            {filtered.map(game => {
              const canDelete = isAdmin || (currentUser.role === ROLES.MASTER && game.master === currentUser.name);
              return (
                <div key={game.id} onClick={() => { setSelectedGame(game); setView('details'); }} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer h-[360px] flex flex-col relative group">
                  <img src={game.image} className="h-44 w-full object-cover" />
                  {canDelete && (
                    <button onClick={(e) => deleteGame(e, game.id)} className="absolute top-4 right-4 bg-white/90 backdrop-blur text-red-500 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-lg">🗑</button>
                  )}
                  <div className="p-8 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">{game.title}</h2>
                      <p className="text-sm text-slate-400 font-medium">Ведущий: {game.master}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 font-bold">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{new Date(game.date).toLocaleDateString('ru-RU')}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black italic">{game.players}/{game.maxPlayers}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    );
  }

  // --- 6. ЭКРАН: СОЗДАНИЕ ИГРЫ ---
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <button onClick={() => setView('list')} className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-emerald-600 transition-colors">← Отмена</button>
          <form onSubmit={handleSaveGame} className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Новая игра</h2>
            <div className="space-y-4">
              <input required type="text" placeholder="Название игры" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none font-bold" 
                value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} />
              
              <input required type="url" placeholder="Ссылка на обложку (URL)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none text-xs font-mono" 
                value={newGame.image} onChange={e => setNewGame({...newGame, image: e.target.value})} />

              <div className="grid grid-cols-2 gap-4 font-bold">
                <input required type="datetime-local" className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border-none"
                  value={newGame.date} onChange={e => setNewGame({...newGame, date: e.target.value})} />
                <input required type="number" placeholder="Игроков" className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border-none"
                  value={newGame.maxPlayers} onChange={e => setNewGame({...newGame, maxPlayers: e.target.value})} />
              </div>
              <textarea required rows="4" placeholder="Описание (Markdown)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border-none resize-none font-medium"
                value={newGame.desc} onChange={e => setNewGame({...newGame, desc: e.target.value})}></textarea>
            </div>
            <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest text-sm">Опубликовать</button>
          </form>
        </main>
      </div>
    );
  }

  // --- 7. ЭКРАН: ДЕТАЛИ ИГРЫ ---
  if (view === 'details' && selectedGame) {
    const canDelete = isAdmin || (currentUser.role === ROLES.MASTER && selectedGame.master === currentUser.name);
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <button onClick={() => setView('list')} className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-6">← К списку</button>
          <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-50 flex flex-col md:flex-row">
            <img src={selectedGame.image} className="md:w-1/2 h-80 md:h-auto object-cover" />
            <div className="p-12 md:w-1/2">
              <h1 className="text-4xl font-black text-slate-800 leading-tight mb-4">{selectedGame.title}</h1>
              <p className="text-emerald-600 font-bold mb-6 italic">Мастер: {selectedGame.master}</p>
              <div className="text-slate-500 mb-10 text-sm leading-relaxed whitespace-pre-line font-medium">{selectedGame.desc}</div>
              <div className="flex gap-4">
                <button className="flex-1 bg-emerald-500 text-white font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all uppercase tracking-widest text-xs">Записаться</button>
                {canDelete && <button onClick={(e) => deleteGame(e, selectedGame.id)} className="bg-red-50 text-red-500 px-6 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">🗑</button>}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- 8. ЭКРАН: АДМИН-ПАНЕЛЬ (С ДОБАВЛЕНИЕМ ПОЛЬЗОВАТЕЛЕЙ) ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <button onClick={() => setView('list')} className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">← Назад</button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Форма добавления (Слева) */}
            <div className="md:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-sm h-fit">
              <h3 className="text-lg font-black text-slate-800 mb-6">Назначить роль</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input required type="text" placeholder="Имя пользователя" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold border-none"
                  value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <select className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold border-none cursor-pointer shadow-sm"
                  value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value={ROLES.MASTER}>Мастер</option>
                  <option value={ROLES.ADMIN}>Администратор</option>
                </select>
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px]">
                  Добавить в список
                </button>
              </form>
            </div>

            {/* Список (Справа) */}
            <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-sm p-10">
              <h2 className="text-2xl font-black mb-8 text-slate-800 tracking-tight">Персонал системы</h2>
              <div className="space-y-4">
                {privilegedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 leading-none mb-1">{u.name}</span>
                      <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest italic">{u.role}</span>
                    </div>
                    <div className="flex gap-2">
                      {/* Возможность быстро сменить роль прямо в списке */}
                      <select className="bg-white p-2 rounded-lg text-[10px] font-bold shadow-sm outline-none border-none cursor-pointer"
                        value={u.role} onChange={(e) => setPrivilegedUsers(privilegedUsers.map(user => user.id === u.id ? {...user, role: e.target.value} : user))}>
                        <option value={ROLES.MASTER}>Мастер</option>
                        <option value={ROLES.ADMIN}>Админ</option>
                      </select>
                      <button onClick={() => revokePrivileges(u.id)} className="bg-white text-red-400 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}