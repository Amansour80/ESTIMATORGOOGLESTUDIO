export const BOQ_CATEGORIES = [
  'Preliminary',
  'Testing & Commissioning',
  'Crane and Transport',
  'HVAC',
  'Plumbing',
  'Electrical',
  'ELV',
  'Civil',
  'Equipment',
  'Assets',
  'Materials',
  'Labor',
  'Subcontractor',
  'Others'
] as const;

export type BOQCategory = typeof BOQ_CATEGORIES[number];

export const STANDARD_UOMS = [
  'pcs',
  'set',
  'm',
  'm2',
  'm3',
  'kg',
  'ton',
  'ltr',
  'ls',
  'job',
  'each',
  'lot',
  'item',
  'unit'
] as const;

export interface BOQLineItem {
  id: string;
  category: string;
  description: string;
  uom: string;
  quantity: number;
  unitMaterialCost: number;
  laborDetailId: string | null;
  laborHours: number;
  supervisionDetailId: string | null;
  supervisionHours: number;
  directCost: number;
  subcontractorCost: number;
}

export interface BOQLineItemCalculation {
  totalMaterialCost: number;
  laborCost: number;
  supervisionCost: number;
  lineTotal: number;
}

export interface BOQSummary {
  totalMaterialCost: number;
  totalLaborCost: number;
  totalSupervisionCost: number;
  totalDirectCost: number;
  totalSubcontractorCost: number;
  grandTotal: number;
  categoryBreakdown: Record<string, number>;
  lineItemCount: number;
}

export interface BOQValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface BOQImportResult {
  success: boolean;
  lineItems?: BOQLineItem[];
  errors?: BOQValidationError[];
  summary?: BOQSummary;
}

export interface LaborDropdownItem {
  id: string;
  displayText: string;
  role: string;
  hourlyRate: number;
}
