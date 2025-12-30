import { calculateSimilarity, normalizeString } from './stringSimilarity';
import type { IndustryStandardAssetLibraryItem } from '../types/fm';
import type { ParsedAsset } from './assetLibraryCSVParser';

export interface DuplicateMatch {
  newAsset: ParsedAsset;
  existingAsset: IndustryStandardAssetLibraryItem;
  matchType: 'exact' | 'standard_code' | 'fuzzy';
  similarity: number;
  newAssetIndex: number;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: DuplicateMatch[];
  uniqueAssets: ParsedAsset[];
}

export function detectDuplicates(
  newAssets: ParsedAsset[],
  existingAssets: IndustryStandardAssetLibraryItem[],
  fuzzyThreshold: number = 85
): DuplicateCheckResult {
  const duplicates: DuplicateMatch[] = [];
  const uniqueAssets: ParsedAsset[] = [];

  newAssets.forEach((newAsset, index) => {
    let foundDuplicate = false;

    for (const existingAsset of existingAssets) {
      const match = checkAssetMatch(newAsset, existingAsset, fuzzyThreshold);

      if (match) {
        duplicates.push({
          newAsset,
          existingAsset,
          matchType: match.type,
          similarity: match.similarity,
          newAssetIndex: index
        });
        foundDuplicate = true;
        break;
      }
    }

    if (!foundDuplicate) {
      uniqueAssets.push(newAsset);
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
    uniqueAssets
  };
}

function checkAssetMatch(
  newAsset: ParsedAsset,
  existingAsset: IndustryStandardAssetLibraryItem,
  fuzzyThreshold: number
): { type: 'exact' | 'standard_code' | 'fuzzy'; similarity: number } | null {
  const newName = newAsset.asset.asset_name;
  const existingName = existingAsset.asset_name;
  const newCategory = newAsset.asset.category;
  const existingCategory = existingAsset.category;
  const newCode = newAsset.asset.standard_code;
  const existingCode = existingAsset.standard_code;

  if (newCode && existingCode && normalizeString(newCode) === normalizeString(existingCode)) {
    return { type: 'standard_code', similarity: 100 };
  }

  if (newCategory === existingCategory) {
    const normalizedNew = normalizeString(newName);
    const normalizedExisting = normalizeString(existingName);

    if (normalizedNew === normalizedExisting) {
      return { type: 'exact', similarity: 100 };
    }

    const similarity = calculateSimilarity(newName, existingName);
    if (similarity >= fuzzyThreshold) {
      return { type: 'fuzzy', similarity };
    }
  }

  return null;
}

export function findSimilarAssets(
  assetName: string,
  category: string,
  existingAssets: IndustryStandardAssetLibraryItem[],
  threshold: number = 70
): Array<{ asset: IndustryStandardAssetLibraryItem; similarity: number }> {
  return existingAssets
    .filter(asset => asset.category === category)
    .map(asset => ({
      asset,
      similarity: calculateSimilarity(assetName, asset.asset_name)
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}
