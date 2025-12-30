import { useState, useRef, useEffect } from 'react';
import { X, Upload, AlertCircle, CheckCircle, FileText, Download } from 'lucide-react';
import { parseAssetCSV, type ParsedAsset } from '../../utils/assetLibraryCSVParser';
import { supabase } from '../../lib/supabase';
import { detectDuplicates, type DuplicateMatch } from '../../utils/assetDuplicateDetection';
import { fetchIndustryStandardAssets } from '../../utils/industryStandardDatabase';
import type { IndustryStandardAssetLibraryItem } from '../../types/fm';
import DuplicateReviewModal from './DuplicateReviewModal';

interface AssetLibraryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function AssetLibraryImportModal({
  isOpen,
  onClose,
  onImportSuccess
}: AssetLibraryImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedAssets, setParsedAssets] = useState<ParsedAsset[]>([]);
  const [assetsToImport, setAssetsToImport] = useState<ParsedAsset[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ assets: 0, tasks: 0 });
  const [existingAssets, setExistingAssets] = useState<IndustryStandardAssetLibraryItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadExistingAssets();
    }
  }, [isOpen]);

  const loadExistingAssets = async () => {
    try {
      const assets = await fetchIndustryStandardAssets();
      setExistingAssets(assets);
    } catch (error) {
      console.error('Failed to load existing assets:', error);
    }
  };

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setWarnings([]);
    setParsedAssets([]);
    setAssetsToImport([]);
    setDuplicates([]);
    setImportComplete(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const result = parseAssetCSV(text);

      setErrors(result.errors);
      setWarnings(result.warnings);

      if (result.success) {
        setParsedAssets(result.assets);

        // Ensure we have the latest existing assets for duplicate detection
        const currentExistingAssets = existingAssets.length > 0
          ? existingAssets
          : await fetchIndustryStandardAssets();

        if (currentExistingAssets.length > 0 && existingAssets.length === 0) {
          setExistingAssets(currentExistingAssets);
        }

        const duplicateCheck = detectDuplicates(result.assets, currentExistingAssets, 85);

        if (duplicateCheck.hasDuplicates) {
          setDuplicates(duplicateCheck.duplicates);
          setAssetsToImport(duplicateCheck.uniqueAssets);
        } else {
          setAssetsToImport(result.assets);
        }
      }
    };

    reader.onerror = () => {
      setErrors(['Failed to read file. Please try again.']);
    };

    reader.readAsText(selectedFile);
  };

  const handleDuplicateResolve = (decisions: Map<number, 'skip' | 'import'>) => {
    const assetsToAdd = [...assetsToImport];

    duplicates.forEach((duplicate) => {
      const decision = decisions.get(duplicate.newAssetIndex);
      if (decision === 'import') {
        assetsToAdd.push(duplicate.newAsset);
      }
    });

    setAssetsToImport(assetsToAdd);
    setDuplicates([]);
    setShowDuplicateModal(false);
  };

  const handleProceedToImport = () => {
    if (duplicates.length > 0) {
      setShowDuplicateModal(true);
    } else {
      handleImport();
    }
  };

  const handleImport = async () => {
    if (assetsToImport.length === 0) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      let assetsImported = 0;
      let tasksImported = 0;

      for (const parsedAsset of assetsToImport) {
        const assetId = crypto.randomUUID();

        const { error: assetError } = await supabase
          .from('industry_standard_asset_library')
          .insert({
            id: assetId,
            ...parsedAsset.asset
          });

        if (assetError) {
          throw new Error(`Failed to import asset "${parsedAsset.asset.asset_name}": ${assetError.message}`);
        }

        assetsImported++;

        if (parsedAsset.tasks.length > 0) {
          const tasksToInsert = parsedAsset.tasks.map(task => ({
            id: crypto.randomUUID(),
            asset_id: assetId,
            ...task
          }));

          const { error: tasksError } = await supabase
            .from('industry_standard_ppm_tasks')
            .insert(tasksToInsert);

          if (tasksError) {
            throw new Error(`Failed to import tasks for "${parsedAsset.asset.asset_name}": ${tasksError.message}`);
          }

          tasksImported += parsedAsset.tasks.length;
        }
      }

      setImportStats({ assets: assetsImported, tasks: tasksImported });
      setImportComplete(true);
      setParsedAssets([]);
      setFile(null);

      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setErrors([error instanceof Error ? error.message : 'Import failed. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedAssets([]);
    setAssetsToImport([]);
    setDuplicates([]);
    setErrors([]);
    setWarnings([]);
    setImportComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalTasks = parsedAssets.reduce((sum, asset) => sum + asset.tasks.length, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Assets from CSV</h2>
            <p className="text-sm text-gray-600 mt-1">Upload a CSV file to import multiple assets at once</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {importComplete ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Successful!</h3>
              <p className="text-gray-600 text-center mb-4">
                Imported {importStats.assets} asset{importStats.assets !== 1 ? 's' : ''} with {importStats.tasks} PPM task{importStats.tasks !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-500">Closing automatically...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-700">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500 mt-1">CSV files only</span>
                  </label>
                </div>
                {file && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{file.name}</span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-900 mb-2">Errors Found</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2">Warnings</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

{parsedAssets.length > 0 && (
                <>
                  {duplicates.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-2">Potential Duplicates Detected</h4>
                          <p className="text-sm text-yellow-800">
                            Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''}. You'll be able to review them before importing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">Ready to Import</h4>
                        <p className="text-sm text-green-800">
                          {assetsToImport.length > 0 ? (
                            <>
                              {assetsToImport.length} unique asset{assetsToImport.length !== 1 ? 's' : ''} ready to import
                              {duplicates.length > 0 && ` (${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''} will be reviewed)`}
                            </>
                          ) : (
                            `All ${parsedAssets.length} asset${parsedAssets.length !== 1 ? 's appear' : ' appears'} to be duplicate${parsedAssets.length !== 1 ? 's' : ''}`
                          )}
                        </p>
                        {assetsToImport.length > 0 && (
                          <div className="mt-3 max-h-40 overflow-y-auto">
                            <ul className="text-sm text-green-800 space-y-1">
                              {assetsToImport.map((asset, index) => (
                                <li key={index}>
                                  • <span className="font-medium">{asset.asset.asset_name}</span> ({asset.asset.category}) - {asset.tasks.length} task{asset.tasks.length !== 1 ? 's' : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!importComplete && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToImport}
              disabled={parsedAssets.length === 0 || errors.length > 0 || isProcessing || (assetsToImport.length === 0 && duplicates.length === 0)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {duplicates.length > 0 ? 'Review & Import' : `Import ${assetsToImport.length} Asset${assetsToImport.length !== 1 ? 's' : ''}`}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <DuplicateReviewModal
        isOpen={showDuplicateModal}
        duplicates={duplicates}
        onClose={() => setShowDuplicateModal(false)}
        onResolve={(decisions) => {
          handleDuplicateResolve(decisions);
          handleImport();
        }}
      />
    </div>
  );
}
