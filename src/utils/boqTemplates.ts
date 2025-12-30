import ExcelJS from 'exceljs';
import type { Asset, MaterialItem } from '../types/retrofit';

const COMMON_CATEGORIES = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Fire Fighting',
  'BMS',
  'Security',
  'Mechanical',
  'Civil',
  'Finishing',
  'Other'
];

const COMMON_UNITS = [
  'pcs',
  'set',
  'm',
  'm2',
  'm3',
  'kg',
  'ton',
  'ltr',
  'box',
  'roll',
  'bag',
  'lot',
  'ls'
];

export async function generateAssetsBOQTemplate(currency: string = 'AED'): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assets BOQ');

  worksheet.columns = [
    { header: 'Asset Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Quantity', key: 'quantity', width: 15 },
    { header: `Unit Cost (${currency})`, key: 'unitCost', width: 20 },
    { header: `Removal Cost Per Unit (${currency})`, key: 'removalCost', width: 25 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  worksheet.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: true,
    deleteColumns: false,
    deleteRows: true,
  });

  ['A', 'B', 'C', 'D', 'E'].forEach(col => {
    const column = worksheet.getColumn(col);
    column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.protection = { locked: false };
      }
    });
  });

  for (let i = 2; i <= 1000; i++) {
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      const cell = worksheet.getCell(`${col}${i}`);
      cell.protection = { locked: false };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function generateMaterialsBOQTemplate(currency: string = 'AED'): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Materials BOQ');

  worksheet.columns = [
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Item', key: 'item', width: 35 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: `Unit Rate (${currency})`, key: 'unitRate', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 15 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (let i = 2; i <= 1000; i++) {
    worksheet.getCell(`A${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${COMMON_CATEGORIES.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid Category',
      error: 'Please select a category from the dropdown list'
    };

    worksheet.getCell(`C${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${COMMON_UNITS.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid Unit',
      error: 'Please select a unit from the dropdown list'
    };
  }

  worksheet.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: true,
    deleteColumns: false,
    deleteRows: true,
  });

  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
    for (let i = 2; i <= 1000; i++) {
      const cell = worksheet.getCell(`${col}${i}`);
      cell.protection = { locked: false };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function parseAssetsBOQ(file: File): Promise<{ success: boolean; data?: Asset[]; errors?: string[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, errors: ['No worksheet found in the file'] };
    }

    const assets: Asset[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const name = row.getCell(1).value?.toString().trim();
      const description = row.getCell(2).value?.toString().trim() || '';
      const quantity = row.getCell(3).value;
      const unitCost = row.getCell(4).value;
      const removalCost = row.getCell(5).value;

      if (!name && !quantity && !unitCost) {
        return;
      }

      if (!name) {
        errors.push(`Row ${rowNumber}: Asset Name is required`);
        return;
      }

      if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 0) {
        errors.push(`Row ${rowNumber}: Valid Quantity is required`);
        return;
      }

      if (!unitCost || isNaN(Number(unitCost)) || Number(unitCost) < 0) {
        errors.push(`Row ${rowNumber}: Valid Unit Cost is required`);
        return;
      }

      const removalCostValue = removalCost && !isNaN(Number(removalCost)) ? Number(removalCost) : 0;

      assets.push({
        id: `asset-${Date.now()}-${Math.random()}`,
        name,
        description,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        removalCostPerUnit: removalCostValue
      });
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    if (assets.length === 0) {
      return { success: false, errors: ['No valid data found in the file'] };
    }

    return { success: true, data: assets };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export async function parseMaterialsBOQ(file: File): Promise<{ success: boolean; data?: MaterialItem[]; errors?: string[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, errors: ['No worksheet found in the file'] };
    }

    const materials: MaterialItem[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const category = row.getCell(1).value?.toString().trim();
      const item = row.getCell(2).value?.toString().trim();
      const unit = row.getCell(3).value?.toString().trim();
      const unitRate = row.getCell(4).value;
      const quantity = row.getCell(5).value;
      const notes = row.getCell(6).value?.toString().trim() || '';

      if (!category && !item && !quantity) {
        return;
      }

      if (!category) {
        errors.push(`Row ${rowNumber}: Category is required`);
        return;
      }

      if (!item) {
        errors.push(`Row ${rowNumber}: Item is required`);
        return;
      }

      if (!unit) {
        errors.push(`Row ${rowNumber}: Unit is required`);
        return;
      }

      if (!unitRate || isNaN(Number(unitRate)) || Number(unitRate) < 0) {
        errors.push(`Row ${rowNumber}: Valid Unit Rate is required`);
        return;
      }

      if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 0) {
        errors.push(`Row ${rowNumber}: Valid Quantity is required`);
        return;
      }

      materials.push({
        id: `material-${Date.now()}-${Math.random()}`,
        category,
        item,
        unit,
        unitRate: Number(unitRate),
        estimatedQty: Number(quantity),
        notes
      });
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    if (materials.length === 0) {
      return { success: false, errors: ['No valid data found in the file'] };
    }

    return { success: true, data: materials };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export function downloadBOQTemplate(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
