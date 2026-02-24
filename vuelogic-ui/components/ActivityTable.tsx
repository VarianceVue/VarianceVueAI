
import React from 'react';
import { Activity } from '../types';
import { ShieldCheck, Clock, Layers } from 'lucide-react';

interface ActivityTableProps {
  activities: Activity[];
}

const ActivityTable: React.FC<ActivityTableProps> = ({ activities }) => {
  const safeActivities = activities || [];

  if (safeActivities.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem] space-y-8">
         <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Layers size={48} className="text-slate-200" />
         </div>
         <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-sm">No Activities Extracted</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] first:rounded-tl-[3rem]">Activity ID</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em]">Activity Name</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-center">Dur (d)</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em]">Predecessors & Lags</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-center last:rounded-tr-[3rem]">TF (d)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-['Inter']">
            {safeActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activity.isCritical ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-slate-200'}`}></div>
                      <span className="font-black text-xs text-blue-600 tracking-tight">{activity.id}</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex flex-col">
                      <span className="font-black text-slate-800 uppercase tracking-tighter text-sm group-hover:text-blue-600 transition-colors">{activity.name}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activity.wbsCode}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                      <Clock size={12} className="text-slate-400" />
                      <span className="font-black text-xs text-slate-700">{activity.durationDays}</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex flex-wrap gap-2">
                      {activity.predecessors?.length > 0 ? (
                        activity.predecessors.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-500 hover:border-blue-300 transition-all">
                             <span className="text-blue-500">{p.activityId}</span>
                             <span className="opacity-40">|</span>
                             <span>{p.type}</span>
                             {p.lag !== 0 && (
                               <span className={p.lag < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                                 {p.lag > 0 ? `+${p.lag}` : p.lag}d
                               </span>
                             )}
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                           <ShieldCheck size={12} className="text-rose-300" /> Start / Open
                        </span>
                      )}
                   </div>
                </td>
                <td className="px-8 py-5 text-center">
                   <span className={`text-xs font-black ${activity.totalFloatDays === 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {activity.totalFloatDays}d
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityTable;
