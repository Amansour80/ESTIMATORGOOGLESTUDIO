import type { Frequency, AreaRow, EstimatorState, Machine } from '../types';

export function frequencyToDivisor(frequency: Frequency): number {
  const map: Record<Frequency, number> = {
    Daily: 1,
    Weekly: 7,
    Biweekly: 14,
    Monthly: 30,
    Quarterly: 90,
    Semiannual: 182,
    Annual: 365,
  };
  return map[frequency];
}

export function toDailyEquivalent(sqm: number, frequency: Frequency, dailyFrequency?: number): number {
  const divisor = frequencyToDivisor(frequency);
  const multiplier = frequency === 'Daily' && dailyFrequency ? dailyFrequency : 1;
  return divisor === 0 ? 0 : (sqm / divisor) * multiplier;
}

export function calculateWorkingDaysPerYear(
  annualLeaveDays: number,
  sickLeaveDays: number,
  publicHolidayDays: number,
  weeklyOffDays: number
): number {
  return 365 - annualLeaveDays - sickLeaveDays - publicHolidayDays - weeklyOffDays;
}

export function calculateCoverageFactor(workingDaysPerYear: number): number {
  return workingDaysPerYear > 0 ? 365 / workingDaysPerYear : 1;
}

export function calculateRelievers(activeCleaners: number, coverageFactor: number): number {
  // Allow fractional relievers since one reliever can cover multiple cleaners across projects
  const totalRequired = activeCleaners * coverageFactor;
  return Math.max(0, totalRequired - activeCleaners);
}

export function calculateDailyTotalsByBucket(areas: AreaRow[]) {
  const totals = {
    Machine: 0,
    'Manual-Detail': 0,
    'Manual-General': 0,
  };

  areas.forEach((area) => {
    const dailyEq = toDailyEquivalent(area.sqm, area.frequency, area.dailyFrequency);
    totals[area.bucket] += dailyEq;
  });

  return totals;
}

export function calculateMachineDailyTotals(areas: AreaRow[]) {
  const machineMap = new Map<string, number>();

  areas.forEach((area) => {
    if (area.bucket === 'Machine' && area.machineId) {
      const dailyEq = toDailyEquivalent(area.sqm, area.frequency, area.dailyFrequency);
      machineMap.set(area.machineId, (machineMap.get(area.machineId) || 0) + dailyEq);
    }
  });

  return machineMap;
}

export function calcActiveCleaners(
  dailyTotals: { Machine: number; 'Manual-Detail': number; 'Manual-General': number },
  productivity: EstimatorState['productivity'],
  machineDailyTotals: Map<string, number>,
  machines: Machine[]
): {
  machineCleaners: Map<string, number>;
  totalMachineCleaners: number;
  manualDetail: number;
  manualGeneral: number;
  total: number;
} {
  const machineCleaners = new Map<string, number>();
  let totalMachineCleaners = 0;

  machines.forEach((machine) => {
    const dailySqm = machineDailyTotals.get(machine.id) || 0;
    const sqmPerShift = machine.sqmPerHour * machine.effectiveHoursPerShift;
    const cleaners = sqmPerShift > 0 ? dailySqm / sqmPerShift : 0;
    machineCleaners.set(machine.id, cleaners);
    totalMachineCleaners += cleaners;
  });

  const manualDetail =
    productivity.manualDetailSqmPerShift > 0
      ? dailyTotals['Manual-Detail'] / productivity.manualDetailSqmPerShift
      : 0;
  const manualGeneral =
    productivity.manualGeneralSqmPerShift > 0
      ? dailyTotals['Manual-General'] / productivity.manualGeneralSqmPerShift
      : 0;

  return {
    machineCleaners,
    totalMachineCleaners,
    manualDetail,
    manualGeneral,
    total: totalMachineCleaners + manualDetail + manualGeneral,
  };
}

export function calcCoverage(totalActive: number, workingDaysPerYear: number): number {
  const coverageFactor = calculateCoverageFactor(workingDaysPerYear);
  return totalActive * coverageFactor;
}

export function capexDepreciation(capex: number, lifeYears: number): number {
  return lifeYears > 0 ? capex / lifeYears : 0;
}

export function annualMaintenance(capex: number, maintenancePercent: number): number {
  return capex * (maintenancePercent / 100);
}

export function calculateMachineryCosts(machineCleaners: Map<string, number>, machines: Machine[]) {
  const machineDetails: {
    machineId: string;
    machineName: string;
    cleanersNeeded: number;
    quantity: number;
    depreciation: number;
    maintenance: number;
  }[] = [];

  let totalDepreciation = 0;
  let totalMaintenance = 0;

  machines.forEach((machine) => {
    const cleanersNeeded = machineCleaners.get(machine.id) || 0;
    const quantity = Math.max(machine.quantity, Math.ceil(cleanersNeeded));
    const depreciation = capexDepreciation(machine.cost, machine.lifeYears) * quantity;
    const maintenance = annualMaintenance(machine.cost, machine.maintenancePercent) * quantity;

    machineDetails.push({
      machineId: machine.id,
      machineName: machine.name,
      cleanersNeeded,
      quantity,
      depreciation,
      maintenance,
    });

    totalDepreciation += depreciation;
    totalMaintenance += maintenance;
  });

  return {
    machineDetails,
    totalDepreciation,
    totalMaintenance,
    totalAnnualMachineryCost: totalDepreciation + totalMaintenance,
  };
}

export function calculateManpowerCosts(
  totalCleanersInclRelievers: number,
  costs: EstimatorState['costs']
) {
  const cleanerMonthlyCost = costs.cleanerSalary + costs.benefitsAllowances;
  const annualCleanersCost = cleanerMonthlyCost * totalCleanersInclRelievers * 12;
  const annualSupervisorsCost = costs.supervisorSalary * costs.supervisorCount * 12;
  const totalAnnualManpower = annualCleanersCost + annualSupervisorsCost;

  return {
    cleanerMonthlyCost,
    annualCleanersCost,
    annualSupervisorsCost,
    totalAnnualManpower,
  };
}

export function calculateConsumables(
  totalCleanersInclRelievers: number,
  costs: EstimatorState['costs']
) {
  const annualConsumables = costs.consumablesPerCleanerPerMonth * totalCleanersInclRelievers * 12;
  const annualPPE = costs.ppePerCleanerPerYear * totalCleanersInclRelievers;
  return annualConsumables + annualPPE;
}

export function calculatePricing(
  annualManpower: number,
  annualMachinery: number,
  annualConsumables: number,
  costs: EstimatorState['costs']
) {
  const overheads = (annualManpower + annualMachinery + annualConsumables) * (costs.overheadsPercent / 100);
  const totalCost = annualManpower + annualMachinery + annualConsumables + overheads;
  const profit = totalCost * (costs.profitMarkupPercent / 100);
  const finalPriceAnnual = totalCost + profit;
  const finalPriceMonthly = finalPriceAnnual / 12;

  return {
    overheads,
    totalCost,
    profit,
    finalPriceAnnual,
    finalPriceMonthly,
  };
}
