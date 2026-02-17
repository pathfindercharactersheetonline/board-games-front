import React, { useState } from 'react';

// Имитация базы данных (заглушки)
const MOCK_GAMES = [
  { 
    id: 1, 
    title: "Подземелья и Драконы", 
    master: "Алексей С.", 
    players: 5, 
    maxPlayers: 6,
    date: "25 Октября, 18:00", 
    image: "https://images.unsplash.com",
    desc: "Классическое приключение для новичков. Мы отправимся в заброшенную шахту Фанделвера. Опыт игры не требуется, всему научим!" 
  },
  { 
    id: 2, 
    title: "Остров Катан", 
    master: "Мария И.", 
    players: 3, 
    maxPlayers: 4,
    date: "26 Октября, 19:00", 
    image: "https://images.unsplash.com",
    desc: "Борьба за ресурсы и строительство поселений. Спокойная стратегия для приятного вечера." 
  },
  { 
    id: 3, 
    title: "Киберпанк РЕД", 
    master: "Виктор Д.", 
    players: 4, 
    maxPlayers: 5,
    date: "27 Октября, 20:00", 
    image: "https://images.unsplash.com",
    desc: "Мрачное будущее, неон и высокие технологии. Готовы ли вы бросить вызов корпорациям?" 
  }
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState(null); // Состояние для "открытой" игры

  // Если выбрана игра, показываем "страницу игры"
  if (selectedGame) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <button 
          onClick={() => setSelectedGame(null)}
          className="mb-6 text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
        >
          ← Назад к списку
        </button>
        
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <img src={selectedGame.image} className="w-full h-64 object-cover" alt={selectedGame.title} />
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-extrabold text-slate-800">{selectedGame.title}</h1>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                {selectedGame.players}/{selectedGame.maxPlayers} игроков
              </span>
            </div>
            <p className="text-emerald-600 font-medium mb-6">{selectedGame.date} • Ведущий: {selectedGame.master}</p>
            <div className="prose max-w-none text-slate-600 leading-relaxed mb-8">
              {selectedGame.desc}
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-200">
              Записаться на игру
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Основной экран: Поиск и Список (плитка)
  const filteredGames = MOCK_GAMES.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.master.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Шапка */}
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-emerald-600 tracking-tight">DICE & MEETS</h1>
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Поиск по названию или мастеру..." 
              className="w-full pl-4 pr-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGames.map(game => (
            <div 
              key={game.id} 
              onClick={() => setSelectedGame(game)}
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={game.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={game.title} />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-emerald-700">
                  {game.date}
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">{game.title}</h2>
                <div className="flex items-center text-sm text-slate-500 mb-4">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  Мастер: {game.master}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">{game.players} / {game.maxPlayers} мест</span>
                  <span className="text-emerald-500 font-bold">Подробнее →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredGames.length === 0 && (
          <div className="text-center py-20 text-slate-400">Игры не найдены...</div>
        )}
      </main>
    </div>
  );
}