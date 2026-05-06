import React from 'react';
import { Settings as SettingsIcon, Bell, Lock, Share2, Sun, Moon, Monitor, Palette, ChevronRight } from 'lucide-react';

const Settings = ({ isDarkMode, toggleTheme }) => {
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const textMuted = isDarkMode ? "text-slate-600" : "text-slate-400";

  const glass = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
    : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-100/30";

  const accentBg = isDarkMode ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50/80 border-indigo-200/60";
  const accent = isDarkMode ? "text-indigo-400" : "text-indigo-600";

  const settingsItems = [
    {
      icon: <Bell size={18} />,
      title: "알림 설정",
      desc: "시청 중인 콘텐츠의 업데이트 소식을 받습니다",
      color: isDarkMode ? "text-blue-400" : "text-blue-500",
      bg: isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200/60",
    },
    {
      icon: <Lock size={18} />,
      title: "보안 및 계정",
      desc: "비밀번호 변경 및 보안 설정을 관리합니다",
      color: isDarkMode ? "text-emerald-400" : "text-emerald-600",
      bg: isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200/60",
    },
    {
      icon: <Share2 size={18} />,
      title: "서비스 연동",
      desc: "Netflix, Disney+ 등 외부 계정을 관리합니다",
      color: isDarkMode ? "text-violet-400" : "text-violet-600",
      bg: isDarkMode ? "bg-violet-500/10 border-violet-500/20" : "bg-violet-50 border-violet-200/60",
    },
  ];

  return (
    <div className="w-full animate-in fade-in duration-700">
      <div className="max-w-4xl space-y-5">

        {/* 화면 설정 */}
        <div className={`${glass} rounded-3xl p-10`}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentBg} ${accent}`}>
                <Palette size={17} />
              </div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>화면 설정</h3>
            </div>
            <p className={`text-[10px] ${textMuted} font-bold uppercase tracking-[0.15em] ml-12`}>테마 및 디스플레이 옵션</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 테마 토글 카드 */}
            <div
              onClick={toggleTheme}
              className={`p-8 rounded-2xl border transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                isDarkMode
                  ? "bg-white/[0.04] border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-500/5"
                  : "bg-white/60 border-slate-200/60 hover:border-indigo-400/50 hover:bg-indigo-50/30"
              }`}
              style={{ minHeight: '160px' }}
            >
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-amber-50 border-amber-200/60 text-amber-500'}`}>
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? "bg-indigo-500" : "bg-slate-300"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>
              <div>
                <h4 className={`text-base font-bold ${textPrimary} tracking-tight`}>{isDarkMode ? "다크 모드" : "라이트 모드"}</h4>
                <p className={`text-[10px] font-bold ${textMuted} mt-1 uppercase tracking-widest`}>클릭하여 테마 전환</p>
              </div>
            </div>

            {/* 시스템 자동 설정 (비활성) */}
            <div
              className={`p-8 rounded-2xl border flex flex-col justify-between opacity-40 ${isDarkMode ? "bg-white/[0.02] border-white/[0.06]" : "bg-white/40 border-slate-200/50"}`}
              style={{ minHeight: '160px' }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDarkMode ? 'bg-white/[0.04] border-white/[0.08] text-slate-500' : 'bg-slate-100 border-slate-200/60 text-slate-400'}`}>
                <Monitor size={18} />
              </div>
              <div>
                <h4 className={`text-base font-bold ${textPrimary} tracking-tight`}>시스템 자동 설정</h4>
                <p className={`text-[10px] font-bold ${textMuted} mt-1 uppercase tracking-widest`}>운영체제 설정에 따라 자동 전환</p>
              </div>
            </div>
          </div>
        </div>

        {/* 애플리케이션 설정 */}
        <div className={`${glass} rounded-3xl p-10`}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentBg} ${accent}`}>
                <SettingsIcon size={17} />
              </div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>애플리케이션 설정</h3>
            </div>
            <p className={`text-[10px] ${textMuted} font-bold uppercase tracking-[0.15em] ml-12`}>알림, 보안 및 서비스 연동</p>
          </div>

          <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-200/50'}`}>
            {settingsItems.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between px-6 py-5 cursor-pointer group transition-all duration-200
                  ${index !== settingsItems.length - 1 ? `border-b ${isDarkMode ? 'border-white/[0.05]' : 'border-slate-200/50'}` : ''}
                  ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/60'}
                `}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${textPrimary} tracking-tight`}>{item.title}</p>
                    <p className={`text-[10px] font-bold ${textMuted} mt-0.5 uppercase tracking-widest`}>{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={`${textMuted} group-hover:${accent} group-hover:translate-x-0.5 transition-all shrink-0`} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
