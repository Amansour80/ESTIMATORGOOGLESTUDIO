import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import type { IndustryStandardAssetLibraryItem } from '../../types/fm';

interface AssetLibraryBrowserModalProps {
  onClose: () => void;
  onSelect: (asset: IndustryStandardAssetLibraryItem) => void;
  allAssets: IndustryStandardAssetLibraryItem[];
}

export default function AssetLibraryBrowserModal({ onClose, onSelect, allAssets }: AssetLibraryBrowserModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(allAssets.map(a => a.category));
    return ['all', ...Array.from(cats).sort()];
  }, [allAssets]);

  const filteredAssets = useMemo(() => {
    let filtered = allAssets;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.asset_name.toLowerCase().includes(search) ||
        a.category.toLowerCase().includes(search) ||
        (a.description && a.description.toLowerCase().includes(search))
      );
    }

    return filtered.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.asset_name.localeCompare(b.asset_name);
    });
  }, [allAssets, searchTerm, selectedCategory]);

  const handleSelect = (asset: IndustryStandardAssetLibraryItem) => {
    onSelect(asset);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Browse Industry Standard Asset Library</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select the correct asset from {allAssets.length} available options
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by asset name, category, or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredAssets.length} of {allAssets.length} assets
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No assets found matching your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Asset Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{asset.asset_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-md truncate">
                        {asset.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleSelect(asset)}
                          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
