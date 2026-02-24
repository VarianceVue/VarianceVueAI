
import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, List, Sliders, Gauge, GanttChartSquare,
  LogOut, HelpCircle, FolderDown, Calendar, DollarSign, Activity,
  AlertTriangle, CheckCircle2, FileEdit, Star, Monitor, ClipboardList,
  PenTool, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  clientName: string;
}

type NavLevel = 'top' | 'cpm' | 'workspace';

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ size?: number }>;
  hasChildren?: boolean;
  comingSoon?: boolean;
}

const topNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'priorities', label: 'PCM Priorities', icon: Star, comingSoon: true },
  { id: '_cpm', label: 'CPM Schedule', icon: Calendar, hasChildren: true },
  { id: '_cost', label: 'Cost & Financials', icon: DollarSign, comingSoon: true },
  { id: '_evm', label: 'EVM Intelligence', icon: Activity, comingSoon: true },
  { id: '_risk', label: 'Risk & QRAs', icon: AlertTriangle, comingSoon: true },
  { id: '_cx', label: 'Cx & Turnover', icon: CheckCircle2, comingSoon: true },
  { id: '_change', label: 'Change Control', icon: FileEdit, comingSoon: true },
];

const cpmNavItems: NavItem[] = [
  { id: '_workspace', label: 'Schedule Workspace', icon: Monitor, hasChildren: true },
  { id: 'baseline-review', label: 'Contractor Baseline Review', icon: ClipboardList, comingSoon: true },
  { id: 'narrative-review', label: 'Baseline Narrative Review', icon: PenTool, comingSoon: true },
  { id: 'updates', label: 'Updates', icon: RefreshCw, comingSoon: true },
];

const workspaceNavItems: NavItem[] = [
  { id: 'philosophy', label: 'Schedule Philosophy', icon: Sliders },
  { id: 'ingestion', label: 'Ingestion', icon: FileText },
  { id: 'cpm-list', label: 'Activity List', icon: List },
  { id: 'audit', label: 'Health Audit', icon: Gauge },
  { id: 'gantt', label: 'Gantt View', icon: GanttChartSquare },
];

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, clientName }) => {
  const [navLevel, setNavLevel] = useState<NavLevel>('top');

  const currentItems = navLevel === 'top' ? topNavItems
    : navLevel === 'cpm' ? cpmNavItems
    : workspaceNavItems;

  const handleItemClick = (item: NavItem) => {
    if (item.comingSoon) return;
    if (item.id === '_cpm') { setNavLevel('cpm'); return; }
    if (item.id === '_workspace') { setNavLevel('workspace'); return; }
    setActiveTab(item.id);
  };

  const handleBack = () => {
    if (navLevel === 'workspace') setNavLevel('cpm');
    else if (navLevel === 'cpm') setNavLevel('top');
  };

  const sectionLabel = navLevel === 'cpm' ? 'CPM Schedule Intelligence'
    : navLevel === 'workspace' ? 'Schedule Workspace'
    : 'Intelligence Modules';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Inter']">
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
            <span className="text-blue-500">Vue</span>Logic
          </h1>
          <p className="text-[9px] text-slate-500 mt-2 uppercase tracking-[0.4em] font-black italic">Project Controls Intelligence</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navLevel !== 'top' && (
            <button onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:bg-slate-800 rounded-xl transition-all">
              <ChevronLeft size={14} /> Back
            </button>
          )}
          <div className="px-3 pt-2 pb-1 text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-600">{sectionLabel}</div>
          {currentItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                item.comingSoon ? 'text-slate-600 cursor-default opacity-50'
                : activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.hasChildren && <ChevronRight size={14} className="text-slate-600" />}
              {item.comingSoon && <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">Soon</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-3 text-[10px] font-bold uppercase text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-12 shadow-sm z-40">
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">
              {[...topNavItems, ...cpmNavItems, ...workspaceNavItems].find(i => i.id === activeTab)?.label || activeTab}
            </h2>
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
