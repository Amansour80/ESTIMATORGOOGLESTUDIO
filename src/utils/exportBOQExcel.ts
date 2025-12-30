import ExcelJS from 'exceljs';
import { BOQLineItem } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';
import { calculateLineItemTotals, calculateBOQSummary, formatLaborDropdownText } from './boqCalculations';

export async function exportBOQToExcel(
  projectName: string,
  lineItems: BOQLineItem[],
  laborLibrary: OrgRetrofitLabor[],
  currency: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BOQ');

  worksheet.columns = [
    { header: 'CATEGORY', key: 'category', width: 20 },
    { header: 'DESCRIPTION', key: 'description', width: 40 },
    { header: 'UOM', key: 'uom', width: 10 },
    { header: 'QTY', key: 'qty', width: 10 },
    { header: 'UNIT MAT. COST', key: 'unitMaterialCost', width: 15 },
    { header: 'TOTAL MAT. COST', key: 'totalMaterialCost', width: 15 },
    { header: 'LABOR DETAILS', key: 'laborDetails', width: 25 },
    { header: 'LABOUR HRS', key: 'laborHours', width: 12 },
    { header: 'LABOR COST', key: 'laborCost', width: 15 },
    { header: 'SUPERVISION DETAILS', key: 'supervisionDetails', width: 25 },
    { header: 'SUPERVISION HRS', key: 'supervisionHours', width: 15 },
    { header: 'SUPERVISION COST', key: 'supervisionCost', width: 15 },
    { header: 'DIRECT COST', key: 'directCost', width: 15 },
    { header: 'SUBCONTRACTOR COST', key: 'subcontractorCost', width: 20 },
    { header: 'LINE TOTAL', key: 'lineTotal', width: 15 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  lineItems.forEach((item) => {
    const calcs = calculateLineItemTotals(item, laborLibrary);
    const labor = item.laborDetailId
      ? laborLibrary.find(l => l.id === item.laborDetailId)
      : null;
    const supervisor = item.supervisionDetailId
      ? laborLibrary.find(l => l.id === item.supervisionDetailId)
      : null;

    worksheet.addRow({
      category: item.category,
      description: item.description,
      uom: item.uom,
      qty: item.quantity,
      unitMaterialCost: item.unitMaterialCost,
      totalMaterialCost: calcs.totalMaterialCost,
      laborDetails: labor ? formatLaborDropdownText(labor, currency) : '-',
      laborHours: item.laborHours,
      laborCost: calcs.laborCost,
      supervisionDetails: supervisor ? formatLaborDropdownText(supervisor, currency) : '-',
      supervisionHours: item.supervisionHours,
      supervisionCost: calcs.supervisionCost,
      directCost: item.directCost,
      subcontractorCost: item.subcontractorCost,
      lineTotal: calcs.lineTotal
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, colNumber) => {
        if ([5, 6, 9, 12, 13, 14, 15].includes(colNumber)) {
          cell.numFmt = `#,##0.00 "${currency}"`;
        } else if ([4, 8, 11].includes(colNumber)) {
          cell.numFmt = '#,##0.00';
        }
        cell.alignment = { vertical: 'middle' };
        if ([4, 5, 6, 8, 9, 11, 12, 13, 14, 15].includes(colNumber)) {
          cell.alignment = { ...cell.alignment, horizontal: 'right' };
        }
      });
    }
  });

  const summary = calculateBOQSummary(lineItems, laborLibrary);

  const summaryStartRow = worksheet.rowCount + 3;

  worksheet.getCell(`A${summaryStartRow}`).value = 'BOQ SUMMARY';
  worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 };
  worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);

  const summaryData = [
    ['Total Material Cost', summary.totalMaterialCost],
    ['Total Labor Cost', summary.totalLaborCost],
    ['Total Supervision Cost', summary.totalSupervisionCost],
    ['Total Direct Costs', summary.totalDirectCost],
    ['Total Subcontractor Costs', summary.totalSubcontractorCost],
    ['GRAND TOTAL', summary.grandTotal]
  ];

  summaryData.forEach((data, index) => {
    const row = summaryStartRow + index + 1;
    worksheet.getCell(`A${row}`).value = data[0];
    worksheet.getCell(`A${row}`).font = { bold: index === summaryData.length - 1 };
    worksheet.getCell(`B${row}`).value = data[1];
    worksheet.getCell(`B${row}`).numFmt = `#,##0.00 "${currency}"`;
    worksheet.getCell(`B${row}`).font = { bold: index === summaryData.length - 1 };
    worksheet.getCell(`B${row}`).alignment = { horizontal: 'right' };

    if (index === summaryData.length - 1) {
      worksheet.getCell(`A${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' }
      };
      worksheet.getCell(`B${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' }
      };
      worksheet.getCell(`A${row}`).font = { ...worksheet.getCell(`A${row}`).font, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell(`B${row}`).font = { ...worksheet.getCell(`B${row}`).font, color: { argb: 'FFFFFFFF' } };
    }
  });

  worksheet.autoFilter = {
    from: 'A1',
    to: 'O1'
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const date = new Date().toISOString().split('T')[0];
  link.download = `BOQ_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
