import ExcelJS from 'exceljs';
import type { FMEstimatorState, FMResults } from '../types/fm';
import { calculateFMResults } from './fmCalculations';
import { frequencyMultipliers } from './fmDefaults';

export async function exportFMToExcel(state: FMEstimatorState) {
  const results = calculateFMResults(state);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('FM Estimate');

  worksheet.columns = [
    { width: 35 },
    { width: 20 },
  ];

  const titleRow = worksheet.addRow(['FM MEP ESTIMATOR - SUMMARY REPORT']);
  titleRow.font = { size: 16, bold: true };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.mergeCells('A1:B1');

  worksheet.addRow([]);

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

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (state.projectInfo.projectName || state.projectInfo.projectLocation || state.projectInfo.projectType) {
    addSection('PROJECT INFORMATION');
    if (state.projectInfo.projectName) addDataRow('Project Name', state.projectInfo.projectName);
    if (state.projectInfo.projectLocation) addDataRow('Project Location', state.projectInfo.projectLocation);
    if (state.projectInfo.projectType) addDataRow('Project Type', state.projectInfo.projectType);
    worksheet.addRow([]);
  }

  addSection('GLOBAL ASSUMPTIONS');
  addDataRow('Contract Mode', state.globalAssumptions.contractMode === 'output_base' ? 'Output Base (Asset-driven)' : 'Input Base (Direct input)');
  addDataRow('Working Days per Year', state.globalAssumptions.workingDaysPerYear);
  addDataRow('Shift Length (hours)', state.globalAssumptions.shiftLength);
  addDataRow('Break Minutes', state.globalAssumptions.breakMinutes);
  addDataRow('Effective Hours', state.globalAssumptions.effectiveHours.toFixed(2));
  addDataRow('Coverage Factor', state.globalAssumptions.coverageFactor.toFixed(3));
  worksheet.addRow([]);

  addSection('MANPOWER SUMMARY');
  results.manpowerByType.forEach((m) => {
    addDataRow(`${m.techTypeName} - Deployment`, m.deploymentModel === 'resident' ? 'Resident' : 'Rotating');
    addDataRow(`${m.techTypeName} - Annual Hours`, formatCurrency(m.totalAnnualHours));
    addDataRow(`${m.techTypeName} - Active FTE`, m.activeFTE.toFixed(2));
    addDataRow(`${m.techTypeName} - Total w/ Relievers`, m.totalWithRelievers.toFixed(2));
    addDataRow(`${m.techTypeName} - Headcount`, m.headcount.toFixed(2));
    addDataRow(`${m.techTypeName} - Annual Cost (AED)`, formatCurrency(m.annualCost));
  });
  addDataRow('Total Active FTE', results.totalActiveFTE.toFixed(2));
  addDataRow('Total w/ Relievers', results.totalWithRelievers.toFixed(2));
  addDataRow('Resident Headcount', results.totalResidentHeadcount.toFixed(2));
  addDataRow('Rotating FTE', results.totalRotatingFTE.toFixed(2));
  addDataRow(`Supervisors (${results.supervisorDeploymentModel})`, results.supervisorsCount.toFixed(2));
  addDataRow('Total Headcount', results.totalInHouseHeadcount.toFixed(2));
  worksheet.addRow([]);

  addSection('IN-HOUSE COST STACK');
  addDataRow('Manpower Annual (AED)', formatCurrency(results.inHouseStack.manpowerAnnual));
  addDataRow('Supervision Annual (AED)', formatCurrency(results.inHouseStack.supervisionAnnual));
  if (results.inHouseStack.overtimeAnnual > 0) {
    addDataRow('Overtime Annual (AED)', formatCurrency(results.inHouseStack.overtimeAnnual));
  }
  addDataRow('Materials Annual (AED)', formatCurrency(results.inHouseStack.materialsAnnual));
  addDataRow('Consumables Annual (AED)', formatCurrency(results.inHouseStack.consumablesAnnual));
  addDataRow('Overheads (AED)', formatCurrency(results.inHouseStack.overheads));
  addDataRow('Subtotal (AED)', formatCurrency(results.inHouseStack.subtotal));
  addDataRow('Profit (AED)', formatCurrency(results.inHouseStack.profit));
  const inHouseAnnualRow = worksheet.addRow(['In-House Selling Annual (AED)', formatCurrency(results.inHouseStack.selling)]);
  inHouseAnnualRow.font = { bold: true };
  inHouseAnnualRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  inHouseAnnualRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  addDataRow('In-House Selling Monthly (AED)', formatCurrency(results.inHouseStack.selling / 12));
  worksheet.addRow([]);

  addSection('SUBCONTRACT COST STACK');
  addDataRow('Base Annual (AED)', formatCurrency(results.subcontractStack.baseAnnual));
  addDataRow('Overheads (AED)', formatCurrency(results.subcontractStack.overheads));
  addDataRow('Subtotal (AED)', formatCurrency(results.subcontractStack.subtotal));
  addDataRow('Profit (AED)', formatCurrency(results.subcontractStack.profit));
  const subcontractAnnualRow = worksheet.addRow(['Subcontract Selling Annual (AED)', formatCurrency(results.subcontractStack.selling)]);
  subcontractAnnualRow.font = { bold: true };
  subcontractAnnualRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  subcontractAnnualRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  addDataRow('Subcontract Selling Monthly (AED)', formatCurrency(results.subcontractStack.selling / 12));
  worksheet.addRow([]);

  addSection('GRAND TOTAL');
  const grandAnnualRow = worksheet.addRow(['Grand Total Annual (AED)', formatCurrency(results.grandTotal)]);
  grandAnnualRow.font = { bold: true, size: 12 };
  grandAnnualRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
  grandAnnualRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
  const grandMonthlyRow = worksheet.addRow(['Grand Total Monthly (AED)', formatCurrency(results.grandTotal / 12)]);
  grandMonthlyRow.font = { bold: true, size: 12 };
  grandMonthlyRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
  grandMonthlyRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
  worksheet.addRow([]);

  addSection('ASSET INVENTORY');
  if (state.assetInventory.length > 0) {
    const assetHeaderRow = worksheet.addRow(['Asset Type', 'Quantity', 'Responsibility', 'Notes']);
    assetHeaderRow.font = { bold: true };
    assetHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    });

    state.assetInventory.forEach((inv) => {
      const assetType = state.assetTypes.find((a) => a.id === inv.assetTypeId);
      const assetName = assetType ? `${assetType.category} - ${assetType.assetName}` : 'Unknown';
      const responsibility = assetType?.responsibility === 'in_house' ? 'In-house' : 'Subcontract';
      worksheet.addRow([assetName, inv.quantity, responsibility, inv.notes]);
    });
  } else {
    addDataRow('No assets defined', '-');
  }
  worksheet.addRow([]);

  addSection('ASSET TYPES LIBRARY');
  if (state.assetTypes.length > 0) {
    state.assetTypes.forEach((asset) => {
      addDataRow(`[${asset.category}] ${asset.assetName}`, '');

      asset.ppmTasks.forEach((task) => {
        const techName = state.technicianLibrary.find((t) => t.id === task.technicianTypeId)?.name || 'Unknown';
        addDataRow(`  PPM: ${task.taskName}`, `${task.frequency} | ${task.hoursPerVisit}h | ${techName}`);
      });

      const reactiveTechName = state.technicianLibrary.find((t) => t.id === asset.reactive.technicianTypeId)?.name || 'Unknown';
      addDataRow(`  Reactive Maintenance`, `${asset.reactive.reactiveCallsPercent}% calls | ${asset.reactive.avgHoursPerCall}h/call | ${reactiveTechName}`);
    });
  } else {
    addDataRow('No asset types defined', '-');
  }
  worksheet.addRow([]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FM_MEP_Estimate_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
