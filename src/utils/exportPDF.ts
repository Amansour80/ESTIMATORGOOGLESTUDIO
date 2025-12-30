import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export function exportToPDF(state: EstimatorState) {
  const doc = new jsPDF();

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value);
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HK ESTIMATOR - SUMMARY REPORT', 105, 20, { align: 'center' });

  let yPos = 35;

  const addSection = (title: string, data: string[][]) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' },
      },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  };

  if (state.projectInfo.projectName || state.projectInfo.projectLocation || state.projectInfo.projectType) {
    const projectData: string[][] = [];
    if (state.projectInfo.projectName) projectData.push(['Project Name', state.projectInfo.projectName]);
    if (state.projectInfo.projectLocation) projectData.push(['Project Location', state.projectInfo.projectLocation]);
    if (state.projectInfo.projectType) projectData.push(['Project Type', state.projectInfo.projectType]);
    addSection('PROJECT INFORMATION', projectData);
  }

  const siteData: string[][] = [
    ['Estimation Mode', state.site.estimationMode === 'output_base' ? 'Output-Base' : 'Input-Base'],
  ];

  if (state.site.estimationMode === 'input_base') {
    siteData.push(['Number of Cleaners (Input)', (state.site.inputBaseCleaners || 0).toString()]);
  }

  siteData.push(
    ['Working days/cleaner/year', workingDaysPerYear.toString()],
    ['Coverage factor', coverageFactor.toFixed(3)],
    ['Shift length (hours)', state.site.shiftLengthHours.toString()]
  );

  addSection('SITE & COVERAGE', siteData);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  addSection('DAILY-EQUIVALENT SQM BY BUCKET', [
    ['Machine SQM/day', dailyTotals.Machine.toFixed(2)],
    ['Manual-Detail SQM/day', dailyTotals['Manual-Detail'].toFixed(2)],
    ['Manual-General SQM/day', dailyTotals['Manual-General'].toFixed(2)],
  ]);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  const activeCleanersData: string[][] = [];

  if (state.site.estimationMode === 'output_base') {
    state.machines.forEach((machine) => {
      const cleaners = activeCleaners.machineCleaners.get(machine.id) || 0;
      activeCleanersData.push([`${machine.name} cleaners`, cleaners.toFixed(2)]);
    });
    activeCleanersData.push(['Total Machine cleaners', activeCleaners.totalMachineCleaners.toFixed(2)]);
    activeCleanersData.push(['Manual-Detail cleaners', activeCleaners.manualDetail.toFixed(2)]);
    activeCleanersData.push(['Manual-General cleaners', activeCleaners.manualGeneral.toFixed(2)]);
  }

  activeCleanersData.push(['Total Active Cleaners', activeCleanersTotal.toFixed(2)]);
  activeCleanersData.push(['Relievers', relieversCount.toFixed(2)]);
  activeCleanersData.push(['Total incl. Relievers', totalCleanersInclRelievers.toFixed(2)]);

  addSection('CLEANERS CALCULATION', activeCleanersData);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  const machineryData: string[][] = [];
  machineryCosts.machineDetails.forEach((detail) => {
    machineryData.push([`${detail.machineName} - Cleaners Needed`, detail.cleanersNeeded.toFixed(2)]);
    machineryData.push([`${detail.machineName} - Quantity`, detail.quantity.toString()]);
    machineryData.push([`${detail.machineName} - Depreciation (AED)`, formatCurrency(detail.depreciation)]);
    machineryData.push([`${detail.machineName} - Maintenance (AED)`, formatCurrency(detail.maintenance)]);
  });
  machineryData.push(['Total Annual Depreciation (AED)', formatCurrency(machineryCosts.totalDepreciation)]);
  machineryData.push(['Total Annual Maintenance (AED)', formatCurrency(machineryCosts.totalMaintenance)]);
  machineryData.push(['Total Annual Machinery Cost (AED)', formatCurrency(machineryCosts.totalAnnualMachineryCost)]);

  addSection('MACHINERY', machineryData);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  addSection('MANPOWER COST', [
    ['Cleaner Monthly Cost (AED)', formatCurrency(manpowerCosts.cleanerMonthlyCost)],
    ['Annual Cleaners Cost (AED)', formatCurrency(manpowerCosts.annualCleanersCost)],
    ['Annual Supervisors Cost (AED)', formatCurrency(manpowerCosts.annualSupervisorsCost)],
    ['Total Annual Manpower (AED)', formatCurrency(manpowerCosts.totalAnnualManpower)],
  ]);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  addSection('CONSUMABLES', [['Annual Consumables (AED)', formatCurrency(consumablesCost)]]);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  addSection('FINAL PRICING', [
    ['Overheads (AED)', formatCurrency(pricing.overheads)],
    ['Total Cost (AED)', formatCurrency(pricing.totalCost)],
    ['Profit (AED)', formatCurrency(pricing.profit)],
    ['Final Price (Annual) AED', formatCurrency(pricing.finalPriceAnnual)],
    ['Final Price (Monthly) AED', formatCurrency(pricing.finalPriceMonthly)],
  ]);

  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED AREA BREAKDOWN', 14, yPos);
  yPos += 5;

  const areaData = state.areas.map((area) => {
    const dailyEq = toDailyEquivalent(area.sqm, area.frequency, area.dailyFrequency);
    const timesPerDay = area.frequency === 'Daily' && area.dailyFrequency ? area.dailyFrequency.toString() : '-';
    return [area.name, area.sqm.toString(), area.frequency, timesPerDay, area.bucket, dailyEq.toFixed(2)];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Area Name', 'Total SQM', 'Frequency', 'Times/Day', 'Bucket', 'Daily-Eq SQM']],
    body: areaData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [68, 114, 196], textColor: 255 },
    margin: { left: 14 },
  });

  doc.save(`HK_Estimate_${new Date().toISOString().split('T')[0]}.pdf`);
}