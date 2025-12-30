import ExcelJS from 'exceljs';
import type { EstimatorState } from '../types';
import {
  calculateDailyTotalsByBucket,
  calculateMachineDailyTotals,
  calcActiveCleaners,
  calcCoverage,
  calculateMachineryCosts,
  calculateManpowerCosts,
  calculateConsumables,
  calculatePricing,
  toDailyEquivalent,
  calculateWorkingDaysPerYear,
  calculateCoverageFactor,
  calculateRelievers,
} from './calculations';

export async function exportToExcel(state: EstimatorState) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('HK Estimate');

  worksheet.columns = [
    { width: 30 },
    { width: 20 },
  ];

  const titleRow = worksheet.addRow(['HK ESTIMATOR - SUMMARY REPORT']);
  titleRow.font = { size: 16, bold: true };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.mergeCells('A1:B1');

  worksheet.addRow([]);

  const workingDaysPerYear = calculateWorkingDaysPerYear(
    state.site.annualLeaveDays,
    state.site.sickLeaveDays,
    state.site.publicHolidayDays,
    state.site.weeklyOffDays
  );

  const coverageFactor = state.site.totalCoverageDaysPerYear / workingDaysPerYear;

  const dailyTotals = calculateDailyTotalsByBucket(state.areas);
  const machineDailyTotals = calculateMachineDailyTotals(state.areas);

  let activeCleanersTotal: number;
  let relieversCount: number;

  if (state.site.estimationMode === 'input_base') {
    activeCleanersTotal = state.site.inputBaseCleaners || 0;
    relieversCount = calculateRelievers(activeCleanersTotal, coverageFactor);
  } else {
    const activeCleaners = calcActiveCleaners(dailyTotals, state.productivity, machineDailyTotals, state.machines);
    activeCleanersTotal = activeCleaners.total;
    relieversCount = calculateRelievers(activeCleanersTotal, coverageFactor);
  }

  const totalCleanersInclRelievers = activeCleanersTotal + relieversCount;

  const activeCleaners = calcActiveCleaners(dailyTotals, state.productivity, machineDailyTotals, state.machines);
  const machineryCosts = calculateMachineryCosts(activeCleaners.machineCleaners, state.machines);
  const manpowerCosts = calculateManpowerCosts(totalCleanersInclRelievers, state.costs);
  const consumablesCost = calculateConsumables(totalCleanersInclRelievers, state.costs);
  const pricing = calculatePricing(
    manpowerCosts.totalAnnualManpower,
    machineryCosts.totalAnnualMachineryCost,
    consumablesCost,
    state.costs
  );

  const addSection = (title: string) => {
    const row = worksheet.addRow([title]);
    row.font = { bold: true, size: 12 };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
  };

  const addDataRow = (label: string, value: string | number) => {
    worksheet.addRow([label, value]);
  };

  if (state.projectInfo.projectName || state.projectInfo.projectLocation || state.projectInfo.projectType) {
    addSection('PROJECT INFORMATION');
    if (state.projectInfo.projectName) addDataRow('Project Name', state.projectInfo.projectName);
    if (state.projectInfo.projectLocation) addDataRow('Project Location', state.projectInfo.projectLocation);
    if (state.projectInfo.projectType) addDataRow('Project Type', state.projectInfo.projectType);
    worksheet.addRow([]);
  }

  addSection('SITE & COVERAGE');
  addDataRow('Estimation Mode', state.site.estimationMode === 'output_base' ? 'Output-Base' : 'Input-Base');
  if (state.site.estimationMode === 'input_base') {
    addDataRow('Number of Cleaners (Input)', state.site.inputBaseCleaners || 0);
  }
  addDataRow('Working days/cleaner/year', workingDaysPerYear);
  addDataRow('Coverage factor', coverageFactor.toFixed(3));
  addDataRow('Shift length (hours)', state.site.shiftLengthHours);
  worksheet.addRow([]);

  addSection('DAILY-EQUIVALENT SQM BY BUCKET');
  addDataRow('Machine SQM/day', dailyTotals.Machine.toFixed(2));
  addDataRow('Manual-Detail SQM/day', dailyTotals['Manual-Detail'].toFixed(2));
  addDataRow('Manual-General SQM/day', dailyTotals['Manual-General'].toFixed(2));
  worksheet.addRow([]);

  addSection('CLEANERS CALCULATION');

  if (state.site.estimationMode === 'output_base') {
    state.machines.forEach((machine) => {
      const cleaners = activeCleaners.machineCleaners.get(machine.id) || 0;
      addDataRow(`${machine.name} cleaners`, cleaners.toFixed(2));
    });
    addDataRow('Total Machine cleaners', activeCleaners.totalMachineCleaners.toFixed(2));
    addDataRow('Manual-Detail cleaners', activeCleaners.manualDetail.toFixed(2));
    addDataRow('Manual-General cleaners', activeCleaners.manualGeneral.toFixed(2));
  }

  addDataRow('Total Active Cleaners', activeCleanersTotal.toFixed(2));
  addDataRow('Relievers', relieversCount.toFixed(2));
  addDataRow('Total incl. Relievers', totalCleanersInclRelievers.toFixed(2));
  worksheet.addRow([]);

  addSection('MACHINERY');
  machineryCosts.machineDetails.forEach((detail) => {
    addDataRow(`${detail.machineName} - Cleaners Needed`, detail.cleanersNeeded.toFixed(2));
    addDataRow(`${detail.machineName} - Quantity`, detail.quantity);
    addDataRow(`${detail.machineName} - Depreciation (AED)`, detail.depreciation);
    addDataRow(`${detail.machineName} - Maintenance (AED)`, detail.maintenance);
  });
  addDataRow('Total Annual Depreciation (AED)', machineryCosts.totalDepreciation);
  addDataRow('Total Annual Maintenance (AED)', machineryCosts.totalMaintenance);
  addDataRow('Total Annual Machinery Cost (AED)', machineryCosts.totalAnnualMachineryCost);
  worksheet.addRow([]);

  addSection('MANPOWER COST');
  addDataRow('Cleaner Monthly Cost (AED)', manpowerCosts.cleanerMonthlyCost);
  addDataRow('Annual Cleaners Cost (AED)', manpowerCosts.annualCleanersCost);
  addDataRow('Annual Supervisors Cost (AED)', manpowerCosts.annualSupervisorsCost);
  addDataRow('Total Annual Manpower (AED)', manpowerCosts.totalAnnualManpower);
  worksheet.addRow([]);

  addSection('CONSUMABLES');
  addDataRow('Annual Consumables (AED)', consumablesCost);
  worksheet.addRow([]);

  addSection('FINAL PRICING');
  addDataRow('Overheads (AED)', pricing.overheads);
  addDataRow('Total Cost (AED)', pricing.totalCost);
  addDataRow('Profit (AED)', pricing.profit);
  const finalAnnualRow = worksheet.addRow(['Final Price (Annual) AED', pricing.finalPriceAnnual]);
  finalAnnualRow.font = { bold: true };
  finalAnnualRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEB9C' },
  };
  finalAnnualRow.getCell(2).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEB9C' },
  };
  const finalMonthlyRow = worksheet.addRow(['Final Price (Monthly) AED', pricing.finalPriceMonthly]);
  finalMonthlyRow.font = { bold: true };
  finalMonthlyRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEB9C' },
  };
  finalMonthlyRow.getCell(2).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEB9C' },
  };
  worksheet.addRow([]);

  addSection('DETAILED AREA BREAKDOWN');
  const headerRow = worksheet.addRow(['Area Name', 'Total SQM', 'Frequency', 'Times/Day', 'Bucket', 'Daily-Eq SQM']);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
  });

  state.areas.forEach((area) => {
    const dailyEq = toDailyEquivalent(area.sqm, area.frequency, area.dailyFrequency);
    const timesPerDay = area.frequency === 'Daily' && area.dailyFrequency ? area.dailyFrequency : '-';
    worksheet.addRow([area.name, area.sqm, area.frequency, timesPerDay, area.bucket, dailyEq.toFixed(2)]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HK_Estimate_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
