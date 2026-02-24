
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import ActivityTable from './components/ActivityTable';
import GanttChart from './components/GanttChart';
import CostDashboard from './components/CostDashboard';
import HealthScorecard from './components/HealthScorecard';
import NarrativeReportView from './components/NarrativeReportView';
import WeeklyReportView from './components/WeeklyReportView';
import PhilosophyConfigurator from './components/PhilosophyConfigurator';
import GuideView from './components/GuideView';
import BasisOfLogicView from './components/BasisOfLogicView';
import { BackendEngine } from './services/backendBridge';
import { ProjectData, ClientSession, SchedulingPhilosophy } from './types';
import { ArrowRight, RefreshCw, Building2, Waves, FileText, AlertCircle, CheckSquare, ShieldCheck, Upload, FileCheck, MessageCircle, Send, CheckCircle, Trash2, Layers, FolderDown, Download, Save, FileDown, Camera, ClipboardList, Calendar } from 'lucide-react';

const STORAGE_KEY = 'vuelogic_project_state';

function defaultProjectData(overrides?: Partial<ProjectData>): ProjectData {
  return {
    projectName: "Project",
    activities: [],
    healthSummary: {
      overallHealthScore: 0,
      dcmaPoints: [],
      missingPredecessors: 0,
      missingSuccessors: 0,
      highFloatCount: 0,
      highDurationCount: 0,
      negativeLagCount: 0,
      sfRelationshipCount: 0,
      hardConstraintCount: 0,
    },
    journal: [],
    narrativeReports: [],
    weeklyReports: [],
    basisOfLogic: [],
    cbs: [],
    wbs: [],
    metadata: {
      clientName: "Workspace",
      clientId: "NODE-1",
      philosophy: {
        leadRestriction: true,
        maxLagDays: 0,
        maxFloatDays: 44,
        sfRelationshipRestriction: true,
        hardConstraintRestriction: true,
        narrativeTone: "Executive",
        standardCompliance: "DCMA-14",
      },
    },
    ...overrides,
  };
}

const App: React.FC = () => {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scopeText, setScopeText] = useState('');
  const [authInput, setAuthInput] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [scopeUploadStatus, setScopeUploadStatus] = useState<string | null>(null);
  const [scopeUploadSuccess, setScopeUploadSuccess] = useState(false); // true = just succeeded, show green confirmation
  const [scopeFiles, setScopeFiles] = useState<{ filename: string }[]>([]);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const scopeFileInputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [savedDocuments, setSavedDocuments] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [documentSaveStatus, setDocumentSaveStatus] = useState<string | null>(null);
  const [siteProgressUploadStatus, setSiteProgressUploadStatus] = useState<string | null>(null);
  const [siteProgressUploadSuccess, setSiteProgressUploadSuccess] = useState(false);
  const [siteProgressFiles, setSiteProgressFiles] = useState<{ doc_id: string; filename: string; format?: string; created_at?: string }[]>([]);
  const siteProgressPicturesInputRef = useRef<HTMLInputElement>(null);
  const siteProgressLogsInputRef = useRef<HTMLInputElement>(null);
  const [sampleScheduleUploadStatus, setSampleScheduleUploadStatus] = useState<string | null>(null);
  const [sampleScheduleUploadSuccess, setSampleScheduleUploadSuccess] = useState(false);
  const [sampleScheduleFiles, setSampleScheduleFiles] = useState<{ doc_id: string; filename: string; format?: string; created_at?: string }[]>([]);
  const sampleScheduleInputRef = useRef<HTMLInputElement>(null);

  // Restore session from auth token or saved project state
  useEffect(() => {
    // Try to get client_id from auth user (set by the login overlay)
    try {
      const authUser = JSON.parse(localStorage.getItem('vuelogic_auth_user') || 'null');
      if (authUser?.client_id) {
        const clientId = authUser.client_id;
        const clientName = `${authUser.first_name} ${authUser.last_name} — ${clientId}`;
        setSession({ clientId, clientName, isAuthorized: true });
        localStorage.setItem("vuelogic_session_id", clientId);
        // Restore project data if available
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try { setProject(JSON.parse(saved)); } catch (_) {}
        }
        return;
      }
    } catch (_) {}

    // Fallback: restore from saved project state
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject(parsed);
        const clientId = parsed.metadata?.clientId || "NODE-1";
        const clientName = parsed.metadata?.clientName || `Workspace ${clientId}`;
        setSession({ clientId, clientName, isAuthorized: true });
        localStorage.setItem("vuelogic_session_id", clientId);
      } catch (e) { console.error("Restore failed", e); }
    }
  }, []);

  // When we have a session but no/missing activities, try to load saved schedule from backend
  useEffect(() => {
    if (!session?.isAuthorized || !project) return;
    const hasActivities = project.activities?.length > 0;
    if (hasActivities) return;
    BackendEngine.getSavedSchedule().then((saved) => {
      if (!saved?.activities?.length) return;
      setProject((prev) => {
        const base = prev ?? defaultProjectData();
        return {
          ...base,
          projectName: saved.projectName ?? base.projectName,
          activities: Array.isArray(saved.activities) ? saved.activities as ProjectData['activities'] : base.activities,
          wbs: Array.isArray(saved.wbs) ? saved.wbs : (base.wbs ?? []),
        };
      });
    });
  }, [session?.isAuthorized]);

  // Persist project changes
  useEffect(() => {
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project]);

  // Load scope files, sample schedule, and site progress documents when Ingestion tab is shown
  useEffect(() => {
    if (activeTab === 'ingestion') {
      BackendEngine.getScopeFiles().then(setScopeFiles);
      BackendEngine.listSampleScheduleDocuments().then(setSampleScheduleFiles);
      BackendEngine.listSiteProgressDocuments().then(setSiteProgressFiles);
    }
  }, [activeTab]);

  // Load conversation when Chat tab is shown
  useEffect(() => {
    if (activeTab === 'chat') {
      BackendEngine.getConversation().then(setChatMessages);
    }
  }, [activeTab]);

  // Load saved documents when Documents tab is shown
  useEffect(() => {
    if (activeTab === 'documents') {
      BackendEngine.getDocuments().then(setSavedDocuments);
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleScopeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScopeUploadSuccess(false);
    setScopeUploadStatus('Uploading…');
    const result = await BackendEngine.uploadScopeDocument(file);
    if (result.ok) {
      setScopeUploadStatus(`Uploaded: ${file.name}`);
      setScopeUploadSuccess(true);
      BackendEngine.getScopeFiles().then(setScopeFiles);
      setTimeout(() => {
        setScopeUploadStatus(null);
        setScopeUploadSuccess(false);
      }, 5000);
    } else {
      setScopeUploadStatus(`Failed: ${result.error ?? 'Unknown error'}`);
      setScopeUploadSuccess(false);
    }
  };

  const handleExtractSchedule = async () => {
    setExtractError(null);
    setExtractLoading(true);
    try {
      const result = await BackendEngine.extractScheduleFromScope();
      if (!result.ok) {
        setExtractError(result.error ?? "Extraction failed");
        return;
      }
      const activities = result.activities ?? [];
      setProject((prev) => {
        const base = prev ?? defaultProjectData();
        return {
          ...base,
          projectName: result.projectName ?? base.projectName,
          activities,
          wbs: Array.isArray(result.wbs) ? result.wbs : (base.wbs ?? []),
        };
      });
      if (activities.length > 0) setActiveTab("cpm-list");
    } finally {
      setExtractLoading(false);
    }
  };

  const handleDeleteScopeFile = async (filename: string) => {
    if (deletingFilename) return;
    setDeletingFilename(filename);
    try {
      const result = await BackendEngine.deleteScopeFile(filename);
      if (result.ok) {
        setScopeFiles((prev) => prev.filter((f) => f.filename !== filename));
      } else {
        setScopeUploadStatus(`Delete failed: ${result.error ?? "Unknown"}`);
        setScopeUploadSuccess(false);
      }
    } finally {
      setDeletingFilename(null);
    }
  };

  const handleSiteProgressUpload = async (file: File) => {
    setSiteProgressUploadSuccess(false);
    setSiteProgressUploadStatus('Uploading…');
    const result = await BackendEngine.uploadSiteProgressFile(file);
    if (result.ok) {
      setSiteProgressUploadStatus(`Uploaded: ${file.name}`);
      setSiteProgressUploadSuccess(true);
      BackendEngine.listSiteProgressDocuments().then(setSiteProgressFiles);
      setTimeout(() => {
        setSiteProgressUploadStatus(null);
        setSiteProgressUploadSuccess(false);
      }, 5000);
    } else {
      setSiteProgressUploadStatus(`Failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  const handleSampleScheduleUpload = async (file: File) => {
    setSampleScheduleUploadSuccess(false);
    setSampleScheduleUploadStatus('Uploading…');
    const result = await BackendEngine.uploadSampleScheduleFile(file);
    if (result.ok) {
      setSampleScheduleUploadStatus(`Uploaded: ${file.name}`);
      setSampleScheduleUploadSuccess(true);
      BackendEngine.listSampleScheduleDocuments().then(setSampleScheduleFiles);
      setTimeout(() => {
        setSampleScheduleUploadStatus(null);
        setSampleScheduleUploadSuccess(false);
      }, 5000);
    } else {
      setSampleScheduleUploadStatus(`Failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  const handleSaveAsDocument = async (content: string, defaultTitle?: string) => {
    const title = defaultTitle || `Schedule basis ${new Date().toISOString().slice(0, 10)}`;
    setDocumentSaveStatus('Saving…');
    const result = await BackendEngine.saveDocument(title, content);
    if (result.ok) {
      setDocumentSaveStatus('Saved. Open Documents tab to download.');
      BackendEngine.getDocuments().then(setSavedDocuments);
      setTimeout(() => setDocumentSaveStatus(null), 4000);
    } else {
      setDocumentSaveStatus(`Failed: ${result.error ?? 'Unknown'}`);
    }
  };

  const handleSendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    const userMsg = { role: 'user' as const, content: msg };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history = [...chatMessages, userMsg];
      const { reply, error } = await BackendEngine.sendChatMessage(msg, chatMessages);
      if (error) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: reply || '(No response)' }]);
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogin = () => {
    if (!authInput.trim()) return;
    const clientId = authInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_") || "DEFAULT";
    const clientName = `Workspace ${clientId}`;
    setSession({ clientId, clientName, isAuthorized: true });
    localStorage.setItem("vuelogic_session_id", clientId);
    localStorage.removeItem(STORAGE_KEY);
    setProject(null);
    BackendEngine.getSavedSchedule().then((saved) => {
      if (saved?.activities?.length) {
        setProject((prev) => {
          const base = prev ?? defaultProjectData();
          return {
            ...base,
            projectName: saved.projectName ?? base.projectName,
            activities: Array.isArray(saved.activities) ? saved.activities as ProjectData['activities'] : base.activities,
            wbs: Array.isArray(saved.wbs) ? saved.wbs : (base.wbs ?? []),
            metadata: { ...base.metadata, clientId, clientName },
          };
        });
      }
    });
    // Load chat history so user can "continue from where we left off" (chat is persisted per Client ID on server)
    BackendEngine.getConversation().then(setChatMessages);
  };

  const handleProcess = async () => {
    if (!scopeText.trim()) return;
    setIsProcessing(true);
    setSyncError(null);
    try {
      const result = await BackendEngine.processProjectData(scopeText);
      setProject(result);
      setScopeText('');
      if (result.activities.length > 0) setActiveTab('cpm-list');
    } catch (err) {
      setSyncError("Engine failed to process. Check network or data format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePhilosophy = (newPhil: SchedulingPhilosophy) => {
    if (project) {
      setProject({ ...project, metadata: { ...project.metadata, philosophy: newPhil } });
    }
  };

  if (!session?.isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-12">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Vue<span className="text-blue-500">Logic</span></h1>
           <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 space-y-8">
              <input 
                className="w-full bg-slate-900 border-2 border-white/5 rounded-3xl py-6 px-8 text-white font-black text-xl outline-none focus:border-blue-500 transition-all uppercase"
                placeholder="PROJECT ID"
                value={authInput}
                onChange={e => setAuthInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-4 transition-all">
                Access Workspace <ArrowRight />
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => {
          setSession(null);
          setProject(null);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem("vuelogic_session_id");
          localStorage.removeItem("vuelogic_auth_token");
          localStorage.removeItem("vuelogic_auth_user");
          window.location.reload();
        }} clientName={session.clientName}>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-50 shadow-xl flex items-center gap-8">
               <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200"><Waves className="text-white" /></div>
               <p className="text-xl font-black text-slate-800 uppercase italic leading-tight">Engine Operational. Project: {session.clientId}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-slate-900 text-white p-16 rounded-[4rem] flex flex-col items-start gap-8 shadow-2xl">
                 <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">CPM <br/><span className="text-blue-500 text-4xl">Integration</span></h3>
                 <p className="text-slate-400 font-bold max-w-sm">Feed your backend engine XER files or technical specs to generate the scheduling model.</p>
                 <button onClick={() => setActiveTab('ingestion')} className="px-8 py-4 bg-white text-slate-900 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all">Ingest Logic <ArrowRight size={14}/></button>
              </div>
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-6">
                 <h4 className="text-xl font-black uppercase flex items-center justify-between">Engine Readiness <CheckSquare className="text-blue-600"/></h4>
                 <div className="space-y-3">
                    {[
                      { label: "Logic Calibration", done: !!project, tab: 'philosophy' },
                      { label: "Data Ingestion", done: !!project?.activities?.length, tab: 'ingestion' },
                      { label: "Network Audit", done: !!project?.healthSummary?.overallHealthScore, tab: 'audit' }
                    ].map((s, i) => (
                      <button key={i} onClick={() => setActiveTab(s.tab)} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${s.done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                        <span className="text-xs font-black uppercase">{s.label}</span>
                        {s.done ? <ShieldCheck className="text-emerald-500" size={16}/> : <ArrowRight className="text-slate-300" size={16}/>}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-2xl font-black uppercase italic flex items-center gap-3">
                    <MessageCircle className="text-blue-600"/> Ask about scope & schedule
                  </h4>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Questions use your uploaded scope documents. Upload PDFs in Ingestion first.
                  </p>
                </div>
                <a
                  href={BackendEngine.getConversationExportUrl()}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all"
                  title="Save chat history to TXT file"
                >
                  <FileDown size={16}/> Save chat to TXT
                </a>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 && (
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No messages yet. Ask a question about your scope or schedule.</p>
                )}
                {documentSaveStatus && (
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {documentSaveStatus}
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-5 py-3 text-sm ${
                          m.role === 'user'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                      {m.role === 'assistant' && m.content && (
                        <button
                          type="button"
                          onClick={() => handleSaveAsDocument(m.content, `Schedule basis ${new Date().toISOString().slice(0, 10)}`)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all"
                          title="Save as document for download"
                        >
                          <Save size={12}/> Save as document
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-5 py-3 text-slate-500 text-sm">Thinking…</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                  placeholder="Ask about your scope, schedule, or documents…"
                  className="flex-1 rounded-2xl border-2 border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-blue-500"
                  disabled={chatLoading}
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send size={18}/> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 space-y-6">
              <h4 className="text-2xl font-black uppercase italic flex items-center gap-3">
                <FolderDown className="text-blue-600"/> Schedule basis documents
              </h4>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xl">
                Documents saved from chat (e.g. schedule basis, WBS summaries). Download and keep for reference.
              </p>
              {savedDocuments.length === 0 ? (
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No documents yet. Save a chat reply as a document using &quot;Save as document&quot; in the Chat tab.</p>
              ) : (
                <ul className="space-y-3">
                  {savedDocuments.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 truncate">{d.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(d.created_at).toLocaleString()}</p>
                      </div>
                      <a
                        href={BackendEngine.getDocumentDownloadUrl(d.id, d.title)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                      >
                        <Download size={14}/> Download
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ingestion' && (
          <div className="max-w-4xl mx-auto space-y-8">
             {/* Scope documents upload — PDF, TXT, MD, CSV */}
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 space-y-6">
                <h4 className="text-2xl font-black uppercase italic flex items-center gap-3">
                  <FileCheck className="text-blue-600"/> Scope documents
                </h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xl">
                  Upload scope of work (PDF), specs, or text. PDFs are extracted and indexed for chat and engine sync.
                </p>
                <input
                  ref={scopeFileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.csv"
                  className="hidden"
                  onChange={handleScopeFileChange}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => scopeFileInputRef.current?.click()}
                    className="bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-lg"
                  >
                    <Upload size={18}/> Upload scope document
                  </button>
                  {scopeUploadStatus && (
                    <div
                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold uppercase ${
                        scopeUploadSuccess
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : scopeUploadStatus.startsWith('Failed')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {scopeUploadSuccess && <CheckCircle size={20} className="shrink-0"/>}
                      {scopeUploadStatus}
                    </div>
                  )}
                </div>
                {scopeFiles.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Uploaded in this session</p>
                    <ul className="flex flex-wrap gap-2">
                      {scopeFiles.map((f, i) => (
                        <li key={i} className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2 group">
                          <FileText size={14} className="shrink-0"/> <span className="min-w-0 truncate max-w-[280px]" title={f.filename}>{f.filename}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteScopeFile(f.filename)}
                            disabled={deletingFilename === f.filename}
                            className="shrink-0 p-1 rounded text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-all disabled:opacity-50"
                            title="Remove file"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {scopeFiles.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Extract to Activity List</p>
                    <p className="text-slate-600 text-xs font-bold mb-3">Generate activities and WBS from your uploaded scope documents. Results are saved and shown in the Activity List tab.</p>
                    <button
                      type="button"
                      onClick={handleExtractSchedule}
                      disabled={extractLoading}
                      className="bg-blue-600 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-blue-500 transition-all shadow-lg disabled:opacity-60"
                    >
                      {extractLoading ? <RefreshCw size={18} className="animate-spin"/> : <Layers size={18}/>}
                      {extractLoading ? 'Extracting…' : 'Extract activities & WBS'}
                    </button>
                    {extractError && (
                      <div className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle size={16}/> {extractError}
                      </div>
                    )}
                  </div>
                )}
             </div>

             {/* Sample schedule — Excel / XER for reference */}
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 space-y-6">
                <h4 className="text-2xl font-black uppercase italic flex items-center gap-3">
                  <Calendar className="text-emerald-600"/> Sample schedule
                </h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xl">
                  Upload a sample schedule (Excel .xlsx or Primavera P6 .xer) as reference for building or comparing schedules. Indexed for search and chat.
                </p>
                <input
                  ref={sampleScheduleInputRef}
                  type="file"
                  accept=".xlsx,.xer"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) handleSampleScheduleUpload(file);
                  }}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => sampleScheduleInputRef.current?.click()}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-lg"
                  >
                    <Upload size={18}/> Upload sample schedule
                  </button>
                  {sampleScheduleUploadStatus && (
                    <div
                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold uppercase ${
                        sampleScheduleUploadSuccess
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : sampleScheduleUploadStatus.startsWith('Failed')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {sampleScheduleUploadSuccess && <CheckCircle size={20} className="shrink-0"/>}
                      {sampleScheduleUploadStatus}
                    </div>
                  )}
                </div>
                {sampleScheduleFiles.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Uploaded sample schedules</p>
                    <ul className="flex flex-wrap gap-2">
                      {sampleScheduleFiles.map((f) => (
                        <li key={f.doc_id} className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Calendar size={14} className="shrink-0 text-emerald-600"/>
                          <span className="min-w-0 truncate max-w-[280px]" title={f.filename}>{f.filename}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
             </div>

             {/* Site pictures & daily logs — agent analyzes and learns progress */}
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 space-y-6">
                <h4 className="text-2xl font-black uppercase italic flex items-center gap-3">
                  <Camera className="text-amber-600"/> Site pictures & daily logs
                </h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xl">
                  Upload site photos and daily site logs so the agent can analyze and learn from progress. Photos are described via Claude vision; logs are indexed for search and chat.
                </p>
                <input
                  ref={siteProgressPicturesInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) handleSiteProgressUpload(file);
                  }}
                />
                <input
                  ref={siteProgressLogsInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) handleSiteProgressUpload(file);
                  }}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => siteProgressPicturesInputRef.current?.click()}
                    className="bg-amber-600 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-amber-500 transition-all shadow-lg"
                  >
                    <Camera size={18}/> Upload site picture
                  </button>
                  <button
                    type="button"
                    onClick={() => siteProgressLogsInputRef.current?.click()}
                    className="bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-lg"
                  >
                    <ClipboardList size={18}/> Upload daily log
                  </button>
                  {siteProgressUploadStatus && (
                    <div
                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold uppercase ${
                        siteProgressUploadSuccess
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : siteProgressUploadStatus.startsWith('Failed')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {siteProgressUploadSuccess && <CheckCircle size={20} className="shrink-0"/>}
                      {siteProgressUploadStatus}
                    </div>
                  )}
                </div>
                {siteProgressFiles.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Uploaded for progress analysis</p>
                    <ul className="flex flex-wrap gap-2">
                      {siteProgressFiles.map((f) => (
                        <li key={f.doc_id} className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                          {f.format === 'image' ? <Camera size={14} className="shrink-0 text-amber-600"/> : <ClipboardList size={14} className="shrink-0"/>}
                          <span className="min-w-0 truncate max-w-[280px]" title={f.filename}>{f.filename}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
             </div>

             <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 space-y-8">
                <h4 className="text-3xl font-black uppercase italic">Engine Data Inflow</h4>
                <textarea 
                  className="w-full h-80 p-8 bg-slate-50 rounded-2xl border-2 border-slate-100 font-mono text-sm outline-none shadow-inner"
                  placeholder="Paste your engine's supported input format (XER / JSON / Text)..."
                  value={scopeText}
                  onChange={e => setScopeText(e.target.value)}
                  disabled={isProcessing}
                />
                {syncError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-black uppercase flex items-center gap-3"><AlertCircle size={16}/> {syncError}</div>}
                <div className="flex justify-between items-center pt-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">UI Adapter connects directly to your custom backend processing engine.</p>
                   <button onClick={handleProcess} disabled={isProcessing || !scopeText.trim()} className="bg-slate-900 text-white px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-4 hover:bg-blue-600 transition-all shadow-xl">
                      {isProcessing ? <RefreshCw className="animate-spin"/> : <FileText/>} {isProcessing ? 'Processing...' : 'Run Engine Sync'}
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'cpm-list' && <ActivityTable activities={project?.activities || []} />}
        {activeTab === 'audit' && <HealthScorecard summary={project?.healthSummary} />}
        {activeTab === 'gantt' && <GanttChart activities={project?.activities || []} />}
        {activeTab === 'cost' && <CostDashboard activities={project?.activities || []} cbs={project?.cbs || []} />}
        {activeTab === 'philosophy' && <PhilosophyConfigurator philosophy={project?.metadata?.philosophy || {} as any} onChange={handleUpdatePhilosophy} />}
        {activeTab === 'logic' && <BasisOfLogicView data={project?.basisOfLogic} />}
        {activeTab === 'guide' && <GuideView />}

      </div>
    </Layout>
  );
};

export default App;
