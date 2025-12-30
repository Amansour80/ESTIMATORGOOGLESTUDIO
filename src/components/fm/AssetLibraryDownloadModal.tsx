import { useState } from 'react';
import { X, Download, CheckSquare, Square } from 'lucide-react';

interface AssetLibraryDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onDownload: (selectedCategories: string[], includeDetails: 'assets_only' | 'with_ppms') => void;
}

export default function AssetLibraryDownloadModal({
  isOpen,
  onClose,
  categories,
  onDownload
}: AssetLibraryDownloadModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [includeDetails, setIncludeDetails] = useState<'assets_only' | 'with_ppms'>('with_ppms');
  const [selectAll, setSelectAll] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCategories([]);
      setSelectAll(false);
    } else {
      setSelectedCategories([...categories]);
      setSelectAll(true);
    }
  };

  const handleDownload = () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    onDownload(selectedCategories, includeDetails);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Download Asset Library</h2>
            <p className="text-sm text-gray-600 mt-1">Select categories and export options</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-900">
                Select Categories
              </label>
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {selectAll ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {categories.map(category => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <label
                    key={category}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {category}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-3 block">
              Export Details
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border-2 ${
                  includeDetails === 'assets_only'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="export-type"
                  checked={includeDetails === 'assets_only'}
                  onChange={() => setIncludeDetails('assets_only')}
                  className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className={`text-sm font-medium ${
                    includeDetails === 'assets_only' ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    Assets Only
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Export basic asset information (name, code, category, description)
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border-2 ${
                  includeDetails === 'with_ppms'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="export-type"
                  checked={includeDetails === 'with_ppms'}
                  onChange={() => setIncludeDetails('with_ppms')}
                  className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className={`text-sm font-medium ${
                    includeDetails === 'with_ppms' ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    Assets with PPM Tasks
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Include all PPM tasks with frequency and labor hours for each asset
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">Export Summary</p>
            <ul className="space-y-1">
              <li>
                • <span className="font-medium">{selectedCategories.length}</span> categories selected
              </li>
              <li>
                • Format: <span className="font-medium">CSV</span>
              </li>
              <li>
                • Details: <span className="font-medium">
                  {includeDetails === 'assets_only' ? 'Assets only' : 'Assets with PPM tasks'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selectedCategories.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-5 h-5" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
