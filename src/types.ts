export type Frequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly' | 'Semiannual' | 'Annual';

export type Bucket = 'Machine' | 'Manual-Detail' | 'Manual-General';

export interface ProjectInfo {
  clientName?: string;
  projectName: string;
  projectLocation: string;
  projectType: string;
}

export interface AreaRow {
  id: string;
  name: string;
  sqm: number;
  frequency: Frequency;
  dailyFrequency?: number;
  bucket: Bucket;
  machineId?: string;
}

export type EstimationMode = 'output_base' | 'input_base';

export interface SiteConfig {
  estimationMode: EstimationMode;
  totalCoverageDaysPerYear: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  publicHolidayDays: number;
  weeklyOffDays: number;
  shiftLengthHours: number;
  inputBaseCleaners?: number;
}

export interface ProductivityConfig {
  manualDetailSqmPerShift: number;
  manualGeneralSqmPerShift: number;
}

export interface CostsConfig {
  cleanerSalary: number;
  benefitsAllowances: number;
  supervisorSalary: number;
  supervisorCount: number;
  consumablesPerCleanerPerMonth: number;
  ppePerCleanerPerYear: number;
  overheadsPercent: number;
  profitMarkupPercent: number;
}

export interface Machine {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  lifeYears: number;
  maintenancePercent: number;
  sqmPerHour: number;
  effectiveHoursPerShift: number;
}

export interface EstimatorState {
  projectInfo: ProjectInfo;
  site: SiteConfig;
  productivity: ProductivityConfig;
  areas: AreaRow[];
  costs: CostsConfig;
  machines: Machine[];
}
