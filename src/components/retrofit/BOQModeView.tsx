import React, { useState, useRef } from 'react';
import { Download, Upload, Plus, AlertCircle, FileSpreadsheet, FileText, Users } from 'lucide-react';
import { BOQLineItem, BOQ_CATEGORIES, STANDARD_UOMS } from '../../types/boq';
import { OrgRetrofitLabor } from '../../utils/laborLibraryDatabase';
import { generateBOQTemplate, downloadBOQTemplate } from '../../utils/boqTemplate';
import { parseBOQExcel } from '../../utils/boqParser';
import { calculateBOQSummary } from '../../utils/boqCalculations';
import { BOQLineItemTable } from './BOQLineItemTable';
import { BOQSummary } from './BOQSummary';
import { exportBOQToExcel } from '../../utils/exportBOQExcel';
import { exportBOQToPDFEnhanced } from '../../utils/exportBOQPDFEnhanced';
import { exportClientBOQToPDF, exportClientBOQToExcel } from '../../utils/exportClientBOQ';
import { RetrofitCostConfig } from '../../types/retrofit';

interface BOQModeViewProps {
  projectName: string;
  projectInfo?: {
    location: string;
    client: string;
    description: string;
  };
  lineItems: BOQLineItem[];
  laborLibrary: OrgRetrofitLabor[];
  currency: string;
  costConfig: RetrofitCostConfig;
  onLineItemsChange: (lineItems: BOQLineItem[]) => void;
}

export function BOQModeView({
  projectName,
  projectInfo,
  lineItems,
  laborLibrary,
  currency,
  costConfig,
  onLineItemsChange
}: BOQModeViewProps) {
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BOQLineItem>>({
    category: BOQ_CATEGORIES[0],
    description: '',
    uom: STANDARD_UOMS[0],
    quantity: 0,
    unitMaterialCost: 0,
    laborDetailId: null,
    laborHours: 0,
    supervisionDetailId: null,
    supervisionHours: 0,
    directCost: 0,
    subcontractorCost: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsGeneratingTemplate(true);
      const blob = await generateBOQTemplate(projectName, laborLibrary, currency);
      downloadBOQTemplate(blob, projectName);
    } catch (error) {
      console.error('Error generating template:', error);
      alert('Failed to generate BOQ template. Please try again.');
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const result = await parseBOQExcel(file, laborLibrary);

      if (!result.success) {
        const errorMessages = result.errors?.map(e => `Row ${e.rowIndex}: ${e.message}`).join('\n') || 'Unknown error';
        setUploadError(errorMessages);
        return;
      }

      if (result.lineItems) {
        onLineItemsChange(result.lineItems);
      }
    } catch (error) {
      console.error('Error uploading BOQ:', error);
      setUploadError('Failed to parse Excel file. Please check the format and try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<BOQLineItem>) => {
    const updatedItems = lineItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    onLineItemsChange(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this line item?')) {
      onLineItemsChange(lineItems.filter(item => item.id !== id));
    }
  };

  const handleAddNewItem = () => {
    if (!newItem.description || !newItem.category || !newItem.uom || !newItem.quantity) {
      alert('Please fill in all required fields (Category, Description, UOM, Quantity)');
      return;
    }

    const item: BOQLineItem = {
      id: crypto.randomUUID(),
      category: newItem.category as string,
      description: newItem.description,
      uom: newItem.uom as string,
      quantity: newItem.quantity,
      unitMaterialCost: newItem.unitMaterialCost || 0,
      laborDetailId: newItem.laborDetailId || null,
      laborHours: newItem.laborHours || 0,
      supervisionDetailId: newItem.supervisionDetailId || null,
      supervisionHours: newItem.supervisionHours || 0,
      directCost: newItem.directCost || 0,
      subcontractorCost: newItem.subcontractorCost || 0
    };

    onLineItemsChange([...lineItems, item]);
    setShowAddForm(false);
    setNewItem({
      category: BOQ_CATEGORIES[0],
      description: '',
      uom: STANDARD_UOMS[0],
      quantity: 0,
      unitMaterialCost: 0,
      laborDetailId: null,
      laborHours: 0,
      supervisionDetailId: null,
      supervisionHours: 0,
      directCost: 0,
      subcontractorCost: 0
    });
  };

  const summary = lineItems.length > 0 ? calculateBOQSummary(lineItems, laborLibrary) : null;

  const supervisors = laborLibrary.filter(labor =>
    labor.role.toLowerCase().includes('supervisor') ||
    labor.role.toLowerCase().includes('manager') ||
    labor.role.toLowerCase().includes('foreman')
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">BOQ Import Mode</h2>
        <p className="text-gray-700 mb-4">
          Download the template, fill it with your BOQ data, and upload it back to populate the project.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTemplate}
            disabled={isGeneratingTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-5 h-5" />
            {isGeneratingTemplate ? 'Generating...' : 'Download BOQ Template'}
          </button>

          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? 'Uploading...' : 'Upload BOQ Excel'}
          </button>

          {lineItems.length > 0 && (
            <>
              <button
                onClick={async () => {
                  try {
                    await exportBOQToExcel(projectName, lineItems, laborLibrary, currency);
                  } catch (error) {
                    console.error('Error exporting to Excel:', error);
                    alert('Failed to export to Excel. Please try again.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Export to Excel
              </button>

              <button
                onClick={() => {
                  try {
                    const info = projectInfo || {
                      location: '',
                      client: '',
                      description: ''
                    };
                    exportBOQToPDFEnhanced(projectName, info, lineItems, laborLibrary, costConfig, currency);
                  } catch (error) {
                    console.error('Error exporting to PDF:', error);
                    alert('Failed to export to PDF. Please try again.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Export to PDF
              </button>

              <button
                onClick={async () => {
                  try {
                    const info = projectInfo || {
                      location: '',
                      client: '',
                      description: ''
                    };
                    await exportClientBOQToExcel(projectName, info, lineItems, laborLibrary, costConfig, currency);
                  } catch (error) {
                    console.error('Error exporting Client BOQ Excel:', error);
                    alert('Failed to export Client BOQ Excel. Please try again.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Export Client Excel
              </button>

              <button
                onClick={() => {
                  try {
                    const info = projectInfo || {
                      location: '',
                      client: '',
                      description: ''
                    };
                    exportClientBOQToPDF(projectName, info, lineItems, laborLibrary, costConfig, currency);
                  } catch (error) {
                    console.error('Error exporting Client BOQ PDF:', error);
                    alert('Failed to export Client BOQ PDF. Please try again.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Export Client PDF
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Upload Error</h4>
                <pre className="text-sm text-red-700 whitespace-pre-wrap">{uploadError}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {lineItems.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">BOQ Line Items ({lineItems.length})</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Line Item
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-3">Add New Line Item</h4>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      {BOQ_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Enter description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
                    <select
                      value={newItem.uom}
                      onChange={(e) => setNewItem({ ...newItem, uom: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      {STANDARD_UOMS.map(uom => (
                        <option key={uom} value={uom}>{uom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Mat. Cost</label>
                    <input
                      type="number"
                      value={newItem.unitMaterialCost}
                      onChange={(e) => setNewItem({ ...newItem, unitMaterialCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Labor Hours</label>
                    <input
                      type="number"
                      value={newItem.laborHours}
                      onChange={(e) => setNewItem({ ...newItem, laborHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Superv. Hours</label>
                    <input
                      type="number"
                      value={newItem.supervisionHours}
                      onChange={(e) => setNewItem({ ...newItem, supervisionHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direct Cost</label>
                    <input
                      type="number"
                      value={newItem.directCost}
                      onChange={(e) => setNewItem({ ...newItem, directCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddNewItem}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <BOQLineItemTable
              lineItems={lineItems}
              laborLibrary={laborLibrary}
              currency={currency}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
            />
          </div>

          {summary && <BOQSummary summary={summary} currency={currency} />}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No BOQ Data Yet</h3>
          <p className="text-gray-600 mb-6">
            Download the template above, fill it with your BOQ data, and upload it to get started.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Or Add Line Items Manually
          </button>
        </div>
      )}
    </div>
  );
}
