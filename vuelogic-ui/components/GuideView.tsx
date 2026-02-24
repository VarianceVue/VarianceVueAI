
import React from 'react';
import { 
  ShieldCheck, 
  Settings2, 
  GitPullRequest, 
  BrainCircuit, 
  Lock, 
  MessageSquare,
  FileSearch,
  CheckSquare,
  FileText,
  Workflow,
  Search,
  BookOpen
} from 'lucide-react';

const GuideView: React.FC = () => {
  const sections = [
    {
      title: "1. Workspace Isolation",
      icon: <Lock className="text-blue-500" />,
      content: "Every Client ID creates a physically isolated 'Data Vault'. The agent's memory is restricted to your specific project artifacts. Lessons learned here never leak to other clients.",
      tag: "Security"
    },
    {
      title: "2. Philosophy Calibration",
      icon: <Settings2 className="text-amber-500" />,
      content: "Before syncing data, define your 'Scheduling Philosophy'. This sets the strictness for logic audits (e.g., Lead/Lag bans) and the personality of the agent's narrative reports.",
      tag: "Configuration"
    },
    {
      title: "3. The HITL Governance Model",
      icon: <GitPullRequest className="text-emerald-500" />,
      content: "VueLogic uses a 'Human-in-the-Loop' staging area. The agent produces drafts; you review, edit, and approve. No 'official' report is ever sent to a stakeholder without your digital sign-off.",
      tag: "Governance"
    },
    {
      title: "4. Cognitive Journaling",
      icon: <BrainCircuit className="text-purple-500" />,
      content: "The system features a Semantic Feedback loop. Every manual correction you make to an agent's draft is logged. The agent analyzes these corrections to align its future reasoning with your professional 'voice'.",
      tag: "Machine Learning"
    }
  ];

  const artifactGuide = [
    {
      type: "Scope Documents",
      focus: "Milestones & Deliverables",
      desc: "The agent extracts the WBS structure and key start/finish constraints defined by the project owner.",
      icon: <FileText className="text-blue-400" />
    },
    {
      type: "Specifications",
      focus: "Logic Constraints",
      desc: "Technical specs (e.g., Division 01) are scanned for sequencing rules like 'No negative lag' or 'Pre-requisite inspections'.",
      icon: <Search className="text-purple-400" />
    },
    {
      type: "Bridging Documents",
      focus: "Logic Justification",
      desc: "Narrative documents that explain the 'Why' behind specific sequence choices. Essential for Level 3 scheduling.",
      icon: <Workflow className="text-emerald-400" />
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="text-center space-y-6">
        <h3 className="text-7xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
          Client <br/><span className="text-blue-600">Operations Manual</span>
        </h3>
        <p className="text-slate-500 font-bold text-xl max-w-2xl mx-auto uppercase tracking-tight">
          A roadmap for industrial-grade project controls and agentic schedule management.
        </p>
      </div>

      {/* Artifact Section */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10">
        <div className="flex items-center gap-4">
          <BookOpen className="text-blue-600" />
          <h4 className="text-3xl font-black uppercase tracking-tighter">Project Artifact Ingestion</h4>
        </div>
        <p className="text-slate-500 font-bold max-w-3xl uppercase text-xs tracking-widest leading-relaxed">
          VueLogic can process multiple data sources simultaneously. Use the "Network Ingestion" tab to feed the agent the following:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artifactGuide.map((a, idx) => (
            <div key={idx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                {a.icon}
              </div>
              <h5 className="font-black uppercase text-lg tracking-tighter">{a.type}</h5>
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{a.focus}</div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((s, i) => (
          <div key={i} className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              {React.cloneElement(s.icon as React.ReactElement<any>, { size: 120 })}
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  {s.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 px-4 py-1 rounded-full">{s.tag}</span>
              </div>
              <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-800">{s.title}</h4>
              <p className="text-slate-600 font-bold leading-relaxed">{s.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Visualization */}
      <div className="bg-slate-900 p-20 rounded-[5rem] text-white space-y-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="gantt-grid w-full h-full"></div>
        </div>
        
        <div className="relative z-10">
          <h4 className="text-4xl font-black uppercase tracking-tighter mb-12">The Standard Workflow</h4>
          <div className="flex flex-col md:flex-row items-start gap-10">
            {[
              { step: "01", label: "Ingest", desc: "Paste scope & bridging docs.", icon: <FileSearch /> },
              { step: "02", label: "Audit", desc: "Agent performs CPM logic scan.", icon: <CheckSquare /> },
              { step: "03", label: "Stage", desc: "Review agent-generated drafts.", icon: <GitPullRequest /> },
              { step: "04", label: "Finalize", desc: "Approve & update project journal.", icon: <ShieldCheck /> }
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex-1 space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500 flex items-center justify-center font-black text-blue-500 mb-6">{step.step}</div>
                  <div className="text-2xl font-black uppercase italic flex items-center gap-3">
                    {step.icon} {step.label}
                  </div>
                  <p className="text-slate-400 font-bold text-sm leading-snug">{step.desc}</p>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:block pt-16 text-slate-700">
                    <BrainCircuit size={24} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Support */}
      <div className="flex flex-col items-center gap-8 py-10">
        <div className="flex items-center gap-4 bg-white border border-slate-200 px-8 py-4 rounded-full shadow-sm">
          <MessageSquare className="text-blue-600" size={20} />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Still have questions? Use the Specialist Chat.</span>
        </div>
        <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">VueLogic Operational Standard v1.4.2</div>
      </div>
    </div>
  );
};

export default GuideView;
