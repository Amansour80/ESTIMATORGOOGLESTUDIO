import { BOQLineItem, BOQLineItemCalculation, BOQSummary } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';

export function calculateLineItemTotals(
  item: BOQLineItem,
  laborLibrary: OrgRetrofitLabor[]
): BOQLineItemCalculation {
  const totalMaterialCost = item.quantity * item.unitMaterialCost;

  let laborCost = 0;
  if (item.laborDetailId && item.laborHours > 0) {
    const labor = laborLibrary.find(l => l.id === item.laborDetailId);
    if (labor) {
      const hourlyRate = labor.hourly_rate || (labor.monthly_salary + labor.additional_cost) / 208;
      laborCost = item.laborHours * hourlyRate;
    }
  }

  let supervisionCost = 0;
  if (item.supervisionDetailId && item.supervisionHours > 0) {
    const supervisor = laborLibrary.find(l => l.id === item.supervisionDetailId);
    if (supervisor) {
      const hourlyRate = supervisor.hourly_rate || (supervisor.monthly_salary + supervisor.additional_cost) / 208;
      supervisionCost = item.supervisionHours * hourlyRate;
    }
  }

  const totalDirectCost = item.quantity * item.directCost;
  const totalSubcontractorCost = item.quantity * item.subcontractorCost;

  const lineTotal = totalMaterialCost + laborCost + supervisionCost + totalDirectCost + totalSubcontractorCost;

  return {
    totalMaterialCost,
    laborCost,
    supervisionCost,
    lineTotal
  };
}

export function calculateBOQSummary(
  lineItems: BOQLineItem[],
  laborLibrary: OrgRetrofitLabor[]
): BOQSummary {
  let totalMaterialCost = 0;
  let totalLaborCost = 0;
  let totalSupervisionCost = 0;
  let totalDirectCost = 0;
  let totalSubcontractorCost = 0;
  const categoryBreakdown: Record<string, number> = {};

  lineItems.forEach(item => {
    const calcs = calculateLineItemTotals(item, laborLibrary);

    totalMaterialCost += calcs.totalMaterialCost;
    totalLaborCost += calcs.laborCost;
    totalSupervisionCost += calcs.supervisionCost;
    totalDirectCost += item.quantity * item.directCost;
    totalSubcontractorCost += item.quantity * item.subcontractorCost;

    if (!categoryBreakdown[item.category]) {
      categoryBreakdown[item.category] = 0;
    }
    categoryBreakdown[item.category] += calcs.lineTotal;
  });

  const grandTotal = totalMaterialCost + totalLaborCost + totalSupervisionCost + totalDirectCost + totalSubcontractorCost;

  return {
    totalMaterialCost,
    totalLaborCost,
    totalSupervisionCost,
    totalDirectCost,
    totalSubcontractorCost,
    grandTotal,
    categoryBreakdown,
    lineItemCount: lineItems.length
  };
}

export function getHourlyRate(labor: OrgRetrofitLabor): number {
  return labor.hourly_rate || (labor.monthly_salary + labor.additional_cost) / 208;
}

export function formatLaborDropdownText(labor: OrgRetrofitLabor, currency: string): string {
  const hourlyRate = getHourlyRate(labor);
  return `${labor.role} (${hourlyRate.toFixed(2)} ${currency}/hr)`;
}

export function parseLaborDropdownText(text: string): { role: string; rate: number } | null {
  const match = text.match(/^(.+?)\s*\((\d+\.?\d*)\s*([A-Z]+)\/hr\)$/);
  if (!match) return null;

  return {
    role: match[1].trim(),
    rate: parseFloat(match[2])
  };
}
