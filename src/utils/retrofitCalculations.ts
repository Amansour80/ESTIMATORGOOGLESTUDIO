import { RetrofitState, RetrofitResults } from '../types/retrofit';
import { calculateBOQSummary } from './boqCalculations';
import { OrgRetrofitLabor } from './laborLibraryDatabase';

export function calculateRetrofitResults(state: RetrofitState, orgLaborLibrary: OrgRetrofitLabor[] = []): RetrofitResults {
  if (state.projectInfo.estimationMode === 'boq' && state.boqLineItems && state.boqLineItems.length > 0) {
    return calculateRetrofitResultsFromBOQ(state, orgLaborLibrary);
  }

  return calculateRetrofitResultsStandard(state);
}

function calculateRetrofitResultsFromBOQ(state: RetrofitState, orgLaborLibrary: OrgRetrofitLabor[]): RetrofitResults {
  const boqSummary = calculateBOQSummary(state.boqLineItems || [], orgLaborLibrary);

  const baseCost = boqSummary.grandTotal;

  const overheadsCost = baseCost / (1 - (state.costConfig.overheadsPercent / 100)) - baseCost;
  const riskContingencyCost = baseCost * ((state.costConfig.riskContingencyPercent || 0) / 100);
  const pmGeneralsCost = baseCost * ((state.costConfig.pmGeneralsPercent || 0) / 100);
  const performanceBondCost = baseCost * (state.costConfig.performanceBondPercent / 100);
  const insuranceCost = baseCost * (state.costConfig.insurancePercent / 100);
  const warrantyCost = baseCost * (state.costConfig.warrantyPercent / 100);

  const subtotalBeforeProfit = baseCost + overheadsCost + riskContingencyCost + pmGeneralsCost + performanceBondCost + insuranceCost + warrantyCost;
  const profitAmount = subtotalBeforeProfit / (1 - (state.costConfig.profitPercent / 100)) - subtotalBeforeProfit;
  const grandTotal = subtotalBeforeProfit + profitAmount;

  const projectStartDate = new Date(state.projectInfo.startDate);
  const projectEndDate = new Date(state.projectInfo.endDate);
  const projectDurationDays = Math.ceil(
    (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalManpowerCost: boqSummary.totalLaborCost,
    totalAssetCost: 0,
    totalRemovalCost: 0,
    totalMaterialsCost: boqSummary.totalMaterialCost,
    totalSubcontractorCost: boqSummary.totalSubcontractorCost,
    totalSupervisionCost: boqSummary.totalSupervisionCost,
    totalLogisticsCost: boqSummary.totalDirectCost,
    baseCost,
    overheadsCost,
    riskContingencyCost,
    pmGeneralsCost,
    performanceBondCost,
    insuranceCost,
    warrantyCost,
    subtotalBeforeProfit,
    profitAmount,
    grandTotal,
    totalAssetQuantity: 0,
    costPerAssetUnit: 0,
    projectDurationDays,
    totalManpowerHours: 0,
  };
}

function calculateRetrofitResultsStandard(state: RetrofitState): RetrofitResults {
  let totalManpowerCost = 0;
  let totalManpowerHours = 0;

  state.manpowerItems.forEach((item) => {
    const laborType = state.laborLibrary.find((l) => l.id === item.laborTypeId);
    if (laborType) {
      const laborCost = item.estimatedHours * laborType.hourlyRate;
      totalManpowerCost += laborCost + item.mobilizationCost + item.demobilizationCost;
      totalManpowerHours += item.estimatedHours;
    }
  });

  let totalAssetCost = 0;
  let totalRemovalCost = 0;
  let totalAssetQuantity = 0;

  state.assets.forEach((asset) => {
    totalAssetCost += asset.quantity * asset.unitCost;
    totalRemovalCost += asset.quantity * asset.removalCostPerUnit;
    totalAssetQuantity += asset.quantity;
  });

  let totalMaterialsCost = 0;
  state.materialsCatalog.forEach((material) => {
    totalMaterialsCost += material.estimatedQty * material.unitRate;
  });

  let totalSubcontractorCost = 0;
  state.subcontractors.forEach((sub) => {
    if (sub.pricingMode === 'lump_sum') {
      totalSubcontractorCost += sub.lumpSumCost;
    } else {
      totalSubcontractorCost += sub.quantity * sub.unitCost;
    }
  });

  let totalSupervisionCost = 0;
  state.supervisionRoles.forEach((role) => {
    const laborType = state.laborLibrary.find((l) => l.id === role.laborTypeId);
    if (laborType) {
      const monthlyCost = (laborType.monthlySalary || 0) + (laborType.additionalCost || 0);
      const hourlyRateFallback = laborType.hourlyRate * 160;
      const costPerMonth = monthlyCost > 0 ? monthlyCost : hourlyRateFallback;
      totalSupervisionCost += role.count * role.durationMonths * costPerMonth;
    }
  });

  let totalLogisticsCost = 0;
  state.logisticsItems.forEach((item) => {
    totalLogisticsCost += item.quantity * item.unitRate;
  });

  const baseCost =
    totalManpowerCost + totalAssetCost + totalRemovalCost + totalMaterialsCost + totalSubcontractorCost + totalSupervisionCost + totalLogisticsCost;

  const overheadsCost = baseCost / (1 - (state.costConfig.overheadsPercent / 100))-baseCost;
  const riskContingencyCost = baseCost * ((state.costConfig.riskContingencyPercent || 0) / 100);
  const pmGeneralsCost = baseCost * ((state.costConfig.pmGeneralsPercent || 0) / 100);
  const performanceBondCost = baseCost * (state.costConfig.performanceBondPercent / 100);
  const insuranceCost = baseCost * (state.costConfig.insurancePercent / 100);
  const warrantyCost = baseCost * (state.costConfig.warrantyPercent / 100);

  const subtotalBeforeProfit = baseCost + overheadsCost + riskContingencyCost + pmGeneralsCost + performanceBondCost + insuranceCost + warrantyCost;
  const profitAmount = subtotalBeforeProfit / (1 - (state.costConfig.profitPercent / 100)) - subtotalBeforeProfit;
  const grandTotal = subtotalBeforeProfit + profitAmount;

  const costPerAssetUnit = totalAssetQuantity > 0 ? grandTotal / totalAssetQuantity : 0;

  const projectStartDate = new Date(state.projectInfo.startDate);
  const projectEndDate = new Date(state.projectInfo.endDate);
  const projectDurationDays = Math.ceil(
    (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalManpowerCost,
    totalAssetCost,
    totalRemovalCost,
    totalMaterialsCost,
    totalSubcontractorCost,
    totalSupervisionCost,
    totalLogisticsCost,
    baseCost,
    overheadsCost,
    riskContingencyCost,
    pmGeneralsCost,
    performanceBondCost,
    insuranceCost,
    warrantyCost,
    subtotalBeforeProfit,
    profitAmount,
    grandTotal,
    totalAssetQuantity,
    costPerAssetUnit,
    projectDurationDays,
    totalManpowerHours,
  };
}
