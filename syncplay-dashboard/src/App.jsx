import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Search, Clapperboard, Tv, Settings, UserCircle, Home } from 'lucide-react';

import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import TvShowsPage from './pages/TvShowsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import SettingsPage from './pages/Settings';
import SearchPage from './pages/SearchPage';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
  const [searchTerm, setSearchTerm] = useState('');

  const bgClass = isDarkMode
    ? "bg-[#050507] text-slate-200"
    : "bg-[#eef1f8] text-slate-800";

  const getIconClass = (path) => {
    const isActive = location.pathname === path;
    if (isDarkMode) {
      return `p-3 rounded-xl transition-all duration-300 ${
        isActive
          ? 'text-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
          : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`;
    } else {
      return `p-3 rounded-xl transition-all duration-300 ${
        isActive
          ? 'text-indigo-600 bg-indigo-500/10 shadow-lg shadow-indigo-100/50'
          : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100/60'
      }`;
    }
  };

  const pageTitle = {
    '/home': '홈',
    '/movies': '영화',
    '/tv': 'TV 시리즈',
    '/mypage': '마이페이지',
    '/search': '통합 검색',
    '/settings': '설정',
  }[location.pathname] ?? '';

  return (
    <div className={`flex min-h-screen ${bgClass} font-sans relative overflow-hidden transition-colors duration-500`}>

      {/* 배경 앰비언트 오브 */}
      {!isAuthPage && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute top-[-15%] left-[10%] w-[700px] h-[700px] rounded-full blur-[180px] ${isDarkMode ? 'bg-indigo-500/[0.07]' : 'bg-indigo-400/[0.1]'}`} />
          <div className={`absolute top-[40%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[150px] ${isDarkMode ? 'bg-violet-600/[0.05]' : 'bg-violet-400/[0.08]'}`} />
          <div className={`absolute bottom-[-10%] left-[35%] w-[600px] h-[600px] rounded-full blur-[160px] ${isDarkMode ? 'bg-sky-500/[0.04]' : 'bg-sky-400/[0.07]'}`} />
        </div>
      )}

      {/* 사이드바 */}
      {!isAuthPage && (
        <div className={`w-24 backdrop-blur-xl ${isDarkMode ? 'bg-black/25 border-white/[0.06]' : 'bg-white/60 border-slate-200/60'} border-r flex flex-col items-center py-12 h-screen sticky top-0 z-50 shrink-0`}>
          <div className="flex flex-col items-center space-y-8 flex-1">
            <Link title="홈 대시보드" to="/home" className={getIconClass('/home')}>
              <Home size={24} strokeWidth={2} />
            </Link>
            <Link title="콘텐츠 검색" to="/search" className={getIconClass('/search')}>
              <Search size={24} strokeWidth={2.5} />
            </Link>

            <div className={`w-8 h-px ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200/60'}`} />

            <Link title="영화 기록" to="/movies" className={getIconClass('/movies')}>
              <Clapperboard size={24} strokeWidth={2} />
            </Link>
            <Link title="TV 시리즈 기록" to="/tv" className={getIconClass('/tv')}>
              <Tv size={24} strokeWidth={2} />
            </Link>
            <Link title="마이페이지" to="/mypage" className={getIconClass('/mypage')}>
              <UserCircle size={24} strokeWidth={2} />
            </Link>
          </div>
          <Link title="설정" to="/settings" className={getIconClass('/settings')}>
            <Settings size={24} strokeWidth={2} />
          </Link>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden h-screen relative z-10">
        <main className={`flex-1 overflow-y-auto ${isAuthPage ? '' : 'p-8 lg:p-14'}`}>
          {!isAuthPage && (
            <div className="flex justify-between items-center mb-12">
              <h1 className={`text-5xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter`}>
                {pageTitle}
              </h1>
            </div>
          )}

          <Routes>
            <Route path="/" element={<LoginPage isDarkMode={isDarkMode} />} />
            <Route path="/login" element={<LoginPage isDarkMode={isDarkMode} />} />
            <Route path="/signup" element={<SignupPage isDarkMode={isDarkMode} />} />
            <Route path="/home" element={<HomePage isDarkMode={isDarkMode} />} />
            <Route path="/movies" element={<MoviesPage searchTerm={searchTerm} isDarkMode={isDarkMode} />} />
            <Route path="/tv" element={<TvShowsPage searchTerm={searchTerm} isDarkMode={isDarkMode} />} />
            <Route path="/mypage" element={<MyPage isDarkMode={isDarkMode} />} />
            <Route path="/settings" element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
            <Route path="/search" element={<SearchPage isDarkMode={isDarkMode} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* 우측 패널 */}

        {!isAuthPage && location.pathname !== '/settings' && location.pathname !== '/mypage' && location.pathname !== '/search' && (
          <div className={`w-80 backdrop-blur-xl ${isDarkMode ? 'bg-black/20 border-white/[0.06]' : 'bg-white/50 border-slate-200/60'} border-l p-10 hidden xl:block z-40 h-screen sticky top-0`}>
            <div className="flex items-center mb-12">
              <div className={`flex-1 ${isDarkMode ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/60 border-slate-200/60'} backdrop-blur-xl rounded-xl px-5 py-4 flex items-center border focus-within:border-indigo-500/50 transition-all`}>
                <Search size={18} className="text-slate-500 mr-3" />
                <input
                  type="text"
                  placeholder="목록 필터..."
                  className={`bg-transparent text-sm outline-none w-full ${isDarkMode ? 'text-white' : 'text-slate-800'} placeholder:text-slate-500 font-medium`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
