import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    // 로컬 스토리지에 사용자 정보 저장
    const userData = { name, email, password };
    localStorage.setItem('user', JSON.stringify(userData));
    
    alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans py-12">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl shadow-md flex items-center justify-center text-white text-xl font-bold">SP</div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Create an Account</h2>
        <form onSubmit={handleSignup} className="space-y-5">
          <input type="text" placeholder="Full Name" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="email" placeholder="Email Address" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="Confirm Password" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md mt-4">Sign Up</button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;