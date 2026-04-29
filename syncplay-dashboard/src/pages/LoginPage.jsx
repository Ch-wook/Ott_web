import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // 저장된 사용자 정보 확인
    const savedUser = JSON.parse(localStorage.getItem('user'));

    if (savedUser && savedUser.email === email && savedUser.password === password) {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/movies');
    } else {
      alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl shadow-md flex items-center justify-center text-white text-2xl font-bold">SP</div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Sign in to SyncPlay</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" placeholder="Email Address" className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Sign In</button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? <Link to="/signup" className="text-blue-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;