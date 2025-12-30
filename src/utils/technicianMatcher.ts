import { TechnicianType, AssetType } from '../types/fm';
import { detectSkillTagsFromText, getSkillTagById } from './skillTags';

export interface TechnicianMatch {
  technicianId: string;
  technicianName: string;
  confidence: number;
  reasons: string[];
  costEfficiency: 'optimal' | 'acceptable' | 'expensive';
  workloadScore: number;
  matchMethod: 'skill-tags' | 'name-based' | 'fallback';
}

interface NameBasedSkillMapping {
  keywords: string[];
  skillTags: string[];
  confidence: number;
}

export interface TaskRequirements {
  assetCategory: string;
  assetName: string;
  taskName?: string;
  hoursPerVisit: number;
  isReactive: boolean;
  frequency?: string;
}

const NAME_BASED_MAPPINGS: NameBasedSkillMapping[] = [
  { keywords: ['hvac', 'ac tech', 'air conditioning', 'cooling', 'chiller', 'ahu', 'fcu'], skillTags: ['hvac', 'chiller', 'ahu', 'cooling-tower'], confidence: 70 },
  { keywords: ['electrician', 'electrical', 'electric', 'lighting'], skillTags: ['electrical', 'lighting', 'ups'], confidence: 70 },
  { keywords: ['plumber', 'plumbing', 'sanitary', 'water'], skillTags: ['plumbing', 'water-treatment', 'pumps'], confidence: 70 },
  { keywords: ['elv', 'low voltage', 'security', 'cctv', 'access control', 'alarm'], skillTags: ['security', 'access-control', 'cctv', 'fire-alarm'], confidence: 70 },
  { keywords: ['lift tech', 'elevator', 'escalator', 'vertical transport'], skillTags: ['elevator', 'escalator'], confidence: 70 },
  { keywords: ['fire', 'fire alarm', 'fire suppression', 'sprinkler'], skillTags: ['fire-alarm', 'fire-suppression'], confidence: 70 },
  { keywords: ['bms', 'automation', 'controls', 'scada', 'building management'], skillTags: ['bms', 'automation', 'controls'], confidence: 70 },
  { keywords: ['mechanical', 'mep'], skillTags: ['hvac', 'plumbing', 'mechanical'], confidence: 60 },
  { keywords: ['generator', 'genset', 'emergency power'], skillTags: ['generator', 'electrical'], confidence: 70 },
  { keywords: ['ups', 'uninterruptible power'], skillTags: ['ups', 'electrical'], confidence: 70 },
  { keywords: ['water treatment', 'water quality'], skillTags: ['water-treatment', 'pumps'], confidence: 70 },
  { keywords: ['pump', 'pumping'], skillTags: ['pumps', 'mechanical'], confidence: 65 },
  { keywords: ['ahu', 'air handling'], skillTags: ['ahu', 'hvac'], confidence: 70 },
  { keywords: ['fcu', 'fan coil'], skillTags: ['hvac', 'ahu'], confidence: 70 },
  { keywords: ['cooling tower'], skillTags: ['cooling-tower', 'hvac'], confidence: 70 },
  { keywords: ['boiler'], skillTags: ['boiler', 'hvac'], confidence: 70 },
  { keywords: ['diesel', 'fuel'], skillTags: ['generator', 'mechanical'], confidence: 65 },
  { keywords: ['carpentry', 'carpenter', 'wood'], skillTags: ['carpentry', 'general-maintenance'], confidence: 65 },
  { keywords: ['painting', 'painter'], skillTags: ['painting', 'general-maintenance'], confidence: 65 },
  { keywords: ['masonry', 'mason', 'concrete'], skillTags: ['masonry', 'general-maintenance'], confidence: 65 },
  { keywords: ['handyman', 'general maintenance', 'multi-skilled', 'technician'], skillTags: ['general-maintenance', 'handyman', 'multi-skilled'], confidence: 50 },
  { keywords: ['landscaping', 'gardening', 'irrigation'], skillTags: ['landscaping', 'irrigation'], confidence: 65 },
  { keywords: ['pool', 'swimming pool'], skillTags: ['pool-maintenance', 'water-treatment'], confidence: 70 },
  { keywords: ['pest control', 'fumigation'], skillTags: ['pest-control'], confidence: 70 },
  { keywords: ['window cleaning', 'facade'], skillTags: ['facade-cleaning'], confidence: 70 },
];

function inferSkillTagsFromName(technicianName: string): string[] {
  const nameLower = technicianName.toLowerCase();
  const inferredTags = new Set<string>();

  for (const mapping of NAME_BASED_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (nameLower.includes(keyword)) {
        mapping.skillTags.forEach(tag => inferredTags.add(tag));
        break;
      }
    }
  }

  return Array.from(inferredTags);
}

function getNameBasedMatchConfidence(technicianName: string, requiredSkillTags: string[]): number {
  const nameLower = technicianName.toLowerCase();
  let maxConfidence = 0;

  for (const mapping of NAME_BASED_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (nameLower.includes(keyword)) {
        const matchingSkills = mapping.skillTags.filter(tag => requiredSkillTags.includes(tag));
        if (matchingSkills.length > 0) {
          maxConfidence = Math.max(maxConfidence, mapping.confidence);
        }
      }
    }
  }

  return maxConfidence;
}

function calculateSkillMatch(
  technicianSkillTags: string[],
  requiredSkillTags: string[],
  taskComplexity: 'high' | 'medium' | 'low'
): { score: number; reasons: string[]; matchMethod: 'skill-tags' | 'fallback' } {
  const reasons: string[] = [];
  let score = 0;

  if (technicianSkillTags.length === 0) {
    reasons.push('No skills configured - please set skill tags');
    return { score: 10, reasons, matchMethod: 'fallback' };
  }

  if (requiredSkillTags.length === 0) {
    reasons.push('Asset has no recognizable skill requirements');
    return { score: 30, reasons, matchMethod: 'fallback' };
  }

  const matchingSkills = technicianSkillTags.filter(tag =>
    requiredSkillTags.includes(tag)
  );

  if (matchingSkills.length > 0) {
    const matchPercentage = matchingSkills.length / requiredSkillTags.length;
    score += 50 + (matchPercentage * 30);

    const skillNames = matchingSkills
      .map(id => getSkillTagById(id)?.label || id)
      .join(', ');

    if (matchingSkills.length === requiredSkillTags.length) {
      reasons.push(`Perfect match: ${skillNames}`);
    } else {
      reasons.push(`Partial match: ${skillNames}`);
    }
  } else if (technicianSkillTags.includes('general-maintenance') ||
             technicianSkillTags.includes('handyman') ||
             technicianSkillTags.includes('multi-skilled')) {
    score += 35;
    reasons.push('General maintenance skills applicable');
  } else {
    score += 10;
    reasons.push('Limited skill match - manual review recommended');
  }

  if (taskComplexity === 'high' && score > 40) {
    score += 10;
    reasons.push('Suitable for complex task');
  } else if (taskComplexity === 'low' && score > 50) {
    reasons.push('May be overqualified for simple task');
  }

  return { score, reasons, matchMethod: 'skill-tags' };
}

function calculateNameBasedMatch(
  technicianName: string,
  requiredSkillTags: string[],
  taskComplexity: 'high' | 'medium' | 'low'
): { score: number; reasons: string[]; matchMethod: 'name-based' } {
  const reasons: string[] = [];
  const inferredTags = inferSkillTagsFromName(technicianName);

  if (inferredTags.length === 0) {
    reasons.push('No recognizable skills from technician name');
    return { score: 20, reasons, matchMethod: 'name-based' };
  }

  if (requiredSkillTags.length === 0) {
    reasons.push('Asset has no recognizable skill requirements');
    return { score: 30, reasons, matchMethod: 'name-based' };
  }

  const matchingSkills = inferredTags.filter(tag => requiredSkillTags.includes(tag));

  if (matchingSkills.length > 0) {
    const baseConfidence = getNameBasedMatchConfidence(technicianName, requiredSkillTags);
    const matchPercentage = matchingSkills.length / requiredSkillTags.length;
    const score = baseConfidence * (0.7 + matchPercentage * 0.3);

    const skillNames = matchingSkills
      .map(id => getSkillTagById(id)?.label || id)
      .join(', ');

    reasons.push(`Name-based match: ${skillNames}`);
    reasons.push('Consider adding skill tags for better matching');

    if (matchingSkills.length === requiredSkillTags.length) {
      reasons.push('Complete match from name analysis');
    }

    return { score, reasons, matchMethod: 'name-based' };
  }

  if (inferredTags.includes('general-maintenance') ||
      inferredTags.includes('handyman') ||
      inferredTags.includes('multi-skilled')) {
    reasons.push('General maintenance capabilities inferred from name');
    return { score: 40, reasons, matchMethod: 'name-based' };
  }

  reasons.push('No skill match found from name analysis');
  return { score: 25, reasons, matchMethod: 'name-based' };
}

function determineTaskComplexity(
  hoursPerVisit: number,
  requiredSkillTags: string[]
): 'high' | 'medium' | 'low' {
  const complexSkills = [
    'bms', 'automation', 'controls', 'scada',
    'chiller', 'elevator', 'escalator',
    'fire-suppression', 'medical-equipment'
  ];

  const hasComplexSkill = requiredSkillTags.some(tag =>
    complexSkills.includes(tag)
  );

  if (hasComplexSkill || hoursPerVisit > 4) {
    return 'high';
  }

  if (hoursPerVisit > 2 || requiredSkillTags.length > 2) {
    return 'medium';
  }

  return 'low';
}

function calculateCostEfficiency(
  technicianSalary: number,
  taskComplexity: 'high' | 'medium' | 'low',
  allSalaries: number[]
): 'optimal' | 'acceptable' | 'expensive' {
  if (allSalaries.length === 0) return 'acceptable';

  const avgSalary = allSalaries.reduce((sum, s) => sum + s, 0) / allSalaries.length;

  if (taskComplexity === 'high') {
    return technicianSalary >= avgSalary * 0.8 ? 'optimal' : 'acceptable';
  }

  if (taskComplexity === 'low') {
    if (technicianSalary > avgSalary * 1.3) {
      return 'expensive';
    }
    return technicianSalary < avgSalary ? 'optimal' : 'acceptable';
  }

  return 'acceptable';
}

function calculateWorkloadScore(
  technicianId: string,
  existingAssignments: Map<string, number>
): number {
  const currentWorkload = existingAssignments.get(technicianId) || 0;
  const maxWorkload = Math.max(...Array.from(existingAssignments.values()), 1);

  if (maxWorkload === 0) return 100;

  const normalizedWorkload = currentWorkload / maxWorkload;
  return Math.max(0, 100 - normalizedWorkload * 100);
}

export function suggestTechniciansForTask(
  requirements: TaskRequirements,
  technicians: TechnicianType[],
  existingAssignments?: Map<string, number>
): TechnicianMatch[] {
  if (technicians.length === 0) {
    return [];
  }

  const nonSupervisors = technicians.filter(tech => !tech.canSupervise);

  if (nonSupervisors.length === 0) {
    return [];
  }

  const requiredSkillTags = [
    ...detectSkillTagsFromText(requirements.assetCategory),
    ...detectSkillTagsFromText(requirements.assetName),
    ...(requirements.taskName ? detectSkillTagsFromText(requirements.taskName) : []),
  ];

  const uniqueSkills = [...new Set(requiredSkillTags)];
  const taskComplexity = determineTaskComplexity(requirements.hoursPerVisit, uniqueSkills);

  const allSalaries = nonSupervisors.map(t => t.monthlySalary + t.additionalCost);
  const workloadMap = existingAssignments || new Map<string, number>();

  const techniciansWithSkills = nonSupervisors.filter(tech => {
    const techSkills = tech.skillTags || [];
    return techSkills.length > 0;
  });

  const techniciansWithoutSkills = nonSupervisors.filter(tech => {
    const techSkills = tech.skillTags || [];
    return techSkills.length === 0;
  });

  const skillBasedMatches: TechnicianMatch[] = techniciansWithSkills.map(tech => {
    const skillMatch = calculateSkillMatch(
      tech.skillTags || [],
      uniqueSkills,
      taskComplexity
    );

    const costEfficiency = calculateCostEfficiency(
      tech.monthlySalary + tech.additionalCost,
      taskComplexity,
      allSalaries
    );

    const workloadScore = calculateWorkloadScore(tech.id, workloadMap);
    const finalScore = Math.min(100, skillMatch.score * 0.7 + workloadScore * 0.3);
    const reasons = [...skillMatch.reasons];

    if (workloadScore > 80) {
      reasons.push('Low current workload - available capacity');
    } else if (workloadScore < 30) {
      reasons.push('High current workload - may be overloaded');
    }

    if (costEfficiency === 'optimal') {
      reasons.push('Cost-effective for task complexity');
    } else if (costEfficiency === 'expensive') {
      reasons.push('Higher cost - consider alternatives');
    }

    return {
      technicianId: tech.id,
      technicianName: tech.name,
      confidence: Math.round(finalScore),
      reasons,
      costEfficiency,
      workloadScore: Math.round(workloadScore),
      matchMethod: skillMatch.matchMethod,
    };
  });

  const bestSkillMatch = skillBasedMatches.length > 0
    ? skillBasedMatches.sort((a, b) => b.confidence - a.confidence)[0]
    : null;

  if (bestSkillMatch && bestSkillMatch.confidence >= 40) {
    return skillBasedMatches.sort((a, b) => b.confidence - a.confidence);
  }

  const nameBasedMatches: TechnicianMatch[] = techniciansWithoutSkills.map(tech => {
    const nameMatch = calculateNameBasedMatch(
      tech.name,
      uniqueSkills,
      taskComplexity
    );

    const costEfficiency = calculateCostEfficiency(
      tech.monthlySalary + tech.additionalCost,
      taskComplexity,
      allSalaries
    );

    const workloadScore = calculateWorkloadScore(tech.id, workloadMap);
    const finalScore = Math.min(100, nameMatch.score * 0.7 + workloadScore * 0.3);
    const reasons = [...nameMatch.reasons];

    if (workloadScore > 80) {
      reasons.push('Low current workload - available capacity');
    } else if (workloadScore < 30) {
      reasons.push('High current workload - may be overloaded');
    }

    if (costEfficiency === 'optimal') {
      reasons.push('Cost-effective for task complexity');
    } else if (costEfficiency === 'expensive') {
      reasons.push('Higher cost - consider alternatives');
    }

    return {
      technicianId: tech.id,
      technicianName: tech.name,
      confidence: Math.round(finalScore),
      reasons,
      costEfficiency,
      workloadScore: Math.round(workloadScore),
      matchMethod: nameMatch.matchMethod,
    };
  });

  const allMatches = [...skillBasedMatches, ...nameBasedMatches];
  return allMatches.sort((a, b) => b.confidence - a.confidence);
}

export function getBestTechnicianMatch(
  requirements: TaskRequirements,
  technicians: TechnicianType[],
  existingAssignments?: Map<string, number>
): TechnicianMatch | null {
  const matches = suggestTechniciansForTask(requirements, technicians, existingAssignments);

  if (matches.length === 0) return null;

  const bestMatch = matches[0];

  if (bestMatch.confidence < 40) {
    return null;
  }

  return bestMatch;
}

export function analyzeWorkloadBalance(
  assets: AssetType[],
  technicians: TechnicianType[]
): Map<string, { assignedTasks: number; estimatedHours: number }> {
  const workload = new Map<string, { assignedTasks: number; estimatedHours: number }>();

  technicians.forEach(tech => {
    workload.set(tech.id, { assignedTasks: 0, estimatedHours: 0 });
  });

  assets.forEach(asset => {
    asset.ppmTasks.forEach(task => {
      const current = workload.get(task.technicianTypeId);
      if (current) {
        current.assignedTasks += 1;
        current.estimatedHours += task.hoursPerVisit;
      }
    });

    if (asset.reactive.technicianTypeId) {
      const current = workload.get(asset.reactive.technicianTypeId);
      if (current) {
        current.assignedTasks += 1;
        current.estimatedHours += asset.reactive.avgHoursPerCall;
      }
    }
  });

  return workload;
}
