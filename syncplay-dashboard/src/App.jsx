// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, MonitorPlay, Settings as SettingsIcon, User } from 'lucide-react';

import MoviesPage from './pages/MoviesPage';
import TvShowsPage from './pages/TvShowsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import Settings from './pages/Settings';
import GlobalSearchPage from './pages/GlobalSearchPage';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // '/' 또는 '/login' 모두 인증(로그인) 페이지로 간주하여 사이드바를 숨깁니다.
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {!isAuthPage && (
        <div className="w-20 bg-white border-r flex flex-col items-center py-8 space-y-8 sticky top-0 h-screen">
          <div className="w-10 h-10 bg-blue-600 rounded-lg shadow-md flex items-center justify-center text-white font-bold mb-4">SP</div>
          
          <Link title="Movies" to="/movies" className={`p-3 rounded-xl transition-colors ${location.pathname === '/movies' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}>
            <LayoutDashboard size={24} />
          </Link>
          
          <Link title="Search" to="/search" className={`p-3 rounded-xl transition-colors ${location.pathname === '/search' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}>
            <Search size={24} />
          </Link>
          
          <Link title="TV Shows" to="/tv" className={`p-3 rounded-xl transition-colors ${location.pathname === '/tv' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}>
            <MonitorPlay size={24} />
          </Link>
          
          <Link title="My Page" to="/mypage" className={`p-3 rounded-xl transition-colors ${location.pathname === '/mypage' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}>
            <User size={24} />
          </Link>
          
          <div className="flex-1"></div>
          
          <Link title="Settings" to="/settings" className={`p-3 rounded-xl transition-colors ${location.pathname === '/settings' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}>
            <SettingsIcon size={24} />
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            {!isAuthPage && (
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  {location.pathname === '/movies' ? 'Movies' : 
                   location.pathname === '/search' ? 'Global Search' :
                   location.pathname === '/tv' ? 'TV Shows' : 
                   location.pathname === '/mypage' ? 'My Page' : 'Settings'}
                </h1>
              </div>
            )}
            
            <Routes>
              {/* 사이트 접속 시 첫 화면을 로그인 페이지로 설정 */}
              <Route path="/" element={<LoginPage />} />
              {/* [추가됨] 마이페이지에서 로그아웃 시 /login으로 오기 때문에 이 경로도 열어둡니다 */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              <Route path="/movies" element={<MoviesPage searchTerm={searchTerm} />} />
              <Route path="/search" element={<GlobalSearchPage />} />
              <Route path="/tv" element={<TvShowsPage />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/settings" element={<Settings />} /> 
              
              {/* 잘못된 경로로 오면 기본 로그인 화면(/)으로 보냅니다 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {!isAuthPage && location.pathname !== '/settings' && location.pathname !== '/mypage' && (
            <div className="w-80 bg-white border-l p-6 hidden lg:block overflow-y-auto">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold cursor-pointer" onClick={() => navigate('/mypage')}>U</div>
                <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 flex items-center">
                  <Search size={18} className="text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search movies..." 
                    className="bg-transparent text-sm outline-none w-full" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
