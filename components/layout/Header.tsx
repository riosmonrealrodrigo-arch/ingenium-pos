'use client';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface HeaderProps { title: string; subtitle?: string; actions?: React.ReactNode; }

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { profile, business } = useAuth();
  return (
    <header className="bg-white border-b border-gray-100 px-3.5 lg:px-5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-lg font-black text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        {actions}
        <button className="p-1.5 rounded-full hover:bg-gray-100 transition relative text-gray-500 hover:text-gray-700">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.name} width={28} height={28} className="rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-black shadow-xs">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold text-gray-800 leading-tight">{profile?.name}</p>
            <p className="text-[9.5px] text-gray-400 leading-tight capitalize">{profile?.role} · {business?.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
