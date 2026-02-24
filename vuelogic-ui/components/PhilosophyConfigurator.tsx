
import React from 'react';
import { SchedulingPhilosophy, NarrativeTone } from '../types';
import { Scale, ToggleLeft, ToggleRight, Sliders, Info, ShieldCheck, Zap } from 'lucide-react';

interface PhilosophyConfiguratorProps {
  philosophy: SchedulingPhilosophy;
  onChange: (newPhilosophy: SchedulingPhilosophy) => void;
}

const PhilosophyConfigurator: React.FC<PhilosophyConfiguratorProps> = ({ philosophy, onChange }) => {
  const toggle = (key: keyof SchedulingPhilosophy) => {
    onChange({ ...philosophy, [key]: !philosophy[key] });
  };

  const update = (key: keyof SchedulingPhilosophy, value: any) => {
    onChange({ ...philosophy, [key]: value });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="bg-slate-900 p-16 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <h4 className="text-6xl font-black uppercase tracking-tighter leading-none mb-4">Philosophy <br/><span className="text-blue-500 text-4xl">Engine Configuration</span></h4>
          <p className="text-slate-400 font-bold max-w-md">Calibrate the agent's CPM logic auditing thresholds and narrative personality to match your professional standards.</p>
        </div>
        <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <Sliders size={64} className="text-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logic Rules */}
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
          <h5 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-4">
            <Scale size={16} /> Logic Compliance Rules
          </h5>
          
          <div className="space-y-6">
            <button 
              onClick={() => toggle('leadRestriction')}
              className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${philosophy.leadRestriction ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-tight">Negative Lag Restriction</div>
                <div className="text-[10px] text-slate-400 font-bold">Leads are forbidden in CPM networks.</div>
              </div>
              {philosophy.leadRestriction ? <ToggleRight size={40} className="text-blue-600" /> : <ToggleLeft size={40} className="text-slate-300" />}
            </button>

            <button 
              onClick={() => toggle('sfRelationshipRestriction')}
              className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${philosophy.sfRelationshipRestriction ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-tight">SF Relationship Ban</div>
                <div className="text-[10px] text-slate-400 font-bold">Start-to-Finish ties flag as a failure.</div>
              </div>
              {philosophy.sfRelationshipRestriction ? <ToggleRight size={40} className="text-blue-600" /> : <ToggleLeft size={40} className="text-slate-300" />}
            </button>

            <button 
              onClick={() => toggle('hardConstraintRestriction')}
              className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${philosophy.hardConstraintRestriction ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-tight">Hard Constraint Audit</div>
                <div className="text-[10px] text-slate-400 font-bold">Prioritize logic-driven float over MSO constraints.</div>
              </div>
              {philosophy.hardConstraintRestriction ? <ToggleRight size={40} className="text-blue-600" /> : <ToggleLeft size={40} className="text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Thresholds & Tone */}
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
          <h5 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-4">
            <Zap size={16} /> Synthesis & Thresholds
          </h5>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">High Float Threshold (Days)</label>
              <input 
                type="range" min="10" max="60" step="1"
                value={philosophy.maxFloatDays}
                onChange={(e) => update('maxFloatDays', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                <span>10 Days</span>
                <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{philosophy.maxFloatDays} Days</span>
                <span>60 Days</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Agent Narrative Tone</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Executive', 'Technical', 'Aggressive', 'Conservative'] as NarrativeTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => update('narrativeTone', tone)}
                    className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${philosophy.narrativeTone === tone ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                <Info size={24} className="text-blue-500 shrink-0" />
                <p className="text-xs font-bold text-blue-800 leading-relaxed italic">The agent will automatically use these parameters as "System Priors" for all document analysis and report synthesis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
         <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-white px-8 py-4 rounded-full border border-slate-200 shadow-sm">
            <ShieldCheck size={16} className="text-emerald-500" /> AES-256 Workspace Calibration Locked
         </div>
      </div>
    </div>
  );
};

export default PhilosophyConfigurator;
