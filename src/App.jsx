import React, { useState } from 'react';

// --- 1. КОНСТАНТЫ ---
const ROLES = { PLAYER: 'игрок', MASTER: 'мастер', ADMIN: 'администратор' };

const INITIAL_GAMES = [
  { 
    id: 1, 
    title: "D&D: Шахта Фанделвера", 
    master: "Алексей С.", 
    players: 5, 
    maxPlayers: 6, 
    bookedUsers: [101, 102, 103, 104, 105], 
    date: "2023-10-25T19:00", 
    image: "https://images.unsplash.com", 
    desc: "Классическое приключение для новичков." 
  },
  { 
    id: 2, 
    title: "Остров Катан", 
    master: "Мария И.", 
    players: 1, 
    maxPlayers: 4, 
    bookedUsers: [106], 
    date: "2023-10-26T19:00", 
    image: "https://images.unsplash.com", 
    desc: "Мирная стратегия о колонизации острова." 
  }
];

const INITIAL_PRIVILEGED = [
  { id: 1, name: "Иван (Админ)", role: ROLES.ADMIN },
  { id: 2, name: "Алексей С.", role: ROLES.MASTER },
];

export default function App() {
  // --- 2. СОСТОЯНИЯ (STATE) ---
  const [view, setView] = useState('list'); 
  const [currentUser, setCurrentUser] = useState({ id: 99, name: "Ваш Герой", role: ROLES.ADMIN }); 
  const [games, setGames] = useState(INITIAL_GAMES);
  const [privilegedUsers, setPrivilegedUsers] = useState(INITIAL_PRIVILEGED);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getMoscowDefaultDateTime = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T19:00`;
  };

  const [newGame, setNewGame] = useState({ title: '', maxPlayers: 4, date: getMoscowDefaultDateTime(), desc: '', image: 'https://images.unsplash.com' });
  const [newUser, setNewUser] = useState({ name: '', role: ROLES.MASTER });

  const isMasterOrAdmin = [ROLES.MASTER, ROLES.ADMIN].includes(currentUser.role);
  const isAdmin = currentUser.role === ROLES.ADMIN;

  // --- 3. ЛОГИКА ЗАПИСИ И ОТПИСКИ ---
  const handleJoinGame = (gameId) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId && !g.bookedUsers.includes(currentUser.id) && g.players < g.maxPlayers) {
        const updated = { ...g, players: g.players + 1, bookedUsers: [...g.bookedUsers, currentUser.id] };
        if (selectedGame?.id === gameId) setSelectedGame(updated);
        return updated;
      }
      return g;
    }));
  };

  const handleLeaveGame = (gameId) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId && g.bookedUsers.includes(currentUser.id)) {
        const updated = { 
          ...g, 
          players: Math.max(0, g.players - 1), 
          bookedUsers: g.bookedUsers.filter(uid => uid !== currentUser.id) 
        };
        if (selectedGame?.id === gameId) setSelectedGame(updated);
        return updated;
      }
      return g;
    }));
  };

  const handleSaveGame = (e) => {
    e.preventDefault();
    const gameToAdd = { ...newGame, id: Date.now(), master: currentUser.name, players: 0, bookedUsers: [] };
    setGames([gameToAdd, ...games]);
    setView('list');
    setNewGame({ title: '', maxPlayers: 4, date: getMoscowDefaultDateTime(), desc: '', image: 'https://images.unsplash.com' });
  };

  const deleteGame = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Удалить игру?")) setGames(games.filter(g => g.id !== id));
  };

  const handleAddPrivileged = (e) => {
    e.preventDefault();
    setPrivilegedUsers([...privilegedUsers, { ...newUser, id: Date.now() }]);
    setNewUser({ name: '', role: ROLES.MASTER });
  };

  // --- 4. КОМПОНЕНТЫ ---
  const Header = () => (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-sm px-6 py-4 flex justify-between items-center text-left">
      <h1 className="text-2xl font-black text-emerald-600 cursor-pointer" onClick={() => setView('list')}>DICE & MEETS</h1>
      <div className="flex items-center gap-6">
        {isAdmin && <button onClick={() => setView('admin')} className="text-slate-400 hover:text-emerald-600 text-xs font-black uppercase tracking-widest">Персонал</button>}
        <div className="text-right border-l pl-4 font-bold">
          <p className="text-[10px] text-emerald-500 uppercase tracking-tighter leading-none mb-1">{currentUser.role}</p>
          <p className="text-sm text-slate-800 leading-none">{currentUser.name}</p>
        </div>
      </div>
    </header>
  );

  // --- ЭКРАН: СПИСОК ---
  if (view === 'list') {
    const filtered = games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <input type="text" placeholder="Поиск приключений..." className="w-full max-w-md px-6 py-4 rounded-3xl bg-white shadow-sm outline-none mb-10 font-bold border-none focus:ring-2 focus:ring-emerald-500 transition-all" onChange={e => setSearchTerm(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isMasterOrAdmin && (
              <div onClick={() => setView('create')} className="border-4 border-dashed border-emerald-100 rounded-[3rem] flex flex-col items-center justify-center p-10 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group h-[340px] text-center">
                <span className="text-5xl text-emerald-200 group-hover:scale-110 mb-2 transition-transform">+</span>
                <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Создать игру</span>
              </div>
            )}
            {filtered.map(game => {
              const canDel = isAdmin || (currentUser.role === ROLES.MASTER && game.master === currentUser.name);
              const isBooked = game.bookedUsers.includes(currentUser.id);
              return (
                <div key={game.id} onClick={() => { setSelectedGame(game); setView('details'); }} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all cursor-pointer h-[340px] flex flex-col relative group">
                  <img src={game.image} className="h-40 w-full object-cover" />
                  {canDel && <button onClick={e => deleteGame(e, game.id)} className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg">🗑</button>}
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <h2 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">{game.title}</h2>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 font-bold">
                      <span className="text-[10px] text-emerald-500 uppercase">{new Date(game.date).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-lg text-[10px] uppercase font-black tracking-tighter ${isBooked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                         {isBooked ? 'Записан' : `${game.players}/${game.maxPlayers} мест`}
                      </span>
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

  // --- ЭКРАН: СОЗДАНИЕ ---
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <button onClick={() => setView('list')} className="text-slate-400 font-black text-[10px] uppercase mb-6 tracking-widest hover:text-emerald-600 transition-colors">← Отмена</button>
          <form onSubmit={handleSaveGame} className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-6">
            <h2 className="text-3xl font-black text-slate-800 leading-none">Новая игра</h2>
            <div className="space-y-4">
              <input required type="text" placeholder="Название" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border-none font-bold" value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} />
              <input required type="url" placeholder="URL картинки" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-mono border-none" value={newGame.image} onChange={e => setNewGame({...newGame, image: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="datetime-local" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold border-none" value={newGame.date} onChange={e => setNewGame({...newGame, date: e.target.value})} />
                <input required type="number" placeholder="Мест" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold border-none" value={newGame.maxPlayers} onChange={e => setNewGame({...newGame, maxPlayers: e.target.value})} />
              </div>
              <textarea required rows="4" placeholder="Описание" className="w-full p-4 bg-slate-50 rounded-2xl outline-none resize-none font-medium border-none" value={newGame.desc} onChange={e => setNewGame({...newGame, desc: e.target.value})}></textarea>
            </div>
            <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">Опубликовать</button>
          </form>
        </main>
      </div>
    );
  }

  // --- ЭКРАН: ДЕТАЛИ ---
  if (view === 'details' && selectedGame) {
    const isBooked = selectedGame.bookedUsers.includes(currentUser.id);
    const isFull = selectedGame.players >= selectedGame.maxPlayers;
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <button onClick={() => setView('list')} className="text-emerald-600 font-black text-[10px] uppercase mb-6 tracking-widest">← Назад к списку</button>
          <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-emerald-50">
            <img src={selectedGame.image} className="md:w-1/2 h-80 md:h-auto object-cover" />
            <div className="p-12 md:w-1/2 flex flex-col justify-center">
              <h1 className="text-4xl font-black text-slate-800 leading-tight mb-2">{selectedGame.title}</h1>
              <p className="text-emerald-600 font-bold mb-6 italic tracking-tight">Ведущий: {selectedGame.master}</p>
              <div className="text-slate-500 text-sm mb-10 leading-relaxed font-medium whitespace-pre-line border-l-4 border-emerald-50 pl-4">{selectedGame.desc}</div>
              
              <div className="space-y-3">
                {!isBooked ? (
                  <button 
                    disabled={isFull} 
                    onClick={() => handleJoinGame(selectedGame.id)} 
                    className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl ${isFull ? 'bg-red-50 text-red-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'}`}
                  >
                    {isFull ? 'МЕСТ НЕТ' : 'ЗАПИСАТЬСЯ НА ПРИКЛЮЧЕНИЕ'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full bg-emerald-50 text-emerald-600 font-black py-4 rounded-2xl text-center text-sm border-2 border-emerald-100">
                      ✓ ВЫ ЗАПИСАНЫ
                    </div>
                    <button 
                      onClick={() => handleLeaveGame(selectedGame.id)}
                      className="w-full text-red-400 font-bold py-2 text-xs uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                      Отменить запись
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-6 text-[10px] text-center font-black text-slate-300 uppercase tracking-widest">
                Свободно {selectedGame.maxPlayers - selectedGame.players} из {selectedGame.maxPlayers} мест
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- ЭКРАН: АДМИНКА ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 text-left">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm h-fit border border-slate-100">
            <h3 className="font-black mb-6 text-slate-800 tracking-tight">Добавить роль</h3>
            <form onSubmit={handleAddPrivileged} className="space-y-4">
              <input required type="text" placeholder="Имя" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm border-none focus:ring-2 focus:ring-emerald-500" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-xs border-none cursor-pointer" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value={ROLES.MASTER}>Мастер</option>
                <option value={ROLES.ADMIN}>Админ</option>
              </select>
              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all">Добавить в список</button>
            </form>
          </div>
          <div className="md:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black mb-8 text-slate-800 tracking-tight">Персонал системы</h2>
            <div className="space-y-3">
              {privilegedUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-50">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 leading-none mb-1">{u.name}</span>
                    <span className="text-[9px] text-emerald-500 uppercase font-black italic tracking-widest">{u.role}</span>
                  </div>
                  <button onClick={() => setPrivilegedUsers(privilegedUsers.filter(x => x.id !== u.id))} className="text-red-300 hover:text-red-500 font-black text-xs px-2 transition-colors">✕</button>
                </div>
              ))}
              {privilegedUsers.length === 0 && <p className="text-slate-300 text-center py-10 font-bold italic">Список пуст</p>}
            </div>
          </div>
        </main>
      </div>
    );
  }
}