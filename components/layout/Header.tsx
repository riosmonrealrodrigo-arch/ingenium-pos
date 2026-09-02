'use client';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface HeaderProps { title: string; subtitle?: string; actions?: React.ReactNode; }

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { profile, business } = useAuth();
  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div>
        <h1 className="text-xl font-black text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="p-2 rounded-full hover:bg-gray-100 transition relative">
          <Bell size={20} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.name} width={32} height={32} className="rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-sm font-black">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-gray-800 leading-tight">{profile?.name}</p>
            <p className="text-[10px] text-gray-400 leading-tight capitalize">{profile?.role} · {business?.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
