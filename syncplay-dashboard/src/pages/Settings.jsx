// src/pages/Settings.jsx
import React from 'react';
import { Settings as SettingsIcon, Bell, Lock, Share2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8090';
const PLATFORM_OPTIONS = [
  'Netflix',
  'Disney Plus',
  'Coupang Play',
  'Wavve',
  'Watcha',
  'Apple TV Plus',
  'Amazon Prime Video'
];

const Settings = () => {
  return (
    <div className="w-full">
      <div className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <SettingsIcon className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Application Settings</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {[
              { icon: <Bell size={20} />, title: "Notification", desc: "Configure how you receive alerts" },
              { icon: <Lock size={20} />, title: "Security", desc: "Update password and 2FA settings" },
              { icon: <Share2 size={20} />, title: "OTT Integration", desc: "Manage Netflix, Disney+ connections" },
            ].map((item, index) => (
              <div key={index} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-xl">›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;