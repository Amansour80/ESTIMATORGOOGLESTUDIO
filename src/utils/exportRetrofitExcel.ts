import ExcelJS from 'exceljs';
import { RetrofitState, RetrofitResults } from '../types/retrofit';

export async function exportRetrofitToExcel(state: RetrofitState, results: RetrofitResults) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Retrofit Estimate');

  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'RETROFIT PROJECT COST ESTIMATE';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).height = 25;

  ws.getCell('A3').value = 'Project Name:';
  ws.getCell('B3').value = state.projectInfo.projectName;
  ws.getCell('A4').value = 'Location:';
  ws.getCell('B4').value = state.projectInfo.projectLocation;
  ws.getCell('A5').value = 'Client:';
  ws.getCell('B5').value = state.projectInfo.clientName;
  ws.getCell('A6').value = 'Duration:';
  ws.getCell('B6').value = `${results.projectDurationDays} days`;

  ws.getCell('E3').value = 'Start Date:';
  ws.getCell('F3').value = state.projectInfo.startDate;
  ws.getCell('E4').value = 'End Date:';
  ws.getCell('F4').value = state.projectInfo.endDate;
  ws.getCell('E5').value = 'Total Hours:';
  ws.getCell('F5').value = results.totalManpowerHours;

  ['A3', 'A4', 'A5', 'A6', 'E3', 'E4', 'E5'].forEach((cell) => {
    ws.getCell(cell).font = { bold: true };
  });

  let currentRow = 8;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const phaseHeaderCell = ws.getCell(`A${currentRow}`);
  phaseHeaderCell.value = 'PROJECT PHASES';
  phaseHeaderCell.font = { bold: true, size: 12 };
  phaseHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const phaseHeaders = ['Phase Name', 'Start Date', 'End Date', 'Duration (Days)'];
  phaseHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.projectPhases.forEach((phase) => {
    ws.getCell(currentRow, 1).value = phase.name;
    ws.getCell(currentRow, 2).value = phase.startDate;
    ws.getCell(currentRow, 3).value = phase.endDate;
    ws.getCell(currentRow, 4).value = phase.durationDays;
    currentRow++;
  });

  currentRow++;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const manpowerHeaderCell = ws.getCell(`A${currentRow}`);
  manpowerHeaderCell.value = 'MANPOWER BREAKDOWN';
  manpowerHeaderCell.font = { bold: true, size: 12 };
  manpowerHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const manpowerHeaders = ['Description', 'Labor Type', 'Hours', 'Rate/Hr', 'Mob Cost', 'Demob Cost', 'Total Cost'];
  manpowerHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.manpowerItems.forEach((item) => {
    const labor = state.laborLibrary.find((l) => l.id === item.laborTypeId);
    const laborCost = labor ? item.estimatedHours * labor.hourlyRate : 0;
    const totalCost = laborCost + item.mobilizationCost + item.demobilizationCost;

    ws.getCell(currentRow, 1).value = item.description;
    ws.getCell(currentRow, 2).value = labor?.role || '-';
    ws.getCell(currentRow, 3).value = item.estimatedHours;
    ws.getCell(currentRow, 4).value = labor?.hourlyRate || 0;
    ws.getCell(currentRow, 5).value = item.mobilizationCost;
    ws.getCell(currentRow, 6).value = item.demobilizationCost;
    ws.getCell(currentRow, 7).value = totalCost;

    [4, 5, 6, 7].forEach((col) => {
      ws.getCell(currentRow, col).numFmt = '#,##0';
    });
    currentRow++;
  });

  ws.getCell(currentRow, 6).value = 'TOTAL:';
  ws.getCell(currentRow, 6).font = { bold: true };
  ws.getCell(currentRow, 7).value = results.totalManpowerCost;
  ws.getCell(currentRow, 7).font = { bold: true };
  ws.getCell(currentRow, 7).numFmt = '#,##0';
  currentRow += 2;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const assetHeaderCell = ws.getCell(`A${currentRow}`);
  assetHeaderCell.value = 'ASSETS';
  assetHeaderCell.font = { bold: true, size: 12 };
  assetHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const assetHeaders = ['Name', 'Description', 'Qty', 'Unit Cost', 'Total Cost', 'Removal/Unit', 'Total Removal'];
  assetHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.assets.forEach((asset) => {
    ws.getCell(currentRow, 1).value = asset.name;
    ws.getCell(currentRow, 2).value = asset.description;
    ws.getCell(currentRow, 3).value = asset.quantity;
    ws.getCell(currentRow, 4).value = asset.unitCost;
    ws.getCell(currentRow, 5).value = asset.quantity * asset.unitCost;
    ws.getCell(currentRow, 6).value = asset.removalCostPerUnit;
    ws.getCell(currentRow, 7).value = asset.quantity * asset.removalCostPerUnit;

    [4, 5, 6, 7].forEach((col) => {
      ws.getCell(currentRow, col).numFmt = '#,##0';
    });
    currentRow++;
  });

  ws.getCell(currentRow, 4).value = 'TOTALS:';
  ws.getCell(currentRow, 4).font = { bold: true };
  ws.getCell(currentRow, 5).value = results.totalAssetCost;
  ws.getCell(currentRow, 5).font = { bold: true };
  ws.getCell(currentRow, 5).numFmt = '#,##0';
  ws.getCell(currentRow, 7).value = results.totalRemovalCost;
  ws.getCell(currentRow, 7).font = { bold: true };
  ws.getCell(currentRow, 7).numFmt = '#,##0';
  currentRow += 2;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const materialsHeaderCell = ws.getCell(`A${currentRow}`);
  materialsHeaderCell.value = 'MATERIALS';
  materialsHeaderCell.font = { bold: true, size: 12 };
  materialsHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const materialsHeaders = ['Category', 'Item', 'Unit', 'Qty', 'Unit Rate', 'Total', 'Notes'];
  materialsHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.materialsCatalog.forEach((material) => {
    ws.getCell(currentRow, 1).value = material.category;
    ws.getCell(currentRow, 2).value = material.item;
    ws.getCell(currentRow, 3).value = material.unit;
    ws.getCell(currentRow, 4).value = material.estimatedQty;
    ws.getCell(currentRow, 5).value = material.unitRate;
    ws.getCell(currentRow, 6).value = material.estimatedQty * material.unitRate;
    ws.getCell(currentRow, 7).value = material.notes;

    [5, 6].forEach((col) => {
      ws.getCell(currentRow, col).numFmt = '#,##0';
    });
    currentRow++;
  });

  ws.getCell(currentRow, 5).value = 'TOTAL:';
  ws.getCell(currentRow, 5).font = { bold: true };
  ws.getCell(currentRow, 6).value = results.totalMaterialsCost;
  ws.getCell(currentRow, 6).font = { bold: true };
  ws.getCell(currentRow, 6).numFmt = '#,##0';
  currentRow += 2;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const subHeaderCell = ws.getCell(`A${currentRow}`);
  subHeaderCell.value = 'SUBCONTRACTORS';
  subHeaderCell.font = { bold: true, size: 12 };
  subHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const subHeaders = ['Category', 'Description', 'Pricing Mode', 'Qty', 'Unit Cost', 'Lump Sum', 'Total'];
  subHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.subcontractors.forEach((sub) => {
    const total = sub.pricingMode === 'lump_sum' ? sub.lumpSumCost : sub.quantity * sub.unitCost;

    ws.getCell(currentRow, 1).value = sub.category.replace('_', ' ').toUpperCase();
    ws.getCell(currentRow, 2).value = sub.description;
    ws.getCell(currentRow, 3).value = sub.pricingMode === 'lump_sum' ? 'Lump Sum' : 'Per Unit';
    ws.getCell(currentRow, 4).value = sub.pricingMode === 'lump_sum' ? '-' : sub.quantity;
    ws.getCell(currentRow, 5).value = sub.pricingMode === 'lump_sum' ? '-' : sub.unitCost;
    ws.getCell(currentRow, 6).value = sub.pricingMode === 'lump_sum' ? sub.lumpSumCost : '-';
    ws.getCell(currentRow, 7).value = total;

    [5, 6, 7].forEach((col) => {
      const cell = ws.getCell(currentRow, col);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
    currentRow++;
  });

  ws.getCell(currentRow, 6).value = 'TOTAL:';
  ws.getCell(currentRow, 6).font = { bold: true };
  ws.getCell(currentRow, 7).value = results.totalSubcontractorCost;
  ws.getCell(currentRow, 7).font = { bold: true };
  ws.getCell(currentRow, 7).numFmt = '#,##0';
  currentRow += 2;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const supervisionHeaderCell = ws.getCell(`A${currentRow}`);
  supervisionHeaderCell.value = 'SUPERVISION & MANAGEMENT';
  supervisionHeaderCell.font = { bold: true, size: 12 };
  supervisionHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const supervisionHeaders = ['Role', 'Count', 'Duration (Months)', 'Monthly Cost', 'Total Cost'];
  supervisionHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.supervisionRoles.forEach((role) => {
    const laborType = state.laborLibrary.find((l) => l.id === role.laborTypeId);
    const monthlyCost = laborType ? ((laborType.monthlySalary || 0) + (laborType.additionalCost || 0)) : 0;
    const hourlyRateFallback = laborType ? laborType.hourlyRate * 160 : 0;
    const costPerMonth = monthlyCost > 0 ? monthlyCost : hourlyRateFallback;
    const totalCost = role.count * role.durationMonths * costPerMonth;

    ws.getCell(currentRow, 1).value = laborType?.role || 'Unknown Role';
    ws.getCell(currentRow, 2).value = role.count;
    ws.getCell(currentRow, 3).value = role.durationMonths;
    ws.getCell(currentRow, 4).value = costPerMonth;
    ws.getCell(currentRow, 5).value = totalCost;

    [4, 5].forEach((col) => {
      ws.getCell(currentRow, col).numFmt = '#,##0';
    });
    currentRow++;
  });

  ws.getCell(currentRow, 4).value = 'TOTAL:';
  ws.getCell(currentRow, 4).font = { bold: true };
  ws.getCell(currentRow, 5).value = results.totalSupervisionCost;
  ws.getCell(currentRow, 5).font = { bold: true };
  ws.getCell(currentRow, 5).numFmt = '#,##0';
  currentRow += 2;

  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const logisticsHeaderCell = ws.getCell(`A${currentRow}`);
  logisticsHeaderCell.value = 'LOGISTICS';
  logisticsHeaderCell.font = { bold: true, size: 12 };
  logisticsHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  currentRow++;

  const logisticsHeaders = ['Description', 'Qty', 'Unit Rate', 'Total', 'Notes'];
  logisticsHeaders.forEach((header, idx) => {
    const cell = ws.getCell(currentRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
  });
  currentRow++;

  state.logisticsItems.forEach((item) => {
    ws.getCell(currentRow, 1).value = item.description;
    ws.getCell(currentRow, 2).value = item.quantity;
    ws.getCell(currentRow, 3).value = item.unitRate;
    ws.getCell(currentRow, 4).value = item.quantity * item.unitRate;
    ws.getCell(currentRow, 5).value = item.notes;

    [3, 4].forEach((col) => {
      ws.getCell(currentRow, col).numFmt = '#,##0';
    });
    currentRow++;
  });

  ws.getCell(currentRow, 3).value = 'TOTAL:';
  ws.getCell(currentRow, 3).font = { bold: true };
  ws.getCell(currentRow, 4).value = results.totalLogisticsCost;
  ws.getCell(currentRow, 4).font = { bold: true };
  ws.getCell(currentRow, 4).numFmt = '#,##0';
  currentRow += 2;

  ws.mergeCells(`A${currentRow}:D${currentRow}`);
  const summaryHeaderCell = ws.getCell(`A${currentRow}`);
  summaryHeaderCell.value = 'COST SUMMARY';
  summaryHeaderCell.font = { bold: true, size: 14 };
  summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
  summaryHeaderCell.font = { ...summaryHeaderCell.font, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  const summaryData = [
    ['Manpower Cost', results.totalManpowerCost],
    ['Assets Cost', results.totalAssetCost],
    ['Removal Cost', results.totalRemovalCost],
    ['Materials Cost', results.totalMaterialsCost],
    ['Subcontractors Cost', results.totalSubcontractorCost],
    ['Supervision Cost', results.totalSupervisionCost],
    ['Logistics Cost', results.totalLogisticsCost],
    ['BASE COST', results.baseCost, true],
    ['', ''],
    [`Overheads (${state.costConfig.overheadsPercent}%)`, results.overheadsCost],
    [`Performance Bond (${state.costConfig.performanceBondPercent}%)`, results.performanceBondCost],
    [`Insurance (${state.costConfig.insurancePercent}%)`, results.insuranceCost],
    [`Warranty (${state.costConfig.warrantyPercent}%)`, results.warrantyCost],
    ['SUBTOTAL', results.subtotalBeforeProfit, true],
    ['', ''],
    [`Profit (${state.costConfig.profitPercent}%)`, results.profitAmount],
    ['GRAND TOTAL', results.grandTotal, true],
    ['', ''],
    ['Cost per Asset Unit', results.costPerAssetUnit],
    ['Total Manpower Hours', results.totalManpowerHours],
  ];

  summaryData.forEach((row) => {
    ws.getCell(currentRow, 1).value = row[0];
    ws.getCell(currentRow, 2).value = row[1];

    ws.getCell(currentRow, 1).font = { bold: true };

    if (typeof row[1] === 'number') {
      ws.getCell(currentRow, 2).numFmt = '#,##0';
    }

    if (row[2]) {
      ws.getCell(currentRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      ws.getCell(currentRow, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      ws.getCell(currentRow, 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getCell(currentRow, 2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }

    currentRow++;
  });

  ws.columns = [
    { width: 25 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.projectInfo.projectName || 'retrofit_project'}_estimate.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
