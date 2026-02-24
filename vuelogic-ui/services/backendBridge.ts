import { ProjectData, NarrativeReport, WeeklyReport } from "../types";

const API_BASE = () => (typeof window !== "undefined" ? window.location.origin : "");

/**
 * Session ID = Client ID when user has logged in (set in App handleLogin).
 * Used for all backend isolation: files, ingest, chat, schedule, vector search.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "s-server";
  const id = localStorage.getItem("vuelogic_session_id");
  if (id) return id;
  // No client logged in yet (login screen will set this when they enter Client ID)
  return "s-anon-" + Math.random().toString(36).slice(2) + "-" + Date.now();
}

/**
 * BACKEND ADAPTER — wired to ECEPCS FastAPI (VueLogic schedule agent).
 */
export const BackendEngine = {
  /**
   * Process raw XER, Scope, or Specification text.
   * Calls /api/chat with the input; uses reply in narrative. Returns mock project structure for UI; full parsing can be added later.
   */
  async processProjectData(rawInput: string): Promise<ProjectData> {
    try {
      const sessionId = getSessionId();
      const response = await fetch(API_BASE() + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Process the following project data (XER, scope, or specification) and provide a brief scheduling summary and any critical path or DCMA-related notes:\n\n" + rawInput.slice(0, 50000),
          history: [],
          session_id: sessionId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const reply = data?.reply || "";
      const err = data?.error || (response.ok ? "" : response.statusText);

      const mockProject: ProjectData = {
        projectName: "Integrated Industrial Complex",
        activities: [
          { id: "ACT-101", name: "Site Preparation", durationDays: 10, totalFloatDays: 0, isCritical: true, wbsCode: "1.1", predecessors: [], healthFlags: [], directCost: 5000, indirectCost: 1000, isHardCost: true },
          { id: "ACT-102", name: "Foundation Pours", durationDays: 15, totalFloatDays: 0, isCritical: true, wbsCode: "1.2", predecessors: [{ activityId: "ACT-101", type: "FS", lag: 0 }], healthFlags: [], directCost: 15000, indirectCost: 2000, isHardCost: true },
        ],
        healthSummary: {
          overallHealthScore: 88,
          dcmaPoints: [
            { name: "Missing Logic", status: "Pass", value: 0, threshold: "0%", description: "All activities have predecessors/successors." },
            { name: "High Float", status: "Warning", value: 2, threshold: "5%", description: "Some activities exceed float targets." },
          ],
          missingPredecessors: 0,
          missingSuccessors: 0,
          highFloatCount: 2,
          highDurationCount: 0,
          negativeLagCount: 0,
          sfRelationshipCount: 0,
          hardConstraintCount: 0,
        },
        journal: [],
        narrativeReports: err
          ? []
          : [
              {
                id: `MR-${Date.now()}`,
                date: new Date().toISOString(),
                status: "draft" as const,
                executiveSummary: reply.slice(0, 300),
                criticalPathShifts: [],
                fullNarrative: reply,
              },
            ],
        weeklyReports: [],
        basisOfLogic: [],
        cbs: [
          { code: "01", name: "General Requirements", type: "Indirect" },
          { code: "03", name: "Concrete", type: "Direct" },
        ],
        wbs: [],
        metadata: {
          clientName: "Enterprise Client",
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
      };

      if (err) throw new Error(err);
      return mockProject;
    } catch (error) {
      console.error("Backend Engine Error:", error);
      throw error;
    }
  },

  async generateMonthlyNarrative(project: ProjectData): Promise<NarrativeReport> {
    try {
      const sessionId = getSessionId();
      const response = await fetch(API_BASE() + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a brief monthly narrative report for this project (${project.projectName}). Include executive summary and critical path shifts if any.`,
          history: [],
          session_id: sessionId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const reply = data?.reply || "";
      const err = data?.error;
      if (err) throw new Error(err);
      return {
        id: `MR-${Date.now()}`,
        date: new Date().toISOString(),
        status: "draft",
        executiveSummary: reply.slice(0, 400),
        criticalPathShifts: [],
        fullNarrative: reply,
      };
    } catch (e) {
      return {
        id: `MR-${Date.now()}`,
        date: new Date().toISOString(),
        status: "draft",
        executiveSummary: "Narrative could not be generated. Check API key and backend.",
        criticalPathShifts: [],
        fullNarrative: String(e),
      };
    }
  },

  /**
   * Upload a scope document (PDF, TXT, MD, CSV). PDFs are sent as base64 and extracted on the server.
   */
  async uploadScopeDocument(file: File): Promise<{ ok: boolean; error?: string }> {
    const sessionId = getSessionId();
    if (file.size > 500 * 1024 * 1024) return { ok: false, error: "File too large (max 500MB)" };
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          let content: string;
          if (isPdf) {
            const buf = ev.target?.result as ArrayBuffer;
            if (!buf) {
              resolve({ ok: false, error: "Failed to read file" });
              return;
            }
            const bytes = new Uint8Array(buf);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            content = btoa(binary);
          } else {
            content = (ev.target?.result as string) ?? "";
          }
          const res = await fetch(API_BASE() + "/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, filename: file.name, content }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && !data.error) resolve({ ok: true });
          else resolve({ ok: false, error: data?.detail || data?.error || res.statusText || "Upload failed" });
        } catch (e) {
          resolve({ ok: false, error: String(e) });
        }
      };
      reader.onerror = () => resolve({ ok: false, error: "Failed to read file" });
      if (isPdf) reader.readAsArrayBuffer(file);
      else reader.readAsText(file, "UTF-8");
    });
  },

  /**
   * List scope documents (and other session files) for the current session.
   */
  async getScopeFiles(): Promise<{ filename: string }[]> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() + "/api/files?session_id=" + encodeURIComponent(sessionId)
      );
      if (!res.ok) return [];
      const list = await res.json().catch(() => []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  /**
   * Extract activities and WBS from uploaded scope documents. Saves on server and returns data for Activity List.
   */
  async extractScheduleFromScope(): Promise<{
    ok: boolean;
    projectName?: string;
    activities?: { id: string; name: string; durationDays: number; wbsCode: string; predecessors: { activityId: string; type: string; lag: number }[]; isCritical: boolean; totalFloatDays: number; healthFlags: string[]; directCost: number; indirectCost: number; isHardCost: boolean }[];
    wbs?: { code: string; name: string }[];
    error?: string;
  }> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(API_BASE() + "/api/extract-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      const err = data?.detail || data?.error || (res.ok ? undefined : res.statusText);
      if (err) return { ok: false, error: err };
      return {
        ok: true,
        projectName: data.projectName,
        activities: data.activities,
        wbs: data.wbs,
      };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  /**
   * Get saved extracted schedule (activities, wbs) for the current session (for future reference / restore).
   */
  async getSavedSchedule(): Promise<{
    projectName?: string;
    activities?: unknown[];
    wbs?: unknown[];
  } | null> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() + "/api/schedule?session_id=" + encodeURIComponent(sessionId)
      );
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      return data && (data.activities || data.projectName) ? data : null;
    } catch {
      return null;
    }
  },

  /**
   * Delete an uploaded file (PDF, TXT, etc.) for the current session.
   */
  async deleteScopeFile(filename: string): Promise<{ ok: boolean; error?: string }> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() +
          "/api/files?session_id=" +
          encodeURIComponent(sessionId) +
          "&filename=" +
          encodeURIComponent(filename),
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === "ok" || res.status === 204)) return { ok: true };
      return { ok: false, error: data?.error || data?.detail || res.statusText || "Delete failed" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  /**
   * Upload a sample schedule (Excel .xlsx or Primavera P6 XER) to the ingestion pipeline (group: sample_schedule).
   * Used as reference for building or comparing schedules.
   */
  async uploadSampleScheduleFile(file: File): Promise<{ ok: boolean; error?: string }> {
    const sessionId = getSessionId();
    if (file.size > 500 * 1024 * 1024) return { ok: false, error: "File too large (max 500MB)" };
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("session_id", sessionId);
      form.append("group", "sample_schedule");
      const res = await fetch(API_BASE() + "/api/ingest/document", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status !== "error") return { ok: true };
      return { ok: false, error: data?.error || data?.detail || res.statusText || "Upload failed" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  /**
   * List ingested sample schedule documents (Excel, XER) for the current session.
   */
  async listSampleScheduleDocuments(): Promise<{ doc_id: string; filename: string; format?: string; created_at?: string }[]> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() +
          "/api/ingest/documents?session_id=" +
          encodeURIComponent(sessionId) +
          "&group=sample_schedule"
      );
      if (!res.ok) return [];
      const list = await res.json().catch(() => []);
      if (!Array.isArray(list)) return [];
      return list.map((d: { id?: string; doc_id?: string; filename?: string; format?: string; created_at?: string }) => ({
        doc_id: d.doc_id ?? d.id ?? "",
        filename: d.filename ?? "unknown",
        format: d.format,
        created_at: d.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Upload a site picture or daily log to the ingestion pipeline (group: site_progress).
   * Site pictures (JPEG, PNG, GIF, WebP) are described via Claude vision; logs (PDF, TXT, DOCX) are extracted as text.
   * The agent can then analyze and learn from progress.
   */
  async uploadSiteProgressFile(file: File): Promise<{ ok: boolean; error?: string }> {
    const sessionId = getSessionId();
    if (file.size > 500 * 1024 * 1024) return { ok: false, error: "File too large (max 500MB)" };
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("session_id", sessionId);
      form.append("group", "site_progress");
      const res = await fetch(API_BASE() + "/api/ingest/document", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status !== "error") return { ok: true };
      return { ok: false, error: data?.error || data?.detail || res.statusText || "Upload failed" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  /**
   * List ingested site progress documents (site pictures and daily logs) for the current session.
   */
  async listSiteProgressDocuments(): Promise<{ doc_id: string; filename: string; format?: string; created_at?: string }[]> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() +
          "/api/ingest/documents?session_id=" +
          encodeURIComponent(sessionId) +
          "&group=site_progress"
      );
      if (!res.ok) return [];
      const list = await res.json().catch(() => []);
      if (!Array.isArray(list)) return [];
      return list.map((d: { id?: string; doc_id?: string; filename?: string; format?: string; created_at?: string }) => ({
        doc_id: d.doc_id ?? d.id ?? "",
        filename: d.filename ?? "unknown",
        format: d.format,
        created_at: d.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Save a generated document (e.g. schedule basis from chat) for persistent download.
   */
  async saveDocument(title: string, content: string): Promise<{
    ok: boolean;
    id?: string;
    title?: string;
    created_at?: string;
    error?: string;
  }> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(API_BASE() + "/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, title, content }),
      });
      const data = await res.json().catch(() => ({}));
      const err = data?.detail || data?.error || (res.ok ? undefined : res.statusText);
      if (err) return { ok: false, error: err };
      return { ok: true, id: data.id, title: data.title, created_at: data.created_at };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  /**
   * List saved documents (schedule basis, etc.) for the current session.
   */
  async getDocuments(): Promise<{ id: string; title: string; created_at: string }[]> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() + "/api/documents?session_id=" + encodeURIComponent(sessionId)
      );
      if (!res.ok) return [];
      const list = await res.json().catch(() => []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  /**
   * URL to download a saved document (open in same window or use as link href).
   */
  getDocumentDownloadUrl(id: string, title?: string): string {
    const sessionId = getSessionId();
    const params = new URLSearchParams({ session_id: sessionId });
    if (title) params.set("title", title);
    return API_BASE() + "/api/documents/" + encodeURIComponent(id) + "?" + params.toString();
  },

  /**
   * Get conversation history for the current session (for Chat tab).
   */
  async getConversation(): Promise<{ role: string; content: string }[]> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(
        API_BASE() + "/api/conversation?session_id=" + encodeURIComponent(sessionId)
      );
      if (!res.ok) return [];
      const list = await res.json().catch(() => []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  /**
   * URL to download chat history as a .txt file. Open in same window or use as <a href> with download.
   */
  getConversationExportUrl(): string {
    const sessionId = getSessionId();
    return (
      API_BASE() +
      "/api/conversation/export?session_id=" +
      encodeURIComponent(sessionId)
    );
  },

  /**
   * Send a chat message. Uses uploaded scope docs (RAG) when answering. Returns reply or error.
   */
  async sendChatMessage(
    message: string,
    history: { role: string; content: string }[] = []
  ): Promise<{ reply: string; error?: string }> {
    const sessionId = getSessionId();
    try {
      const res = await fetch(API_BASE() + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: message.trim(),
          history: history.map((h) => ({ role: h.role, content: h.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = data?.reply ?? "";
      const error = data?.error || (res.ok ? undefined : data?.detail || res.statusText);
      return { reply, error };
    } catch (e) {
      return { reply: "", error: String(e) };
    }
  },
};
