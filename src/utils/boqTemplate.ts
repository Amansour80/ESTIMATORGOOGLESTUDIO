import ExcelJS from 'exceljs';
import { BOQ_CATEGORIES, STANDARD_UOMS } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';
import { formatLaborDropdownText } from './boqCalculations';

export async function generateBOQTemplate(
  projectName: string,
  laborLibrary: OrgRetrofitLabor[],
  currency: string
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BOQ');

  worksheet.columns = [
    { header: 'CATEGORY', key: 'category', width: 20 },
    { header: 'DESCRIPTION', key: 'description', width: 40 },
    { header: 'UOM', key: 'uom', width: 10 },
    { header: 'QTY', key: 'qty', width: 10 },
    { header: 'MATERIALS', key: 'materials', width: 15 },
    { header: 'LABOR DETAILS', key: 'laborDetails', width: 25 },
    { header: 'LABOUR HRS', key: 'laborHours', width: 12 },
    { header: 'SUPERVISION DETAILS', key: 'supervisionDetails', width: 25 },
    { header: 'SUPERVISION HRS', key: 'supervisionHours', width: 15 },
    { header: 'DIRECT COST', key: 'directCost', width: 15 },
    { header: 'SUBCONTRACTOR COST', key: 'subcontractorCost', width: 20 }
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

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const allLabor = laborLibrary.map(labor => formatLaborDropdownText(labor, currency));
  const supervisors = laborLibrary
    .filter(labor => {
      return labor.role.toLowerCase().includes('supervisor') ||
             labor.role.toLowerCase().includes('manager') ||
             labor.role.toLowerCase().includes('foreman');
    })
    .map(labor => formatLaborDropdownText(labor, currency));

  for (let i = 2; i <= 102; i++) {
    const row = worksheet.getRow(i);

    worksheet.getCell(`A${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${BOQ_CATEGORIES.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid Category',
      error: 'Please select a valid category from the list'
    };

    worksheet.getCell(`C${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${STANDARD_UOMS.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid UOM',
      error: 'Please select a valid unit of measurement'
    };

    if (allLabor.length > 0) {
      const laborFormula = allLabor.length > 0
        ? `"${allLabor.join(',').replace(/"/g, '""')}"`
        : '""';

      worksheet.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [laborFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Labor',
        error: 'Please select a labor type from the list'
      };
    }

    if (supervisors.length > 0) {
      const supervisorFormula = supervisors.length > 0
        ? `"${supervisors.join(',').replace(/"/g, '""')}"`
        : '""';

      worksheet.getCell(`H${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [supervisorFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Supervisor',
        error: 'Please select a supervisor from the list'
      };
    }

    ['D', 'E', 'G', 'I', 'J', 'K'].forEach(col => {
      worksheet.getCell(`${col}${i}`).numFmt = '#,##0.00';
    });

    row.alignment = { vertical: 'middle' };
  }

  worksheet.getColumn('E').numFmt = `#,##0.00 "${currency}"`;
  worksheet.getColumn('J').numFmt = `#,##0.00 "${currency}"`;
  worksheet.getColumn('K').numFmt = `#,##0.00 "${currency}"`;

  worksheet.autoFilter = {
    from: 'A1',
    to: 'K1'
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export function downloadBOQTemplate(blob: Blob, projectName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const date = new Date().toISOString().split('T')[0];
  link.download = `BOQ_Template_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
