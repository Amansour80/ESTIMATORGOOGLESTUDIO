import type {
  FMEstimatorState,
  FMResults,
  ManpowerByType,
  InHouseCostStack,
  SubcontractCostStack,
  DeploymentModel,
  ContractEstimationMode,
} from '../types/fm';
import { frequencyMultipliers } from './fmDefaults';

const safeNumber = (value: number): number => {
  if (isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return value;
};

function determineDeploymentModel(
  contractMode: ContractEstimationMode,
  hasCriticalTasks: boolean
): DeploymentModel {
  if (contractMode === 'input_base') {
    return 'resident';
  }

  if (hasCriticalTasks) {
    return 'resident';
  }

  return 'rotating';
}

function checkIfTechnicianHasCriticalTasks(
  technicianTypeId: string,
  state: FMEstimatorState
): boolean {
  for (const assetType of state.assetTypes) {
    // Skip subcontracted assets - they don't require in-house manpower
    if (assetType.responsibility === 'subcontract') continue;

    for (const task of assetType.ppmTasks) {
      if (task.technicianTypeId === technicianTypeId && task.isCritical) {
        return true;
      }
    }
  }
  return false;
}

export const calculateFMResults = (state: FMEstimatorState): FMResults => {
  const validationWarnings: string[] = [];

  // Check for orphaned technician references (only for in-house assets)
  const usedTechnicianIds = new Set<string>();
  state.assetTypes.forEach(asset => {
    // Skip subcontracted assets - they don't need technician assignments
    if (asset.responsibility === 'subcontract') return;

    asset.ppmTasks.forEach(task => usedTechnicianIds.add(task.technicianTypeId));
    usedTechnicianIds.add(asset.reactive.technicianTypeId);
  });

  const orphanedTechIds = Array.from(usedTechnicianIds).filter(
    techId => !state.technicianLibrary.find(t => t.id === techId)
  );

  if (orphanedTechIds.length > 0) {
    validationWarnings.push(
      `WARNING: ${orphanedTechIds.length} task(s) reference deleted technician(s). ` +
      `These tasks are EXCLUDED from calculations. Please reassign these tasks.`
    );
  }

  const manpowerByType = calculateManpowerByType(state);
  const totalActiveFTE = safeNumber(manpowerByType.reduce((sum, m) => sum + safeNumber(m.activeFTE), 0));
  const totalWithRelievers = safeNumber(manpowerByType.reduce((sum, m) => sum + safeNumber(m.totalWithRelievers), 0));
  const totalResidentHeadcount = manpowerByType
    .filter(m => m.deploymentModel === 'resident')
    .reduce((sum, m) => sum + Math.ceil(safeNumber(m.headcount)), 0);
  const totalRotatingFTE = manpowerByType
    .filter(m => m.deploymentModel === 'rotating')
    .reduce((sum, m) => sum + safeNumber(m.headcount), 0);

  // Calculate support roles headcount
  const supportResidentHeadcount = state.supervisory.supportRoles
    .filter(r => r.deploymentModel === 'resident')
    .reduce((sum, r) => sum + Math.ceil(r.count), 0);
  const supportRotatingFTE = state.supervisory.supportRoles
    .filter(r => r.deploymentModel === 'rotating')
    .reduce((sum, r) => sum + r.count, 0);
  const supportTotalHeadcount = supportResidentHeadcount + supportRotatingFTE;

  const totalInHouseHeadcount = totalResidentHeadcount + totalRotatingFTE + supportTotalHeadcount;

  const inHouseStack = calculateInHouseStack(state, manpowerByType);
  const subcontractStack = calculateSubcontractStack(state);

  const grandTotal = safeNumber(inHouseStack.selling + subcontractStack.selling);

  return {
    manpowerByType,
    totalActiveFTE,
    totalWithRelievers,
    totalResidentHeadcount,
    totalRotatingFTE,
    supervisorsCount: supportTotalHeadcount,
    supervisorDeploymentModel: 'resident',
    totalInHouseHeadcount,
    inHouseStack,
    subcontractStack,
    grandTotal,
    validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined,
  };
};

const calculateManpowerByType = (state: FMEstimatorState): ManpowerByType[] => {
  const annualWorkingHours = 365 * state.globalAssumptions.effectiveHours;

  if (state.globalAssumptions.contractMode === 'input_base') {
    return state.deployedTechnicians.map((deployed) => {
      const techType = state.technicianLibrary.find(t => t.id === deployed.technicianTypeId);
      if (!techType) {
        return null;
      }

      const activeFTE = deployed.quantity;
      const totalWithRelievers = activeFTE * state.globalAssumptions.coverageFactor;
      const relieversCount = totalWithRelievers - activeFTE;

      const totalAnnualHours = activeFTE * annualWorkingHours;

      // For resident: round up to full headcount. For rotating: use exact FTE
      const headcount = techType.deploymentModel === 'resident'
        ? Math.ceil(totalWithRelievers)
        : totalWithRelievers;

      const ctc = techType.monthlySalary + techType.additionalCost;
      const regularMonthlyCost = headcount * ctc;
      const monthlyCost = regularMonthlyCost;
      const annualCost = monthlyCost * 12;

      return {
        techTypeId: techType.id,
        techTypeName: techType.name,
        totalAnnualHours,
        activeFTE,
        totalWithRelievers,
        relieversCount,
        deploymentModel: 'resident',
        headcount,
        regularMonthlyCost,
        overtimeMonthlyHours: 0,
        overtimeMonthlyCost: 0,
        monthlyCost,
        annualCost,
      };
    }).filter(Boolean) as ManpowerByType[];
  }

  const hoursByType: Record<string, number> = {};

  state.assetInventory.forEach((inventory) => {
    const assetType = state.assetTypes.find((a) => a.id === inventory.assetTypeId);
    if (!assetType) return;

    // Skip subcontracted assets - they don't require manpower
    if (assetType.responsibility === 'subcontract') return;

    let ppmHoursPerAssetPerYear = 0;
    assetType.ppmTasks.forEach((task) => {
      const visits = frequencyMultipliers[task.frequency];
      const hoursPerYear = visits * task.hoursPerVisit;
      ppmHoursPerAssetPerYear += hoursPerYear;

      const totalHours = hoursPerYear * inventory.quantity;
      if (!hoursByType[task.technicianTypeId]) {
        hoursByType[task.technicianTypeId] = 0;
      }
      hoursByType[task.technicianTypeId] += totalHours;
    });

    const isMonthlyRate = assetType.reactive.isMonthlyRate !== undefined ? assetType.reactive.isMonthlyRate : false;
    const reactiveCallsPerPeriod = (assetType.reactive.reactiveCallsPercent / 100) * inventory.quantity;
    const reactiveHoursPerYear = isMonthlyRate
      ? reactiveCallsPerPeriod * assetType.reactive.avgHoursPerCall * 12
      : reactiveCallsPerPeriod * assetType.reactive.avgHoursPerCall;
    const totalReactiveHours = reactiveHoursPerYear;

    if (!hoursByType[assetType.reactive.technicianTypeId]) {
      hoursByType[assetType.reactive.technicianTypeId] = 0;
    }
    hoursByType[assetType.reactive.technicianTypeId] += totalReactiveHours;
  });

  return Object.entries(hoursByType)
    .map(([techTypeId, totalAnnualHours]) => {
      const techType = state.technicianLibrary.find((t) => t.id === techTypeId);
      if (!techType) {
        return null;
      }

      const activeFTE = totalAnnualHours / annualWorkingHours;
      const totalWithRelievers = activeFTE * state.globalAssumptions.coverageFactor;
      const relieversCount = totalWithRelievers - activeFTE;

      const hasCriticalTasks = checkIfTechnicianHasCriticalTasks(techTypeId, state);
      const deploymentModel = determineDeploymentModel(state.globalAssumptions.contractMode, hasCriticalTasks);

      const headcount = deploymentModel === 'resident'
        ? Math.ceil(totalWithRelievers)
        : totalWithRelievers;

      const ctc = techType.monthlySalary + techType.additionalCost;

      // Both resident and rotating technicians cost based on total headcount (including relievers)
      const regularMonthlyCost = headcount * ctc;
      const annualCost = regularMonthlyCost * 12;

      const monthlyCost = regularMonthlyCost;

      return {
        techTypeId,
        techTypeName: techType.name,
        totalAnnualHours,
        activeFTE,
        totalWithRelievers,
        relieversCount,
        deploymentModel,
        headcount,
        regularMonthlyCost,
        overtimeMonthlyHours: 0,
        overtimeMonthlyCost: 0,
        monthlyCost,
        annualCost,
      };
    })
  .filter((item): item is NonNullable<typeof item> => item !== null);
};

const calculateInHouseStack = (
  state: FMEstimatorState,
  manpowerByType: ManpowerByType[]
): InHouseCostStack => {
  // Calculate support roles cost separately
  const supervisionAnnual = state.supervisory.supportRoles.reduce((sum, role) => {
    const techType = state.technicianLibrary.find(t => t.id === role.technicianTypeId);
    if (!techType) return sum;

    const headcount = role.deploymentModel === 'resident' ? Math.ceil(role.count) : role.count;
    const ctc = techType.monthlySalary + techType.additionalCost;
    return sum + (headcount * ctc * 12);
  }, 0);

  const manpowerAnnual = manpowerByType.reduce((sum, m) => sum + (m.regularMonthlyCost * 12), 0);
  const overtimeAnnual = manpowerByType.reduce((sum, m) => sum + (m.overtimeMonthlyCost * 12), 0);

  const materialsAnnual = calculateMaterialsConsumablesCost(
    state.materialsCatalog,
    state.contractModel
  );

  const consumablesAnnual = calculateMaterialsConsumablesCost(
    state.consumablesCatalog,
    state.contractModel
  );

  const baseTotal = manpowerAnnual + supervisionAnnual + overtimeAnnual + materialsAnnual + consumablesAnnual;
  const overheads = (baseTotal / (1-(state.costConfig.inHouse.overheadsPercent / 100)) - baseTotal);
  const subtotal = baseTotal + overheads;
  const profit = (subtotal / (1 - (state.costConfig.inHouse.markupPercent / 100)) - subtotal);
  const selling = subtotal + profit;

  return {
    manpowerAnnual,
    supervisionAnnual,
    overtimeAnnual,
    materialsAnnual,
    consumablesAnnual,
    overheads,
    subtotal,
    profit,
    selling,
  };
};

const calculateMaterialsConsumablesCost = (
  items: Array<{ category: string; unitRate: number; expectedAnnualQty: number; included: boolean }>,
  contractModel: { global: string; categoryOverrides: Record<string, string>; costPlusHandlingFee: number }
): number => {
  let total = 0;

  items.forEach((item) => {
    const model = contractModel.categoryOverrides[item.category] || contractModel.global;

    if (model === 'fully_comprehensive' || (model === 'semi_comprehensive' && item.included)) {
      total += item.unitRate * item.expectedAnnualQty;
    } else if (model === 'cost_plus') {
      const baseCost = item.unitRate * item.expectedAnnualQty;
      total += baseCost * (1 + contractModel.costPlusHandlingFee / 100);
    }
  });

  return total;
};

const calculateSubcontractStack = (state: FMEstimatorState): SubcontractCostStack => {
  let annualSubcontractBase = 0;

  state.assetInventory.forEach((inventory) => {
    if (inventory.responsibility === 'subcontract' && inventory.unitSubcontractCost) {
      annualSubcontractBase += inventory.unitSubcontractCost * inventory.quantity * 12;
    }
  });

  state.specializedServices.forEach((service) => {
    const multiplier = frequencyMultipliers[service.frequency];

    if (service.pricingMode === 'per_asset' && service.unitCost !== undefined) {
      annualSubcontractBase += service.unitCost * service.qty * multiplier;
    } else if (service.pricingMode === 'lump_sum' && service.annualCost !== undefined) {
      annualSubcontractBase += service.annualCost;
    }
  });

  const baseAnnual = annualSubcontractBase;
  const overheads = baseAnnual / (1 - (state.costConfig.subcontract.overheadsPercent / 100))-baseAnnual;
  const subtotal = baseAnnual + overheads;
  const profit = subtotal / (1 - (state.costConfig.subcontract.markupPercent / 100))-subtotal;
  const selling = subtotal + profit;

  return {
    baseAnnual,
    overheads,
    subtotal,
    profit,
    selling,
  };
};
