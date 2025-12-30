import { X, Plus, Upload, Download } from 'lucide-react';

interface AddAssetChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManually: () => void;
  onImportCSV: () => void;
  onDownloadTemplate: () => void;
}

export default function AddAssetChoiceModal({
  isOpen,
  onClose,
  onAddManually,
  onImportCSV,
  onDownloadTemplate
}: AddAssetChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Assets</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Choose how you would like to add new assets to the library
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                onClose();
                onAddManually();
              }}
              className="group relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all text-left"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Add Manually</h3>
                  <p className="text-sm text-gray-600">
                    Add a single asset with its details and PPM tasks using the form interface
                  </p>
                </div>
              </div>
            </button>

            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Import from CSV</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload multiple assets at once using a CSV file
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <button
                    onClick={onDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onImportCSV();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Upload CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">CSV Import Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Download the template to see the required format</li>
              <li>• Each row can represent an asset or a PPM task for that asset</li>
              <li>• Group PPM tasks under their assets by leaving asset fields empty in subsequent rows</li>
              <li>• Use standard frequency values: Daily, Weekly, Monthly, Quarterly, Semi-annual, Annual</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
