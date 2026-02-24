
import React from 'react';
import { LayoutDashboard, FileText, List, BookOpen, Sliders, Gauge, GanttChartSquare, LogOut, HelpCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  clientName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, clientName }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'guide', label: 'Ops Manual', icon: BookOpen },
    { id: 'philosophy', label: 'Philosophy', icon: Sliders },
    { id: 'ingestion', label: 'Ingestion', icon: FileText },
    { id: 'cpm-list', label: 'Activity List', icon: List },
    { id: 'audit', label: 'Health Audit', icon: Gauge },
    { id: 'gantt', label: 'Gantt View', icon: GanttChartSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Inter']">
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
            <span className="text-blue-500">Vue</span>Logic
          </h1>
          <p className="text-[9px] text-slate-500 mt-2 uppercase tracking-[0.4em] font-black italic">Industrial Specialist</p>
        </div>
        
        <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40' 
                : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-800 bg-slate-950/30">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 text-[11px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-12 shadow-sm z-40">
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">{navItems.find(i => i.id === activeTab)?.label}</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{clientName}</span>
          </div>
          <button onClick={() => setActiveTab('guide')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all">
            <HelpCircle size={14} /> Operations Guide
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
