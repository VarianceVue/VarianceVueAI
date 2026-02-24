
import React from 'react';
import { ScheduleHealthSummary, DCMAAuditPoint } from '../types';
import { ShieldCheck, ShieldAlert, ShieldX, Info, CheckCircle2, AlertTriangle, XCircle, Gauge, ArrowRight } from 'lucide-react';

interface HealthScorecardProps {
  summary: ScheduleHealthSummary | undefined;
}

const HealthScorecard: React.FC<HealthScorecardProps> = ({ summary }) => {
  // Guard against undefined summary (common in fresh workspaces)
  if (!summary) {
    return (
      <div className="max-w-5xl mx-auto py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem] space-y-8 animate-in fade-in duration-500">
         <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Gauge size={48} className="text-slate-200" />
         </div>
         <div className="space-y-2">
            <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-sm">Network Audit Not Yet Generated</p>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Please sync project artifacts in the Ingestion tab to run the first logic health check.</p>
         </div>
      </div>
    );
  }

  const getIcon = (status: DCMAAuditPoint['status']) => {
    switch (status) {
      case 'Pass': return <CheckCircle2 className="text-emerald-500" size={24} />;
      case 'Warning': return <AlertTriangle className="text-amber-500" size={24} />;
      case 'Fail': return <XCircle className="text-rose-500" size={24} />;
    }
  };

  const getStatusColor = (status: DCMAAuditPoint['status']) => {
    switch (status) {
      case 'Pass': return 'border-emerald-100 bg-emerald-50/50 text-emerald-700';
      case 'Warning': return 'border-amber-100 bg-amber-50/50 text-amber-700';
      case 'Fail': return 'border-rose-100 bg-rose-50/50 text-rose-700';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Score */}
      <div className="bg-slate-900 rounded-[4rem] p-16 text-white flex flex-col md:flex-row items-center gap-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 w-48 h-48 rounded-full border-[12px] border-slate-800 flex flex-col items-center justify-center shadow-inner">
           <div className="text-6xl font-black tracking-tighter">{summary.overallHealthScore || 0}%</div>
           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Logic Integrity</div>
        </div>
        <div className="relative z-10 flex-1 space-y-4">
           <h3 className="text-5xl font-black uppercase tracking-tighter">DCMA-14 <br/><span className="text-blue-500 text-4xl">Logic Audit Scorecard</span></h3>
           <p className="text-slate-400 font-bold max-w-lg">Agentic analysis of CPM network health. Metrics derived from raw task logic relationships and constraint profiling.</p>
        </div>
      </div>

      {/* Audit Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {summary.dcmaPoints?.map((point, idx) => (
          <div key={idx} className={`p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] ${getStatusColor(point.status)} shadow-sm flex flex-col justify-between`}>
             <div>
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-white rounded-2xl shadow-sm">{getIcon(point.status)}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Threshold: {point.threshold}</div>
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tight mb-2 leading-none">{point.name}</h4>
                <p className="text-xs font-bold opacity-70 leading-relaxed mb-6">{point.description}</p>
             </div>
             <div className="flex items-end justify-between border-t border-current/10 pt-6">
                <div className="text-4xl font-black tracking-tighter">{point.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full border border-current/20">Metric Count</div>
             </div>
          </div>
        ))}
        {(!summary.dcmaPoints || summary.dcmaPoints.length === 0) && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[4rem] border-2 border-slate-100">
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">No Audit Detail Records Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthScorecard;
