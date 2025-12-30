import ExcelJS from 'exceljs';
import { BOQLineItem, BOQImportResult, BOQValidationError, BOQ_CATEGORIES } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';
import { parseLaborDropdownText, calculateBOQSummary } from './boqCalculations';

export async function parseBOQExcel(
  file: File,
  laborLibrary: OrgRetrofitLabor[]
): Promise<BOQImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet('BOQ');
    if (!worksheet) {
      return {
        success: false,
        errors: [{
          rowIndex: 0,
          field: 'worksheet',
          message: 'BOQ worksheet not found in the uploaded file'
        }]
      };
    }

    const lineItems: BOQLineItem[] = [];
    const errors: BOQValidationError[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const category = row.getCell(1).value?.toString().trim() || '';
      const description = row.getCell(2).value?.toString().trim() || '';
      const uom = row.getCell(3).value?.toString().trim() || '';
      const qty = parseFloat(row.getCell(4).value?.toString() || '0');
      const materials = parseFloat(row.getCell(5).value?.toString() || '0');
      const laborDetails = row.getCell(6).value?.toString().trim() || '';
      const laborHours = parseFloat(row.getCell(7).value?.toString() || '0');
      const supervisionDetails = row.getCell(8).value?.toString().trim() || '';
      const supervisionHours = parseFloat(row.getCell(9).value?.toString() || '0');
      const directCost = parseFloat(row.getCell(10).value?.toString() || '0');
      const subcontractorCost = parseFloat(row.getCell(11).value?.toString() || '0');

      if (!category && !description && !uom) {
        return;
      }

      if (!category) {
        errors.push({
          rowIndex: rowNumber,
          field: 'category',
          message: 'Category is required'
        });
      }

      if (!description || description.length < 3) {
        errors.push({
          rowIndex: rowNumber,
          field: 'description',
          message: 'Description is required and must be at least 3 characters'
        });
      }

      if (!uom) {
        errors.push({
          rowIndex: rowNumber,
          field: 'uom',
          message: 'Unit of measurement is required'
        });
      }

      if (qty <= 0 || isNaN(qty)) {
        errors.push({
          rowIndex: rowNumber,
          field: 'qty',
          message: 'Quantity must be greater than 0'
        });
      }

      if (isNaN(materials) || materials < 0) {
        errors.push({
          rowIndex: rowNumber,
          field: 'materials',
          message: 'Unit material cost must be 0 or positive'
        });
      }

      if (isNaN(laborHours) || laborHours < 0) {
        errors.push({
          rowIndex: rowNumber,
          field: 'laborHours',
          message: 'Labor hours must be 0 or positive'
        });
      }

      if (isNaN(supervisionHours) || supervisionHours < 0) {
        errors.push({
          rowIndex: rowNumber,
          field: 'supervisionHours',
          message: 'Supervision hours must be 0 or positive'
        });
      }

      if (isNaN(directCost) || directCost < 0) {
        errors.push({
          rowIndex: rowNumber,
          field: 'directCost',
          message: 'Direct cost must be 0 or positive'
        });
      }

      if (isNaN(subcontractorCost) || subcontractorCost < 0) {
        errors.push({
          rowIndex: rowNumber,
          field: 'subcontractorCost',
          message: 'Subcontractor cost must be 0 or positive'
        });
      }

      let laborId: string | null = null;
      if (laborDetails && laborHours > 0) {
        const parsedLabor = parseLaborDropdownText(laborDetails);
        if (parsedLabor) {
          const matchedLabor = laborLibrary.find(l =>
            l.role.toLowerCase() === parsedLabor.role.toLowerCase()
          );
          if (matchedLabor) {
            laborId = matchedLabor.id;
          } else {
            errors.push({
              rowIndex: rowNumber,
              field: 'laborDetails',
              message: `Labor type "${parsedLabor.role}" not found in library`
            });
          }
        } else {
          errors.push({
            rowIndex: rowNumber,
            field: 'laborDetails',
            message: 'Invalid labor details format'
          });
        }
      } else if (laborHours > 0 && !laborDetails) {
        errors.push({
          rowIndex: rowNumber,
          field: 'laborDetails',
          message: 'Labor details required when labor hours > 0'
        });
      }

      let supervisionId: string | null = null;
      if (supervisionDetails && supervisionHours > 0) {
        const parsedSupervision = parseLaborDropdownText(supervisionDetails);
        if (parsedSupervision) {
          const matchedSupervisor = laborLibrary.find(l =>
            l.role.toLowerCase() === parsedSupervision.role.toLowerCase()
          );
          if (matchedSupervisor) {
            supervisionId = matchedSupervisor.id;
          } else {
            errors.push({
              rowIndex: rowNumber,
              field: 'supervisionDetails',
              message: `Supervisor type "${parsedSupervision.role}" not found in library`
            });
          }
        } else {
          errors.push({
            rowIndex: rowNumber,
            field: 'supervisionDetails',
            message: 'Invalid supervision details format'
          });
        }
      } else if (supervisionHours > 0 && !supervisionDetails) {
        errors.push({
          rowIndex: rowNumber,
          field: 'supervisionDetails',
          message: 'Supervision details required when supervision hours > 0'
        });
      }

      if (errors.filter(e => e.rowIndex === rowNumber).length === 0) {
        lineItems.push({
          id: crypto.randomUUID(),
          category,
          description,
          uom,
          quantity: qty,
          unitMaterialCost: materials,
          laborDetailId: laborId,
          laborHours,
          supervisionDetailId: supervisionId,
          supervisionHours,
          directCost,
          subcontractorCost
        });
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }

    if (lineItems.length === 0) {
      return {
        success: false,
        errors: [{
          rowIndex: 0,
          field: 'general',
          message: 'No valid line items found in the uploaded file'
        }]
      };
    }

    const summary = calculateBOQSummary(lineItems, laborLibrary);

    return {
      success: true,
      lineItems,
      summary
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        rowIndex: 0,
        field: 'file',
        message: error instanceof Error ? error.message : 'Failed to parse Excel file'
      }]
    };
  }
}
