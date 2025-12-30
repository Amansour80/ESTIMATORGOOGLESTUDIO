export type EstimationMode = 'standard' | 'boq';

export interface RetrofitProjectInfo {
  projectName: string;
  projectLocation: string;
  clientName: string;
  projectDescription: string;
  startDate: string;
  endDate: string;
  estimationMode?: EstimationMode;
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
}

export interface LaborType {
  id: string;
  name?: string;
  role: string;
  monthlySalary?: number;
  additionalCost?: number;
  hourlyRate: number;
  notes: string;
}

export interface ManpowerItem {
  id: string;
  laborTypeId: string;
  description: string;
  estimatedHours: number;
  mobilizationCost: number;
  demobilizationCost: number;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  removalCostPerUnit: number;
}

export interface MaterialItem {
  id: string;
  category: string;
  item: string;
  unit: string;
  unitRate: number;
  estimatedQty: number;
  notes: string;
}

export type SubcontractorCategory = 'hvac' | 'electrical' | 'plumbing' | 'civil' | 'testing_commissioning' | 'other';
export type SubcontractorPricingMode = 'lump_sum' | 'per_unit';

export interface Subcontractor {
  id: string;
  category: SubcontractorCategory;
  description: string;
  pricingMode: SubcontractorPricingMode;
  lumpSumCost: number;
  quantity: number;
  unitCost: number;
}

export interface LogisticsItem {
  id: string;
  description: string;
  quantity: number;
  unitRate: number;
  notes: string;
}

export interface SupervisionRole {
  id: string;
  laborTypeId: string;
  count: number;
  durationMonths: number;
}

export interface RetrofitCostConfig {
  overheadsPercent: number;
  profitPercent: number;
  performanceBondPercent: number;
  insurancePercent: number;
  warrantyPercent: number;
  riskContingencyPercent: number;
  pmGeneralsPercent: number;
}

export interface RetrofitState {
  projectInfo: RetrofitProjectInfo;
  projectPhases: ProjectPhase[];
  laborLibrary: LaborType[];
  manpowerItems: ManpowerItem[];
  assets: Asset[];
  materialsCatalog: MaterialItem[];
  subcontractors: Subcontractor[];
  supervisionRoles: SupervisionRole[];
  logisticsItems: LogisticsItem[];
  costConfig: RetrofitCostConfig;
  boqLineItems?: import('../types/boq').BOQLineItem[];
}

export interface RetrofitResults {
  totalManpowerCost: number;
  totalAssetCost: number;
  totalRemovalCost: number;
  totalMaterialsCost: number;
  totalSubcontractorCost: number;
  totalSupervisionCost: number;
  totalLogisticsCost: number;
  baseCost: number;
  overheadsCost: number;
  performanceBondCost: number;
  insuranceCost: number;
  warrantyCost: number;
  riskContingencyCost: number;
  pmGeneralsCost: number;
  subtotalBeforeProfit: number;
  profitAmount: number;
  grandTotal: number;
  totalAssetQuantity: number;
  costPerAssetUnit: number;
  projectDurationDays: number;
  totalManpowerHours: number;
}
