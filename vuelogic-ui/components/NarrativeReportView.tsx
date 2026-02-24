
import React, { useState } from 'react';
import { NarrativeReport } from '../types';
import { FileText, Calendar, ArrowRight, Zap, Target, TrendingDown, ClipboardList, CheckCircle2, XCircle, Edit3, Save } from 'lucide-react';

interface NarrativeReportViewProps {
  reports: NarrativeReport[];
  onGenerate: () => void;
  onApprove: (reportId: string, updatedReport: NarrativeReport) => void;
  onReject: (reportId: string) => void;
  isGenerating: boolean;
}

const NarrativeReportView: React.FC<NarrativeReportViewProps> = ({ reports, onGenerate, onApprove, onReject, isGenerating }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<NarrativeReport | null>(null);

  const drafts = reports.filter(r => r.status === 'draft');
  const approved = reports.filter(r => r.status === 'approved');

  const handleStartEdit = (report: NarrativeReport) => {
    setEditingId(report.id);
    setEditContent({ ...report });
  };

  const handleSaveEdit = () => {
    if (editingId && editContent) {
      onApprove(editingId, editContent);
      setEditingId(null);
      setEditContent(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="bg-slate-900 p-16 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h4 className="text-6xl font-black uppercase tracking-tighter leading-none mb-4">Governance <br/><span className="text-emerald-500">Staging Area</span></h4>
          <p className="text-slate-400 font-bold max-w-md">Review and edit agent drafts before final approval. Human-in-the-loop ensures professional accuracy.</p>
        </div>
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="relative z-10 px-12 py-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-emerald-900/40 transition-all flex items-center gap-6 group"
        >
          {isGenerating ? <Zap className="animate-spin" /> : <ClipboardList />}
          {isGenerating ? 'Synthesizing...' : 'Initiate New Draft'}
        </button>
      </div>

      {/* Staging Area for Drafts */}
      {drafts.length > 0 && (
        <div className="space-y-10">
          <h5 className="text-[12px] font-black text-amber-500 uppercase tracking-[0.5em] flex items-center gap-4">
            <Edit3 size={16} /> Pending Review (Human-in-the-Loop)
          </h5>
          {drafts.map((report) => (
            <div key={report.id} className="bg-amber-50/50 border-2 border-amber-200 p-12 rounded-[4rem] shadow-xl space-y-8 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-amber-200 pb-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-amber-500 text-white rounded-3xl flex items-center justify-center font-black text-2xl">DRAFT</div>
                   <h5 className="text-3xl font-black uppercase tracking-tighter text-amber-900">Monthly Status Draft</h5>
                </div>
                <div className="flex gap-4">
                   <button 
                    onClick={() => handleStartEdit(report)}
                    className="p-4 bg-white border border-amber-200 rounded-2xl text-amber-600 hover:bg-amber-100 transition-all"
                   >
                     <Edit3 size={24} />
                   </button>
                   <button 
                    onClick={() => onApprove(report.id, report)}
                    className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all"
                   >
                     <CheckCircle2 size={24} />
                   </button>
                   <button 
                    onClick={() => onReject(report.id)}
                    className="p-4 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all"
                   >
                     <XCircle size={24} />
                   </button>
                </div>
              </div>

              {editingId === report.id ? (
                <div className="space-y-6">
                  <textarea 
                    className="w-full h-64 p-8 bg-white border-2 border-amber-300 rounded-[2.5rem] font-bold text-slate-800 text-xl focus:outline-none focus:border-blue-500"
                    value={editContent?.executiveSummary}
                    onChange={e => setEditContent(prev => prev ? ({...prev, executiveSummary: e.target.value}) : null)}
                    placeholder="Refine Executive Summary..."
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSaveEdit}
                      className="bg-slate-900 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-3"
                    >
                      <Save size={16} /> Save Changes & Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-2xl font-bold text-amber-900/70 italic">{report.executiveSummary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.criticalPathShifts.slice(0, 2).map((s, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-[2rem] border border-amber-200">
                        <div className="text-[10px] font-black text-amber-500 uppercase mb-2">{s.activityName}</div>
                        <div className="text-sm font-bold text-slate-600">{s.reasoning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approved History */}
      <div className="space-y-12">
        <h5 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-4">
          <CheckCircle2 size={16} className="text-emerald-500" /> Final Approved Narratives
        </h5>
        {approved.length === 0 && !drafts.length && (
          <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
             <FileText size={80} className="mx-auto text-slate-100 mb-8" />
             <p className="text-slate-300 font-black uppercase tracking-[0.5em] text-sm">Waiting for Agent Synthesis...</p>
          </div>
        )}
        {approved.slice().reverse().map((report, i) => (
          <div key={report.id} className="bg-white p-16 rounded-[4.5rem] border border-slate-200 shadow-sm space-y-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-2xl">EXE</div>
                 <div>
                    <h5 className="text-3xl font-black uppercase tracking-tighter">Approved Narrative</h5>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: Finalized • {new Date(report.date).toLocaleDateString()}</div>
                 </div>
              </div>
              <Target className="text-blue-500" size={40} />
            </div>
            <p className="text-2xl font-bold text-slate-700 leading-relaxed italic">{report.executiveSummary}</p>
            <div className="bg-slate-50 p-10 rounded-[3rem] font-mono text-sm text-slate-600 whitespace-pre-wrap select-all cursor-copy">
              {report.fullNarrative}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NarrativeReportView;
