import type { IndustryStandardAssetLibraryItem, IndustryStandardTask } from '../types/fm';

export interface ParsedAsset {
  asset: Omit<IndustryStandardAssetLibraryItem, 'id'>;
  tasks: Omit<IndustryStandardTask, 'id' | 'asset_id'>[];
}

export interface CSVParseResult {
  success: boolean;
  assets: ParsedAsset[];
  errors: string[];
  warnings: string[];
}

const VALID_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual'];

export function parseAssetCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const assets: ParsedAsset[] = [];

  try {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) {
      errors.push('CSV file is empty');
      return { success: false, assets: [], errors, warnings };
    }

    const headers = parseCSVLine(lines[0]);

    const expectedHeaders = ['Category', 'Standard Code', 'Asset Name', 'Description', 'PPM Task Name', 'Frequency', 'Hours per Task', 'Task Order'];
    const headersMismatch = expectedHeaders.some((h, i) => headers[i]?.trim() !== h);

    if (headersMismatch) {
      errors.push(`Invalid headers. Expected: ${expectedHeaders.join(', ')}`);
      return { success: false, assets: [], errors, warnings };
    }

    let currentAsset: ParsedAsset | null = null;
    let lineNumber = 1;

    for (let i = 1; i < lines.length; i++) {
      lineNumber = i + 1;
      const line = lines[i];
      if (!line) continue;

      const cells = parseCSVLine(line);

      if (cells.length < 8) {
        errors.push(`Line ${lineNumber}: Insufficient columns (expected 8, got ${cells.length})`);
        continue;
      }

      const [category, standardCode, assetName, description, taskName, frequency, hoursPerTask, taskOrder] = cells;

      if (category.trim() && assetName.trim()) {
        if (currentAsset) {
          assets.push(currentAsset);
        }

        if (!category.trim()) {
          errors.push(`Line ${lineNumber}: Category is required for new assets`);
          continue;
        }

        if (!assetName.trim()) {
          errors.push(`Line ${lineNumber}: Asset Name is required`);
          continue;
        }

        currentAsset = {
          asset: {
            category: category.trim(),
            standard_code: standardCode.trim() || null,
            asset_name: assetName.trim(),
            description: description.trim() || null
          },
          tasks: []
        };

        if (taskName.trim()) {
          const taskError = validateAndAddTask(currentAsset, taskName, frequency, hoursPerTask, taskOrder, lineNumber, errors, warnings);
          if (taskError) continue;
        }
      } else if (currentAsset && taskName.trim()) {
        const taskError = validateAndAddTask(currentAsset, taskName, frequency, hoursPerTask, taskOrder, lineNumber, errors, warnings);
        if (taskError) continue;
      } else if (taskName.trim() && !currentAsset) {
        errors.push(`Line ${lineNumber}: PPM task found without a parent asset`);
      }
    }

    if (currentAsset) {
      assets.push(currentAsset);
    }

    if (assets.length === 0 && errors.length === 0) {
      errors.push('No valid assets found in CSV file');
    }

    return {
      success: errors.length === 0,
      assets,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, assets: [], errors, warnings };
  }
}

function validateAndAddTask(
  currentAsset: ParsedAsset,
  taskName: string,
  frequency: string,
  hoursPerTask: string,
  taskOrder: string,
  lineNumber: number,
  errors: string[],
  warnings: string[]
): boolean {
  if (!frequency.trim()) {
    errors.push(`Line ${lineNumber}: Frequency is required for PPM tasks`);
    return true;
  }

  if (!VALID_FREQUENCIES.includes(frequency.trim())) {
    errors.push(`Line ${lineNumber}: Invalid frequency "${frequency}". Must be one of: ${VALID_FREQUENCIES.join(', ')}`);
    return true;
  }

  const hours = parseFloat(hoursPerTask);
  if (isNaN(hours) || hours <= 0) {
    errors.push(`Line ${lineNumber}: Hours per Task must be a positive number`);
    return true;
  }

  const order = taskOrder.trim() ? parseInt(taskOrder) : currentAsset.tasks.length + 1;
  if (isNaN(order)) {
    warnings.push(`Line ${lineNumber}: Invalid task order, using auto-increment`);
  }

  currentAsset.tasks.push({
    task_name: taskName.trim(),
    frequency: frequency.trim() as 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Semi-annual' | 'Annual',
    hours_per_task: hours,
    task_order: order
  });

  return false;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
