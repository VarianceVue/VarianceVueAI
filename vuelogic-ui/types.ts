
export type RelationshipType = 'FS' | 'SS' | 'FF' | 'SF';
export type ReportStatus = 'draft' | 'approved' | 'rejected';
export type NarrativeTone = 'Executive' | 'Technical' | 'Aggressive' | 'Conservative';

export interface SchedulingPhilosophy {
  leadRestriction: boolean;
  maxLagDays: number;
  maxFloatDays: number;
  sfRelationshipRestriction: boolean;
  hardConstraintRestriction: boolean;
  narrativeTone: NarrativeTone;
  standardCompliance: 'DCMA-14' | 'AACE-International' | 'Custom';
}

// Added missing fields used by CostDashboard and geminiService
export interface Activity {
  id: string;
  wbsCode: string;
  cbsCode?: string;
  name: string;
  durationDays: number;
  totalFloatDays: number;
  predecessors: { activityId: string; type: RelationshipType; lag: number; }[];
  isCritical: boolean;
  healthFlags: string[];
  directCost: number;
  indirectCost: number;
  isHardCost: boolean;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface DCMAAuditPoint {
  name: string;
  status: 'Pass' | 'Fail' | 'Warning';
  value: number;
  threshold: string;
  description: string;
}

// Expanded to match implementation in geminiService
export interface ScheduleHealthSummary {
  overallHealthScore: number; 
  dcmaPoints: DCMAAuditPoint[];
  missingPredecessors: number;
  missingSuccessors: number;
  highFloatCount: number;
  highDurationCount: number;
  negativeLagCount: number;
  sfRelationshipCount: number;
  hardConstraintCount: number;
}

// Added missing types for reports and history
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ProjectJournalEntry {
  date: string;
  event: string;
  impact: string;
}

export interface NarrativeReport {
  id: string;
  date: string;
  status: ReportStatus;
  executiveSummary: string;
  criticalPathShifts: { activityName: string; reasoning: string; }[];
  fullNarrative: string;
}

export interface WeeklyReport {
  id: string;
  date: string;
  status: ReportStatus;
  summary: string;
  immediateWins: string[];
  blockers: { activityName: string; impact: string; }[];
  lookaheadGoals: string[];
  fullNarrative: string;
}

export interface BasisOfLogic {
  wbsLevel2Code: string;
  wbsLevel2Name: string;
  logicBasis: string;
  handoffLogic: string;
  crossWbsDependencies: string;
}

export interface CBSNode {
  code: string;
  name: string;
  type: string;
}

// Expanded ProjectData to include missing lists and metadata fields
export interface ProjectData {
  projectName: string;
  activities: Activity[];
  healthSummary: ScheduleHealthSummary;
  journal: ProjectJournalEntry[];
  narrativeReports: NarrativeReport[];
  weeklyReports: WeeklyReport[];
  basisOfLogic: BasisOfLogic[];
  cbs: CBSNode[];
  wbs: any[];
  lastSyncTime?: string;
  metadata: {
    clientName: string;
    clientId: string;
    philosophy: SchedulingPhilosophy;
    projectType?: string;
    location?: string;
    criticalPathSensitivity?: string;
    standardLogicProtocol?: string;
  };
}

export interface ClientSession {
  clientId: string;
  clientName: string;
  isAuthorized: boolean;
}
