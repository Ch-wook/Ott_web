import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = ({ isDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const user = existingUsers.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/home');
    } else {
      alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  const bg = isDarkMode ? 'bg-[#050507]' : 'bg-[#eef1f8]';
  const cardBg = isDarkMode
    ? 'bg-white/5 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]'
    : 'bg-white/70 border-white/60 shadow-[0_40px_100px_rgba(99,102,241,0.08)] shadow-slate-200/60';
  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const subtitleColor = isDarkMode ? 'text-slate-500' : 'text-slate-500';
  const labelColor = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const inputClass = isDarkMode
    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-indigo-500/10 focus:bg-white/10'
    : 'bg-white/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400/60 focus:ring-indigo-400/10 focus:bg-white';
  const btnClass = isDarkMode
    ? 'bg-white text-[#050507] hover:shadow-indigo-500/20'
    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20';
  const linkColor = isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500';
  const footerColor = isDarkMode ? 'text-slate-500' : 'text-slate-500';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bg} font-sans relative overflow-hidden p-6`}>
      <div className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none ${isDarkMode ? 'bg-indigo-600/20 animate-pulse' : 'bg-indigo-400/10'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none ${isDarkMode ? 'bg-emerald-600/10' : 'bg-violet-400/8'}`} />

      <div className={`backdrop-blur-[80px] p-12 lg:p-16 rounded-[4rem] border w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-1000 ${cardBg}`}>
        <div className="flex justify-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[2.5rem] shadow-[0_0_40px_rgba(79,70,229,0.4)] flex items-center justify-center text-white text-4xl font-black hover:scale-110 transition-transform duration-500 cursor-default">
            SP
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className={`text-4xl font-black ${titleColor} mb-3 tracking-tighter`}>SyncPlay</h2>
          <p className={`${subtitleColor} font-bold uppercase tracking-[0.2em] text-xs`}>최고의 몰입감을 선사하는 OTT 라이브러리</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2.5">
            <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>이메일 계정</label>
            <input
              type="email"
              placeholder="example@email.com"
              className={`w-full px-8 py-5 rounded-[2rem] border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2.5">
            <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>보안 비밀번호</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full px-8 py-5 rounded-[2rem] border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`w-full font-black py-5 rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all active:scale-95 mt-8 text-lg ${btnClass}`}
          >
            로그인하기
          </button>
        </form>

        <p className={`mt-12 text-center text-sm ${footerColor} font-bold`}>
          처음이신가요?{' '}
          <Link to="/signup" className={`${linkColor} transition-colors underline-offset-4 hover:underline`}>
            회원가입 하기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
