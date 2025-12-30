import type { FMEstimatorState, TechnicianType, AssetType } from '../types/fm';

export const getDefaultFMState = (): FMEstimatorState => {
  const totalCoverageDaysPerYear = 365;
  const annualLeaveDays = 30;
  const sickLeaveDays = 10;
  const publicHolidayDays = 10;
  const weeklyOffDays = 52;
  const shiftLength = 12;
  const breakMinutes = 60;

  const totalLeaveDays = annualLeaveDays + sickLeaveDays + publicHolidayDays + weeklyOffDays;
  const effectiveWorkingDays = 365 - totalLeaveDays;
  const coverageFactor = effectiveWorkingDays > 0 ? totalCoverageDaysPerYear / effectiveWorkingDays : 1;

  return {
    projectInfo: {
      projectName: '',
      projectLocation: '',
      projectType: '',
    },
    globalAssumptions: {
      contractMode: 'output_base',
      useIndustryStandard: false,
      useAssetLibrary: true,
      totalCoverageDaysPerYear,
      annualLeaveDays,
      sickLeaveDays,
      publicHolidayDays,
      weeklyOffDays,
      shiftLength,
      breakMinutes,
      coverageFactor,
      effectiveHours: shiftLength - breakMinutes / 60,
      transportationMinutes: 0,
      overtimeMode: 'manual',
      overtimeMultiplier: 1.5,
      overtimeThresholdPercent: 15,
    },
    technicianLibrary: getDefaultTechnicianLibrary(),
    deployedTechnicians: [],
    assetTypes: [],
    assetInventory: [],
    materialsCatalog: [],
    consumablesCatalog: [],
    specializedServices: [],
    supervisory: {
      supportRoles: [],
    },
    contractModel: {
      global: 'fully_comprehensive',
      categoryOverrides: {},
      costPlusHandlingFee: 10,
    },
    costConfig: {
      inHouse: {
        overheadsPercent: 10,
        markupPercent: 15,
      },
      subcontract: {
        overheadsPercent: 5,
        markupPercent: 10,
      },
    },
  };
};

export const getDefaultTechnicianLibrary = (): TechnicianType[] => {
  return [
    {
      id: 'tech-hvac-sr',
      name: 'HVAC Tech (Senior)',
      skillTags: [],
      monthlySalary: 4500,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: false,
    },
    {
      id: 'tech-hvac',
      name: 'HVAC Tech',
      skillTags: [],
      monthlySalary: 3500,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: false,
    },
    {
      id: 'tech-electrical',
      name: 'Electrical Tech',
      skillTags: [],
      monthlySalary: 3500,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: false,
    },
    {
      id: 'tech-plumbing',
      name: 'Plumbing Tech',
      skillTags: [],
      monthlySalary: 3500,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: false,
    },
    {
      id: 'tech-multi',
      name: 'Multi-skilled Tech',
      skillTags: [],
      monthlySalary: 3800,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: false,
    },
    {
      id: 'helper',
      name: 'Helper',
      skillTags: [],
      monthlySalary: 2000,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: false,
    },
    {
      id: 'supervisor',
      name: 'Supervisor',
      skillTags: [],
      monthlySalary: 5000,
      additionalCost: 300,
      expectedOvertimeHoursPerMonth: 0,
      inputBaseCount: 0,
      notes: '',
      canSupervise: true,
    },
  ];
};

export const getDefaultAssetTypes = (): AssetType[] => {
  return [
    {
      id: 'asset-hvac-split',
      category: 'HVAC',
      assetName: 'Split AC Unit',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Quarterly Service',
          frequency: 'quarterly',
          hoursPerVisit: 1.5,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 2,
        avgHoursPerCall: 2,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Standard wall-mounted split units',
    },
    {
      id: 'asset-hvac-package',
      category: 'HVAC',
      assetName: 'Package AC Unit',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Quarterly Service',
          frequency: 'quarterly',
          hoursPerVisit: 3,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 3,
        avgHoursPerCall: 4,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Rooftop package units',
    },
    {
      id: 'asset-hvac-ahu',
      category: 'HVAC',
      assetName: 'Air Handling Unit (AHU)',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Monthly Inspection',
          frequency: 'monthly',
          hoursPerVisit: 2,
          technicianTypeId: '',
        },
        {
          id: 'ppm-2',
          taskName: 'Quarterly Deep Service',
          frequency: 'quarterly',
          hoursPerVisit: 4,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 4,
        avgHoursPerCall: 3,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Central AHU systems',
    },
    {
      id: 'asset-elec-db',
      category: 'Electrical',
      assetName: 'Distribution Board',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Quarterly Inspection',
          frequency: 'quarterly',
          hoursPerVisit: 1,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 1,
        avgHoursPerCall: 2,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Main and sub distribution boards',
    },
    {
      id: 'asset-elec-light',
      category: 'Electrical',
      assetName: 'Light Fixture',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Annual Inspection',
          frequency: 'annual',
          hoursPerVisit: 0.1,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 0.5,
        avgHoursPerCall: 0.5,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'All lighting fixtures',
    },
    {
      id: 'asset-plumb-pump',
      category: 'Plumbing',
      assetName: 'Water Pump',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Monthly Check',
          frequency: 'monthly',
          hoursPerVisit: 1,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 3,
        avgHoursPerCall: 3,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Water supply and drainage pumps',
    },
    {
      id: 'asset-fa-panel',
      category: 'Fire Alarm',
      assetName: 'Fire Alarm Panel',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Monthly Test',
          frequency: 'monthly',
          hoursPerVisit: 2,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 2,
        avgHoursPerCall: 2,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Fire alarm control panels',
    },
    {
      id: 'asset-fa-detector',
      category: 'Fire Alarm',
      assetName: 'Smoke/Heat Detector',
      ppmTasks: [
        {
          id: 'ppm-1',
          taskName: 'Semi-annual Test',
          frequency: 'semiannual',
          hoursPerVisit: 0.15,
          technicianTypeId: '',
        },
      ],
      reactive: {
        reactiveCallsPercent: 0.2,
        avgHoursPerCall: 0.5,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      notes: 'Individual detectors',
    },
  ];
};

export const frequencyDivisors: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  semiannual: 182,
  annual: 365,
};

export const frequencyMultipliers: Record<string, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};
