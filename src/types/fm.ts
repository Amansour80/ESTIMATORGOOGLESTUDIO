export type ShiftLength = number;

export type ContractModel = 'fully_comprehensive' | 'semi_comprehensive' | 'cost_plus';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type ResponsibilityType = 'in_house' | 'subcontract';

export type PricingMode = 'per_asset' | 'lump_sum';

export type DeploymentModel = 'resident' | 'rotating';

export type OvertimeMode = 'manual' | 'auto';

export type ContractEstimationMode = 'output_base' | 'input_base';

export interface ProjectInfo {
  clientName?: string;
  projectName: string;
  projectLocation: string;
  projectType: string;
}

export interface GlobalAssumptions {
  contractMode: ContractEstimationMode;
  useIndustryStandard: boolean;
  useAssetLibrary: boolean;
  totalCoverageDaysPerYear: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  publicHolidayDays: number;
  weeklyOffDays: number;
  shiftLength: ShiftLength;
  breakMinutes: number;
  coverageFactor: number;
  effectiveHours: number;
  transportationMinutes: number;
  overtimeMode: OvertimeMode;
  overtimeMultiplier: number;
  overtimeThresholdPercent: number;
}

export interface TechnicianType {
  id: string;
  name: string;
  skillTags: string[];
  monthlySalary: number;
  additionalCost: number;
  hourlyRate?: number;
  expectedOvertimeHoursPerMonth: number;
  inputBaseCount: number;
  notes: string;
  canSupervise: boolean;
}

export interface PPMTask {
  id: string;
  taskName: string;
  frequency: Frequency;
  hoursPerVisit: number;
  technicianTypeId: string;
  isCritical?: boolean;
}

export interface ReactiveTask {
  reactiveCallsPercent: number;
  avgHoursPerCall: number;
  technicianTypeId: string;
  isMonthlyRate?: boolean;
}

export interface IndustryStandardAssetLibraryItem {
  id: string;
  standard_code: string;
  asset_name: string;
  category: string;
  description: string;
}

export interface IndustryStandardTask {
  id: string;
  task_name: string;
  frequency: string;
  hours_per_task: number;
  task_order: number;
}

export interface AssetType {
  id: string;
  category: string;
  assetName: string;
  standardCode?: string;
  standardTasks?: IndustryStandardTask[];
  ppmTasks: PPMTask[];
  reactive: ReactiveTask;
  responsibility: ResponsibilityType;
  notes: string;
}

export interface AssetInventory {
  id: string;
  assetTypeId: string;
  quantity: number;
  unitSubcontractCost?: number;
  notes: string;
}

export interface MaterialItem {
  id: string;
  category: string;
  item: string;
  unit: string;
  unitRate: number;
  expectedAnnualQty: number;
  included: boolean;
}

export interface ConsumableItem {
  id: string;
  category: string;
  item: string;
  unit: string;
  unitRate: number;
  expectedAnnualQty: number;
  included: boolean;
}

export interface DeployedTechnician {
  id: string;
  technicianTypeId: string;
  quantity: number;
  notes: string;
}

export interface SpecializedService {
  id: string;
  serviceName: string;
  type: string;
  pricingMode: PricingMode;
  qty: number;
  frequency: Frequency;
  unitCost?: number;
  annualCost?: number;
  linkedAssetTypeIds: string[];
  notes: string;
}

export interface SupportRole {
  id: string;
  technicianTypeId: string;
  count: number;
  deploymentModel: DeploymentModel;
}

export interface SupervisoryConfig {
  supportRoles: SupportRole[];
}

export interface ContractModelConfig {
  global: ContractModel;
  categoryOverrides: Record<string, ContractModel>;
  costPlusHandlingFee: number;
}

export interface CostConfig {
  inHouse: {
    overheadsPercent: number;
    markupPercent: number;
  };
  subcontract: {
    overheadsPercent: number;
    markupPercent: number;
  };
}

export interface FMEstimatorState {
  projectInfo: ProjectInfo;
  globalAssumptions: GlobalAssumptions;
  technicianLibrary: TechnicianType[];
  deployedTechnicians: DeployedTechnician[];
  assetTypes: AssetType[];
  assetInventory: AssetInventory[];
  materialsCatalog: MaterialItem[];
  consumablesCatalog: ConsumableItem[];
  specializedServices: SpecializedService[];
  supervisory: SupervisoryConfig;
  contractModel: ContractModelConfig;
  costConfig: CostConfig;
  schemaVersion?: number;
}

export interface ManpowerByType {
  techTypeId: string;
  techTypeName: string;
  totalAnnualHours: number;
  activeFTE: number;
  totalWithRelievers: number;
  relieversCount: number;
  deploymentModel: DeploymentModel;
  headcount: number;
  regularMonthlyCost: number;
  overtimeMonthlyHours: number;
  overtimeMonthlyCost: number;
  monthlyCost: number;
  annualCost: number;
}

export interface InHouseCostStack {
  manpowerAnnual: number;
  supervisionAnnual: number;
  overtimeAnnual: number;
  materialsAnnual: number;
  consumablesAnnual: number;
  overheads: number;
  subtotal: number;
  profit: number;
  selling: number;
}

export interface SubcontractCostStack {
  baseAnnual: number;
  overheads: number;
  subtotal: number;
  profit: number;
  selling: number;
}

export interface FMResults {
  manpowerByType: ManpowerByType[];
  totalActiveFTE: number;
  totalWithRelievers: number;
  totalResidentHeadcount: number;
  totalRotatingFTE: number;
  supervisorsCount: number;
  supervisorDeploymentModel: DeploymentModel;
  totalInHouseHeadcount: number;
  inHouseStack: InHouseCostStack;
  subcontractStack: SubcontractCostStack;
  grandTotal: number;
  validationWarnings?: string[];
}
