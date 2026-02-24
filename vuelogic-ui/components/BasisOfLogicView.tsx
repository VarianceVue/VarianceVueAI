
import React from 'react';
import { BasisOfLogic } from '../types';
import { Scale, Link2, Share2, CornerDownRight } from 'lucide-react';

interface BasisOfLogicViewProps {
  data: BasisOfLogic[] | undefined;
}

const BasisOfLogicView: React.FC<BasisOfLogicViewProps> = ({ data }) => {
  const safeData = data || [];

  return (
    <div className="space-y-12">
      {safeData.map((item, idx) => (
        <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-lg overflow-hidden border-l-[12px] border-l-slate-900 group hover:shadow-2xl transition-all">
          <div className="p-10 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">{item.wbsLevel2Code}</div>
              <h5 className="text-3xl font-black tracking-tighter uppercase text-slate-800">{item.wbsLevel2Name}</h5>
            </div>
            <span className="px-6 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-inner">Strategic Control Reasoning</span>
          </div>
          <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest"><Link2 size={16} className="text-blue-500" /> Sequencing Basis</div>
              <p className="text-slate-600 font-bold leading-relaxed italic border-l-4 border-blue-50 pl-6 bg-slate-50/30 p-4 rounded-r-2xl">{item.logicBasis}</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest"><Share2 size={16} className="text-emerald-500" /> Handoff Strategy</div>
              <p className="text-slate-700 font-bold leading-relaxed">{item.handoffLogic}</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest"><Scale size={16} className="text-amber-500" /> Cross-Branch Ties</div>
              <p className="text-slate-700 font-bold leading-relaxed">{item.crossWbsDependencies}</p>
            </div>
          </div>
        </div>
      ))}
      {safeData.length === 0 && (
        <div className="py-40 text-center text-slate-200 font-black text-2xl uppercase tracking-[0.4em]">Basis of Logic documents not yet extracted.</div>
      )}
    </div>
  );
};

export default BasisOfLogicView;
