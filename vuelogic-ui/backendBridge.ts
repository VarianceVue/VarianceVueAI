
import { ProjectData, NarrativeReport, WeeklyReport } from "../types";

/**
 * BACKEND ADAPTER
 * Replace the mock implementations below with calls to your actual backend engine.
 */
export const BackendEngine = {
  /**
   * Process raw XER, Scope, or Specification text
   */
  async processProjectData(rawInput: string): Promise<ProjectData> {
    try {
      // Example implementation:
      // const response = await fetch('https://your-api.com/v1/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ document: rawInput })
      // });
      // return await response.json();

      // Mock delay for UI testing
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            projectName: "Integrated Industrial Complex",
            activities: [
              { id: 'ACT-101', name: 'Site Preparation', durationDays: 10, totalFloatDays: 0, isCritical: true, wbsCode: '1.1', predecessors: [], healthFlags: [], directCost: 5000, indirectCost: 1000, isHardCost: true },
              { id: 'ACT-102', name: 'Foundation Pours', durationDays: 15, totalFloatDays: 0, isCritical: true, wbsCode: '1.2', predecessors: [{ activityId: 'ACT-101', type: 'FS', lag: 0 }], healthFlags: [], directCost: 15000, indirectCost: 2000, isHardCost: true }
            ],
            healthSummary: { 
              overallHealthScore: 88, 
              dcmaPoints: [
                { name: 'Missing Logic', status: 'Pass', value: 0, threshold: '0%', description: 'All activities have predecessors/successors.' },
                { name: 'High Float', status: 'Warning', value: 2, threshold: '5%', description: 'Some activities exceed float targets.' }
              ],
              missingPredecessors: 0,
              missingSuccessors: 0,
              highFloatCount: 2,
              highDurationCount: 0,
              negativeLagCount: 0,
              sfRelationshipCount: 0,
              hardConstraintCount: 0
            },
            journal: [],
            narrativeReports: [],
            weeklyReports: [],
            basisOfLogic: [],
            cbs: [
              { code: '01', name: 'General Requirements', type: 'Indirect' },
              { code: '03', name: 'Concrete', type: 'Direct' }
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
                narrativeTone: 'Executive',
                standardCompliance: 'DCMA-14'
              }
            }
          });
        }, 2000);
      });
    } catch (error) {
      console.error("Backend Engine Error:", error);
      throw error;
    }
  },

  async generateMonthlyNarrative(project: ProjectData): Promise<NarrativeReport> {
     // Trigger your engine's LLM narrative generator here
     return {
       id: `MR-${Date.now()}`,
       date: new Date().toISOString(),
       status: 'draft',
       executiveSummary: "Project is currently trending on schedule with zero critical path deviations.",
       criticalPathShifts: [],
       fullNarrative: "Detailed analysis of current sequence..."
     };
  }
};
