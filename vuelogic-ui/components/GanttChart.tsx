
import React, { useMemo } from 'react';
import { Activity } from '../types';

interface GanttChartProps {
  activities: Activity[];
}

const GanttChart: React.FC<GanttChartProps> = ({ activities }) => {
  const scheduledActivities = useMemo(() => {
    const safeActivities = Array.isArray(activities) ? activities : [];
    const actMap = new Map<string, Activity>();
    safeActivities.forEach(a => actMap.set(a.id, { ...a }));

    const getEarlyStart = (id: string, visited: Set<string> = new Set()): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const act = actMap.get(id);
      if (!act || !Array.isArray(act.predecessors) || act.predecessors.length === 0) return 0;

      let maxFinish = 0;
      act.predecessors.forEach(p => {
        const pred = actMap.get(p.activityId);
        if (pred) {
          const predStart = getEarlyStart(p.activityId, visited);
          const predFinish = predStart + (Number(pred.durationDays) || 0) + (Number(p.lag) || 0);
          maxFinish = Math.max(maxFinish, predFinish);
        }
      });
      return maxFinish;
    };

    return safeActivities.map(a => ({
      ...a,
      startDay: getEarlyStart(a.id),
    })).sort((a, b) => (a.startDay || 0) - (b.startDay || 0));
  }, [activities]);

  const maxDays = useMemo(() => {
    if (scheduledActivities.length === 0) return 30;
    return Math.max(...scheduledActivities.map(a => (a.startDay || 0) + (Number(a.durationDays) || 0)), 30);
  }, [scheduledActivities]);

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl overflow-x-auto">
      <div className="min-w-[800px] space-y-6">
        <div className="flex border-b border-slate-100 pb-4">
          <div className="w-64 font-black text-slate-300 text-[9px] uppercase tracking-widest">Assignment</div>
          <div className="flex-1 relative h-4">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="absolute text-[8px] text-slate-400 font-black uppercase tracking-widest border-l border-slate-100 pl-2 h-full" style={{ left: `${(i * 20)}%` }}>
                 Node {i + 1}
               </div>
             ))}
          </div>
        </div>

        {scheduledActivities.map((activity) => (
          <div key={activity.id} className="flex items-center group">
            <div className="w-64 pr-4">
              <div className="text-[11px] font-black truncate text-slate-800 uppercase tracking-tight">{activity.name}</div>
              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{activity.id}</div>
            </div>
            <div className="flex-1 h-8 relative rounded-lg bg-slate-50 border border-slate-100">
              <div 
                className={`absolute h-4 top-2 rounded-md text-[8px] font-black text-white flex items-center justify-center px-2 ${activity.isCritical ? 'bg-rose-500' : 'bg-blue-600'}`}
                style={{
                  left: `${((activity.startDay || 0) / maxDays) * 100}%`,
                  width: `${(Math.max(1, Number(activity.durationDays) || 1) / maxDays) * 100}%`
                }}
              >
                {activity.durationDays}d
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GanttChart;
