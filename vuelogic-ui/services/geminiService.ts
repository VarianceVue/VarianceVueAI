
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData, ChatMessage, ProjectJournalEntry, NarrativeReport, WeeklyReport, SchedulingPhilosophy, Activity } from "../types";

// Always use named parameter for apiKey and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function extractJson(text: string) {
  try {
    // Robust cleaning for model responses that might include markdown backticks
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return {};
  }
}

function getSystemContext(project: ProjectData | null) {
  const clientId = project?.metadata?.clientId || "NEW_CLIENT";
  const clientName = project?.metadata?.clientName || "Unassigned Client";
  const phil = project?.metadata?.philosophy;

  const philosophyDirective = phil ? `
    [SCHEDULING PHILOSOPHY ACTIVE]
    - COMPLIANCE STANDARD: ${phil.standardCompliance}
    - LEAD RESTRICTION: ${phil.leadRestriction ? "STRICT - No negative lags allowed." : "Permissive"}
    - MAX LAG TOLERANCE: ${phil.maxLagDays} days.
    - MAX FLOAT TOLERANCE: ${phil.maxFloatDays} days.
    - SF RELATIONSHIPS: ${phil.sfRelationshipRestriction ? "FORBIDDEN - Mark as Fail." : "Allowed"}
    - HARD CONSTRAINTS: ${phil.hardConstraintRestriction ? "RESTRICTED - Flags as Warning/Fail." : "Neutral"}
    - NARRATIVE TONE: ${phil.narrativeTone}
  ` : "[SCHEDULING PHILOSOPHY]: Use standard DCMA 14-point defaults.";

  return `
    [PRIVACY GUARDRAIL ACTIVE]
    - CURRENT CLIENT CONTEXT: ${clientName} (ID: ${clientId})
    - SECURITY PROTOCOL: Physically isolated workspace. No external data leaks.
    ${philosophyDirective}
  `;
}

// Updated createEmptyProject to match the new ProjectData structure
const createEmptyProject = (clientId: string, clientName: string): Partial<ProjectData> => ({
  activities: [],
  journal: [],
  narrativeReports: [],
  weeklyReports: [],
  basisOfLogic: [],
  cbs: [],
  wbs: [],
  healthSummary: {
    missingPredecessors: 0,
    missingSuccessors: 0,
    highFloatCount: 0,
    highDurationCount: 0,
    negativeLagCount: 0,
    sfRelationshipCount: 0,
    hardConstraintCount: 0,
    overallHealthScore: 0,
    dcmaPoints: []
  },
  metadata: {
    projectType: "Industrial",
    location: "Global",
    criticalPathSensitivity: "High",
    clientName,
    clientId,
    standardLogicProtocol: "DCMA-14",
    philosophy: {
      leadRestriction: true,
      maxLagDays: 0,
      maxFloatDays: 44,
      sfRelationshipRestriction: true,
      hardConstraintRestriction: true,
      narrativeTone: 'Executive',
      standardCompliance: 'DCMA-14'
    }
  }
});

export async function analyzeProjectDocuments(
  scopeText: string,
  scopePdfs: { data: string, mimeType: string, name?: string }[],
  currentProject: ProjectData | null
) {
  // Use gemini-3-pro-preview for complex tasks
  const model = "gemini-3-pro-preview";
  const clientId = currentProject?.metadata?.clientId || "NEW_CLIENT";
  const clientName = currentProject?.metadata?.clientName || "Unassigned Client";

  const systemInstruction = `
    You are VueLogic CPM Agent, a specialist in Industrial Scheduling and Primavera P6 (XER) analysis.
    ${getSystemContext(currentProject)}
    
    MISSION:
    - Receive project data. This could be a Primavera P6 XER file, a scope narrative, or bridging specs.
    - Map activities to a valid CPM network.
    - Perform a DCMA 14-point health audit.
    - Return JSON only. Mandatory keys: 'activities', 'basisOfLogic', 'healthSummary', 'journal'.
  `;

  const parts: any[] = [{ text: `INPUT ARTIFACTS:\n${scopeText}` }];
  // Access .text property directly from response
  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: { systemInstruction, responseMimeType: "application/json" }
  });

  const rawData = extractJson(response.text || '{}');
  const defaults = createEmptyProject(clientId, clientName);

  const activities: Activity[] = (Array.isArray(rawData.activities) ? rawData.activities : []).map((a: any) => ({
    id: String(a.id || ''),
    wbsCode: String(a.wbsCode || ''),
    cbsCode: String(a.cbsCode || ''),
    name: String(a.name || 'Unnamed Activity'),
    description: String(a.description || ''),
    durationDays: Number(a.durationDays || 0),
    totalFloatDays: Number(a.totalFloatDays || 0),
    startDate: a.startDate,
    endDate: a.endDate,
    predecessors: Array.isArray(a.predecessors) ? a.predecessors : [],
    isCritical: !!a.isCritical,
    directCost: Number(a.directCost || 0),
    indirectCost: Number(a.indirectCost || 0),
    isHardCost: !!a.isHardCost,
    healthFlags: Array.isArray(a.healthFlags) ? a.healthFlags : []
  }));

  return {
    ...defaults,
    ...rawData,
    metadata: {
      ...defaults.metadata,
      ...rawData.metadata,
      clientId,
      clientName,
      philosophy: currentProject?.metadata?.philosophy || (defaults.metadata as any)?.philosophy
    },
    activities,
    journal: Array.isArray(rawData.journal) ? rawData.journal : [],
    narrativeReports: Array.isArray(rawData.narrativeReports) ? rawData.narrativeReports : [],
    weeklyReports: Array.isArray(rawData.weeklyReports) ? rawData.weeklyReports : [],
    basisOfLogic: Array.isArray(rawData.basisOfLogic) ? rawData.basisOfLogic : [],
    lastSyncTime: new Date().toISOString()
  } as ProjectData;
}

export async function chatWithVueLogic(message: string, project: ProjectData | null, history: ChatMessage[]) {
  const model = "gemini-3-pro-preview";
  const chat = ai.chats.create({
    model,
    history: history.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction: `You are VueLogic Specialist Agent. ${getSystemContext(project)}`
    }
  });
  const res = await chat.sendMessage({ message });
  // Access .text property directly
  return { text: res.text };
}

export async function generateMonthlyNarrative(project: ProjectData): Promise<NarrativeReport> {
  const model = "gemini-3-pro-preview";
  const prompt = `Generate monthly status for ${project.projectName}. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { 
      systemInstruction: `Executive Persona. ${getSystemContext(project)}`,
      responseMimeType: "application/json" 
    }
  });
  const result = extractJson(response.text || '{}');
  return { ...result, id: `MR-${Date.now()}`, date: new Date().toISOString(), status: 'draft' };
}

export async function generateWeeklyReport(project: ProjectData): Promise<WeeklyReport> {
  const model = "gemini-3-pro-preview";
  const prompt = `Generate weekly status for ${project.projectName}. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { 
      systemInstruction: `Senior Scheduler Persona. ${getSystemContext(project)}`,
      responseMimeType: "application/json" 
    }
  });
  const result = extractJson(response.text || '{}');
  return { ...result, id: `WR-${Date.now()}`, date: new Date().toISOString(), status: 'draft' };
}

export async function generateProjectPulse(project: ProjectData) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Update for ${project?.metadata?.clientName || 'Project'}.`,
      config: { systemInstruction: `Pulse Agent. ${getSystemContext(project)}` }
    });
    // Access .text property directly
    return response.text;
  } catch (e) {
    return "Workspace ready for logic ingestion.";
  }
}
