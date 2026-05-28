'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Activity, LogOut, LayoutDashboard, MonitorPlay, Shield, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check system/local storage preference on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = 
        localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Toggle Dark Mode function
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  if (!user) return null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-extrabold text-2xl tracking-tight">
          <Activity className="h-6 w-6 animate-pulse" />
          <span>HAQMS</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/queue"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <MonitorPlay className="h-4 w-4" />
            Live Queue
          </Link>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          
          {/* Dark Mode Toggle Button */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Shield className="h-3 w-3" />
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 focus:outline-none"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}