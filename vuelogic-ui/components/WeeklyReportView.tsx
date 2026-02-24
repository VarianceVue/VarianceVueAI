
import React from 'react';
import { WeeklyReport } from '../types';
import { Calendar, Trophy, AlertCircle, FastForward, FileText, ClipboardCheck } from 'lucide-react';

interface WeeklyReportViewProps {
  reports: WeeklyReport[];
  onGenerate: () => void;
  isGenerating: boolean;
}

const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({ reports, onGenerate, isGenerating }) => {
  const latest = reports[reports.length - 1];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="bg-slate-900 p-16 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <h4 className="text-6xl font-black uppercase tracking-tighter leading-none mb-4">Weekly <br/><span className="text-blue-500">Pulse Report</span></h4>
          <p className="text-slate-400 font-bold max-w-md">Immediate progress tracking, recent wins, and the 14-day lookahead focus.</p>
        </div>
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="relative z-10 px-12 py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-blue-900/40 transition-all flex items-center gap-6 group"
        >
          {isGenerating ? <ClipboardCheck className="animate-pulse" /> : <ClipboardCheck />}
          {isGenerating ? 'Synthesizing...' : 'Generate Weekly Update'}
        </button>
      </div>

      {!latest ? (
        <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
           <Calendar size={80} className="mx-auto text-slate-100 mb-8" />
           <p className="text-slate-300 font-black uppercase tracking-[0.5em] text-sm">No Weekly Pulses Generated</p>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in zoom-in-95">
          {/* Main Summary */}
          <div className="bg-white p-16 rounded-[4.5rem] border border-slate-200 shadow-sm space-y-8">
            <h5 className="text-xl font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
              <Calendar size={20} /> Week of {new Date(latest.date).toLocaleDateString()}
            </h5>
            <p className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{latest.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Wins */}
             <div className="bg-emerald-50 p-12 rounded-[3.5rem] border border-emerald-100 space-y-8">
                <h6 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-3">
                   <Trophy size={16} /> Immediate Wins
                </h6>
                <div className="space-y-4">
                   {latest.immediateWins.map((win, i) => (
                     <div key={i} className="bg-white p-6 rounded-2xl shadow-sm font-bold text-slate-700">
                        {win}
                     </div>
                   ))}
                </div>
             </div>

             {/* Blockers */}
             <div className="bg-rose-50 p-12 rounded-[3.5rem] border border-rose-100 space-y-8">
                <h6 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-3">
                   <AlertCircle size={16} /> Blockers / Risks
                </h6>
                <div className="space-y-4">
                   {latest.blockers.map((blocker, i) => (
                     <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-rose-500">
                        <div className="font-black text-slate-800 uppercase text-sm mb-1">{blocker.activityName}</div>
                        <div className="text-sm font-bold text-slate-500">{blocker.impact}</div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Lookahead */}
          <div className="bg-slate-900 p-16 rounded-[4.5rem] text-white shadow-2xl space-y-10">
             <h5 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-6"><FastForward className="text-blue-500" /> 14-Day Lookahead Goals</h5>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latest.lookaheadGoals.map((goal, i) => (
                  <div key={i} className="flex items-start gap-4">
                     <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center font-black text-blue-500 shrink-0">{i+1}</div>
                     <p className="font-bold text-slate-300 pt-1">{goal}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Raw Text Block */}
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><FileText size={16} /> Narrative Clipboard</h5>
             </div>
             <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 font-mono text-sm text-slate-600 whitespace-pre-wrap select-all cursor-copy">
                {latest.fullNarrative}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReportView;
