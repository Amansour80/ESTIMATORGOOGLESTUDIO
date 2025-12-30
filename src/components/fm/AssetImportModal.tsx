import { useState, useCallback } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Search, Info } from 'lucide-react';
import ExcelJS from 'exceljs';
import type { IndustryStandardAssetLibraryItem, AssetType, TechnicianType } from '../../types/fm';
import { matchAssets, recordCorrection, clearMatchCache, type UploadedAsset, type AssetMatch } from '../../utils/assetMatcherEnhanced';
import { fetchIndustryStandardAssets, fetchIndustryStandardAssetWithTasks, fetchMultipleIndustryStandardAssetsWithTasks, convertIndustryStandardToAssetType } from '../../utils/industryStandardDatabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import AssetLibraryBrowserModal from './AssetLibraryBrowserModal';

// Performance optimization: Reduce console logging
const ENABLE_VERBOSE_LOGGING = false;

interface AssetImportModalProps {
  onClose: () => void;
  onImport: (assets: AssetType[], quantities: Map<string, number>) => void;
  existingAssets: AssetType[];
  technicians?: TechnicianType[];
}

type Step = 'upload' | 'mapping' | 'review' | 'duplicates';

export default function AssetImportModal({ onClose, onImport, existingAssets }: AssetImportModalProps) {
  const { currentOrganization } = useOrganization();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<{
    assetType: string;
    brand: string;
    model: string;
    quantity: string;
  }>({ assetType: '', brand: '', model: '', quantity: '' });
  const [matches, setMatches] = useState<AssetMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Map<number, string>>(new Map());
  const [learnedMatches, setLearnedMatches] = useState<Map<number, boolean>>(new Map());
  const [pendingAssets, setPendingAssets] = useState<AssetType[]>([]);
  const [pendingQuantities, setPendingQuantities] = useState<Map<string, number>>(new Map());
  const [duplicateAssets, setDuplicateAssets] = useState<Array<{asset: AssetType; existingAsset: AssetType}>>([]);
  const [selectedDuplicateAction, setSelectedDuplicateAction] = useState<Map<string, 'skip' | 'import'>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [allIndustryAssets, setAllIndustryAssets] = useState<IndustryStandardAssetLibraryItem[]>([]);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [browserModalRowIndex, setBrowserModalRowIndex] = useState<number | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setError('');
    setIsProcessing(true);

    // Clear the match cache to ensure fresh matching with updated learning data
    if (ENABLE_VERBOSE_LOGGING) console.log('[IMPORT] Clearing cache before processing new upload');
    clearMatchCache();

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await uploadedFile.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }

      const parsedColumns: string[] = [];
      const parsedRows: any[][] = [];

      worksheet.eachRow((row, rowNumber) => {
        const rowValues = row.values as any[];
        const cleanValues = rowValues.slice(1);

        if (rowNumber === 1) {
          parsedColumns.push(...cleanValues.map(v => String(v || `Column ${cleanValues.indexOf(v) + 1}`)));
        } else {
          parsedRows.push(cleanValues);
        }
      });

      if (parsedColumns.length === 0) {
        throw new Error('No columns found in Excel file');
      }

      setFile(uploadedFile);
      setColumns(parsedColumns);
      setRows(parsedRows);
      setStep('mapping');

      const autoMapping: any = { assetType: '', brand: '', model: '', quantity: '' };
      parsedColumns.forEach((col, idx) => {
        const colLower = col.toLowerCase();
        if ((colLower.includes('asset') && colLower.includes('type')) || colLower.includes('category')) {
          autoMapping.assetType = String(idx);
        } else if (colLower.includes('brand') || colLower.includes('manufacturer')) {
          autoMapping.brand = String(idx);
        } else if (colLower.includes('model')) {
          autoMapping.model = String(idx);
        } else if (colLower.includes('quantity') || colLower.includes('qty') || colLower.includes('count')) {
          autoMapping.quantity = String(idx);
        }
      });

      setColumnMapping(autoMapping);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleProcessMatching = useCallback(async () => {
    if (!columnMapping.assetType || !columnMapping.quantity) {
      setError('Please map at least Asset Type and Quantity columns');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const allAssets = rows.map((row, idx) => ({
        assetType: String(row[parseInt(columnMapping.assetType)] || '').trim(),
        brand: columnMapping.brand ? String(row[parseInt(columnMapping.brand)] || '').trim() : '',
        model: columnMapping.model ? String(row[parseInt(columnMapping.model)] || '').trim() : '',
        quantity: parseInt(String(row[parseInt(columnMapping.quantity)] || '0')) || 0,
        rowIndex: idx
      }));

      const uploadedAssets = allAssets.filter(asset => asset.assetType && asset.quantity > 0);
      const skippedRows = allAssets.filter(asset => !asset.assetType || asset.quantity <= 0);

      if (uploadedAssets.length === 0) {
        throw new Error('No valid assets found in the uploaded file. Check that Asset Type and Quantity columns are correctly mapped and contain valid data.');
      }

      if (skippedRows.length > 0) {
        console.warn(`⚠️ ${skippedRows.length} row(s) skipped due to missing asset type or invalid quantity`);
      }

      const industryAssets = await fetchIndustryStandardAssets();
      setAllIndustryAssets(industryAssets);

      const assetMatches = await matchAssets(uploadedAssets, industryAssets, currentOrganization?.id);

      setMatches(assetMatches);

      // Auto-select threshold increased from 50% to 65%
      const initialSelections = new Map<number, string>();
      assetMatches.forEach(match => {
        if (match.suggestedMatch && match.confidence >= 65) {
          initialSelections.set(match.uploadedAsset.rowIndex, match.suggestedMatch.id);
        }
      });
      setSelectedMatches(initialSelections);

      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process assets');
    } finally {
      setIsProcessing(false);
    }
  }, [columnMapping, rows]);

  const handleMatchChange = useCallback(async (rowIndex: number, assetId: string) => {
    setSelectedMatches(prev => {
      const updated = new Map(prev);
      if (assetId === '') {
        updated.delete(rowIndex);
      } else {
        updated.set(rowIndex, assetId);
      }
      return updated;
    });

    // Clear learned status if match is changed
    setLearnedMatches(prev => {
      const updated = new Map(prev);
      updated.delete(rowIndex);
      return updated;
    });
  }, [matches, currentOrganization]);

  const handleLearnMatch = useCallback(async (rowIndex: number) => {
    const match = matches.find(m => m.uploadedAsset.rowIndex === rowIndex);
    const selectedAssetId = selectedMatches.get(rowIndex);

    if (!match || !selectedAssetId || !currentOrganization) return;

    try {
      await recordCorrection(
        currentOrganization.id,
        match.uploadedAsset.assetType,
        selectedAssetId
      );

      // Mark as learned
      setLearnedMatches(prev => {
        const updated = new Map(prev);
        updated.set(rowIndex, true);
        return updated;
      });

      // Clear cache to apply learning immediately
      clearMatchCache();
    } catch (error) {
      console.error('[LEARN BUTTON] Failed to record learning:', error);
      alert('Failed to record learning. Please try again.');
    }
  }, [matches, selectedMatches, currentOrganization]);

  const handleOpenBrowser = useCallback((rowIndex: number) => {
    setBrowserModalRowIndex(rowIndex);
    setShowBrowserModal(true);
  }, []);

  const handleBrowserSelect = useCallback((asset: IndustryStandardAssetLibraryItem) => {
    if (browserModalRowIndex !== null) {
      handleMatchChange(browserModalRowIndex, asset.id);
    }
    setShowBrowserModal(false);
    setBrowserModalRowIndex(null);
  }, [browserModalRowIndex, handleMatchChange]);

  const handleProceedToImport = useCallback(async () => {
    setIsProcessing(true);
    setError('');

    try {
      if (ENABLE_VERBOSE_LOGGING) console.log('=== IMPORT PROCESS STARTED ===');
      console.log('Total matches to process:', matches.length);
      console.log('Selected matches:', Array.from(selectedMatches.entries()));

      const assetsToImport: AssetType[] = [];
      const quantities = new Map<string, number>();
      const lowConfidenceAssets: Array<{asset: string; confidence: number; brand?: string; model?: string}> = [];

      const uniqueAssetIds = new Set<string>();
      const matchesByAssetId = new Map<string, typeof matches>();

      for (const match of matches) {
        const selectedAssetId = selectedMatches.get(match.uploadedAsset.rowIndex);
        if (!selectedAssetId) {
          if (ENABLE_VERBOSE_LOGGING) console.log(`Skipping row ${match.uploadedAsset.rowIndex} - no selection`);
          continue;
        }

        uniqueAssetIds.add(selectedAssetId);
        if (!matchesByAssetId.has(selectedAssetId)) {
          matchesByAssetId.set(selectedAssetId, []);
        }
        matchesByAssetId.get(selectedAssetId)!.push(match);

        if (match.confidence < 50) {
          lowConfidenceAssets.push({
            asset: match.uploadedAsset.assetType,
            confidence: match.confidence,
            brand: match.uploadedAsset.brand,
            model: match.uploadedAsset.model
          });
        }
      }

      const assetMap = await fetchMultipleIndustryStandardAssetsWithTasks(Array.from(uniqueAssetIds));

      assetMap.forEach((standardAssetWithTasks, assetId) => {
        const matchesForAsset = matchesByAssetId.get(assetId) || [];

        const newAsset = convertIndustryStandardToAssetType(standardAssetWithTasks);
        if (ENABLE_VERBOSE_LOGGING) console.log(`Converted asset: ${newAsset.assetName} (category: ${newAsset.category})`);

        const alreadyImported = assetsToImport.find(
          a => a.category === newAsset.category && a.assetName === newAsset.assetName
        );

        const totalQuantity = matchesForAsset.reduce((sum, match) => sum + match.uploadedAsset.quantity, 0);

        if (alreadyImported) {
          const currentQty = quantities.get(alreadyImported.id) || 0;
          const newQty = currentQty + totalQuantity;
          quantities.set(alreadyImported.id, newQty);
          if (ENABLE_VERBOSE_LOGGING) console.log(`Asset already in import list - adding quantity: ${currentQty} + ${totalQuantity} = ${newQty}`);
        } else {
          assetsToImport.push(newAsset);
          quantities.set(newAsset.id, totalQuantity);
          if (ENABLE_VERBOSE_LOGGING) console.log(`Added new asset to import list with quantity: ${totalQuantity}`);
        }
      });

      if (ENABLE_VERBOSE_LOGGING) console.log('=== IMPORT PROCESSING COMPLETE ===');

      setPendingAssets(assetsToImport);
      setPendingQuantities(quantities);

      const duplicates: Array<{asset: AssetType; existingAsset: AssetType}> = [];
      assetsToImport.forEach(newAsset => {
        const existing = existingAssets.find(
          a => a.category === newAsset.category && a.assetName === newAsset.assetName
        );
        if (existing) {
          duplicates.push({ asset: newAsset, existingAsset: existing });
        }
      });

      if (duplicates.length > 0) {
        setDuplicateAssets(duplicates);
        const initialActions = new Map<string, 'skip' | 'import'>();
        duplicates.forEach(dup => {
          initialActions.set(dup.asset.id, 'skip');
        });
        setSelectedDuplicateAction(initialActions);
        setStep('duplicates');
      } else {
        onImport(assetsToImport, quantities);
        onClose();
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process assets');
    } finally {
      setIsProcessing(false);
    }
  }, [matches, selectedMatches, existingAssets, currentOrganization, onImport, onClose]);

  const handleConfirmImport = useCallback(() => {
    const assetsToImport: AssetType[] = [];
    const quantitiesToImport = new Map<string, number>();

    pendingAssets.forEach(asset => {
      const action = selectedDuplicateAction.get(asset.id);
      if (action === 'import' || !duplicateAssets.find(d => d.asset.id === asset.id)) {
        assetsToImport.push(asset);
        const qty = pendingQuantities.get(asset.id) || 0;
        quantitiesToImport.set(asset.id, qty);
      }
    });

    onImport(assetsToImport, quantitiesToImport);
    onClose();
  }, [pendingAssets, pendingQuantities, duplicateAssets, selectedDuplicateAction, onImport, onClose]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import Assets from Excel</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'upload' && 'Upload your asset list Excel file'}
              {step === 'mapping' && 'Map columns to asset fields'}
              {step === 'review' && 'Review and confirm asset matches'}
              {step === 'duplicates' && 'Handle duplicate assets'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-md">
                <label className="flex flex-col items-center px-4 py-8 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <span className="mt-4 text-base text-gray-600">
                    {file ? file.name : 'Click to upload Excel file'}
                  </span>
                  <span className="mt-2 text-sm text-gray-500">
                    Supports .xlsx and .xls files
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Map the columns from your Excel file to the required asset fields.
                  We've pre-selected likely matches for you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type / Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.assetType}
                    onChange={e => setColumnMapping(prev => ({ ...prev, assetType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col, idx) => (
                      <option key={idx} value={String(idx)}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.quantity}
                    onChange={e => setColumnMapping(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col, idx) => (
                      <option key={idx} value={String(idx)}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand (Optional)
                  </label>
                  <select
                    value={columnMapping.brand}
                    onChange={e => setColumnMapping(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col, idx) => (
                      <option key={idx} value={String(idx)}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model (Optional)
                  </label>
                  <select
                    value={columnMapping.model}
                    onChange={e => setColumnMapping(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col, idx) => (
                      <option key={idx} value={String(idx)}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Preview (First 3 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 text-left font-medium text-gray-700">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((row, idx) => (
                        <tr key={idx} className="border-b">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 text-gray-600">
                              {String(cell || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'duplicates' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Duplicate Assets Detected
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {duplicateAssets.length} asset(s) already exist in your library. Choose whether to skip or import them anyway.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {duplicateAssets.map(({ asset, existingAsset }) => (
                  <div key={asset.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {asset.category} - {asset.assetName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity to import: {pendingQuantities.get(asset.id) || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1"
                        style={{
                          borderColor: selectedDuplicateAction.get(asset.id) === 'skip' ? '#3b82f6' : '#d1d5db',
                          backgroundColor: selectedDuplicateAction.get(asset.id) === 'skip' ? '#eff6ff' : 'white'
                        }}>
                        <input
                          type="radio"
                          name={`action-${asset.id}`}
                          checked={selectedDuplicateAction.get(asset.id) === 'skip'}
                          onChange={() => setSelectedDuplicateAction(prev => {
                            const updated = new Map(prev);
                            updated.set(asset.id, 'skip');
                            return updated;
                          })}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium">Skip (keep existing)</span>
                      </label>

                      <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1"
                        style={{
                          borderColor: selectedDuplicateAction.get(asset.id) === 'import' ? '#3b82f6' : '#d1d5db',
                          backgroundColor: selectedDuplicateAction.get(asset.id) === 'import' ? '#eff6ff' : 'white'
                        }}>
                        <input
                          type="radio"
                          name={`action-${asset.id}`}
                          checked={selectedDuplicateAction.get(asset.id) === 'import'}
                          onChange={() => setSelectedDuplicateAction(prev => {
                            const updated = new Map(prev);
                            updated.set(asset.id, 'import');
                            return updated;
                          })}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium">Import anyway (create duplicate)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Found {matches.length} assets to import
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Review the suggested matches below. Use the dropdown to select a different match if needed.
                  </p>
                </div>
              </div>

              {rows.length > matches.length && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {rows.length - matches.length} Row(s) Skipped
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Some rows were skipped because they had empty asset types or invalid quantities. Check the browser console for details.
                    </p>
                  </div>
                </div>
              )}

              {matches.some(m => m.confidence < 50) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">
                      Low Confidence Matches Detected
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Some assets have low confidence matches (below 50%). These may need to be added to the industry standard library for future use. A notification will be created for review.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Uploaded Asset</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Brand</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Model</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Qty</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Matched Asset</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Confidence</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Learn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {matches.map((match) => {
                      const selectedId = selectedMatches.get(match.uploadedAsset.rowIndex);
                      const allOptions = [
                        ...(match.suggestedMatch ? [match.suggestedMatch] : []),
                        ...match.alternativeMatches
                      ];

                      // Add the manually selected asset if it's not in allOptions
                      const selectedAsset = selectedId ? allIndustryAssets.find(a => a.id === selectedId) : null;
                      if (selectedAsset && !allOptions.find(a => a.id === selectedId)) {
                        allOptions.unshift(selectedAsset);
                      }

                      // Color-coded by confidence: green (75%+), yellow (50-75%), red (<50%)
                      const rowBgColor = !selectedId ? 'bg-gray-50' :
                        match.confidence >= 75 ? 'bg-green-50' :
                        match.confidence >= 50 ? 'bg-yellow-50' :
                        'bg-red-50';

                      return (
                        <tr key={match.uploadedAsset.rowIndex} className={`${rowBgColor} hover:opacity-80 transition-opacity`}>
                          <td className="px-4 py-3 text-gray-900">{match.uploadedAsset.assetType}</td>
                          <td className="px-4 py-3 text-gray-600">{match.uploadedAsset.brand || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{match.uploadedAsset.model || '-'}</td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{match.uploadedAsset.quantity}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <select
                                value={selectedId || ''}
                                onChange={e => handleMatchChange(match.uploadedAsset.rowIndex, e.target.value)}
                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="">No Match - Skip for Now</option>
                                {allOptions.length > 0 && (
                                  <optgroup label="Suggested Matches">
                                    {allOptions.map(asset => (
                                      <option key={asset.id} value={asset.id}>
                                        {asset.asset_name} ({asset.category})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              <button
                                onClick={() => handleOpenBrowser(match.uploadedAsset.rowIndex)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-blue-600 bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                              >
                                <Search className="h-4 w-4" />
                                Browse All Assets
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {selectedId ? (
                              <div className="flex items-center gap-2">
                                {selectedAsset && !allOptions.slice(1).find(a => a.id === selectedId) &&
                                 (match.suggestedMatch?.id !== selectedId) ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Manual Selection
                                  </span>
                                ) : (
                                  <>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      match.confidence >= 75 ? 'bg-green-100 text-green-800' :
                                      match.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {match.confidence}%
                                    </span>
                                    {match.scoreBreakdown && (
                                      <div className="group relative">
                                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                        <div className="invisible group-hover:visible absolute z-10 right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg">
                                          <div className="font-semibold mb-2">Score Breakdown:</div>
                                          <div className="space-y-1">
                                            <div>Name: {(match.scoreBreakdown.nameScore * 100).toFixed(0)}%</div>
                                            <div>Category: {(match.scoreBreakdown.categoryScore * 100).toFixed(0)}%</div>
                                            <div>Brand: {(match.scoreBreakdown.brandScore * 100).toFixed(0)}%</div>
                                            <div>Model: {(match.scoreBreakdown.modelScore * 100).toFixed(0)}%</div>
                                            {match.scoreBreakdown.standardCodeScore > 0 && (
                                              <div>Std Code: {(match.scoreBreakdown.standardCodeScore * 100).toFixed(0)}%</div>
                                            )}
                                            {match.scoreBreakdown.learningBoost > 0 && (
                                              <div className="text-green-300">Learning: +{(match.scoreBreakdown.learningBoost * 100).toFixed(0)}%</div>
                                            )}
                                          </div>
                                          {match.matchExplanation && (
                                            <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300">
                                              {match.matchExplanation.matchReason}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                Skipped
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {selectedId ? (
                              learnedMatches.get(match.uploadedAsset.rowIndex) ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Learned
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleLearnMatch(match.uploadedAsset.rowIndex)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                                >
                                  Learn Match
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {step === 'mapping' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  onClick={handleProcessMatching}
                  disabled={isProcessing || !columnMapping.assetType || !columnMapping.quantity}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Find Matches'}
                </button>
              </>
            )}
            {step === 'review' && (
              <>
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToImport}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isProcessing ? 'Processing...' : `Import ${selectedMatches.size} Asset${selectedMatches.size === 1 ? '' : 's'}`}
                </button>
              </>
            )}
            {step === 'duplicates' && (
              <>
                <button
                  onClick={() => setStep('review')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isProcessing ? 'Importing...' : `Complete Import`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showBrowserModal && (
        <AssetLibraryBrowserModal
          onClose={() => {
            setShowBrowserModal(false);
            setBrowserModalRowIndex(null);
          }}
          onSelect={handleBrowserSelect}
          allAssets={allIndustryAssets}
        />
      )}
    </div>
  );
}
