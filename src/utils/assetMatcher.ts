// LEGACY ADAPTER - Re-exports from assetMatcherEnhanced
// This file maintained for backward compatibility
// All new code should import from assetMatcherEnhanced directly

export type {
  UploadedAsset,
  AssetMatch,
  MatchExplanation,
  ScoreBreakdown
} from './assetMatcherEnhanced';

export {
  matchAsset,
  matchAssets,
  recordCorrection,
  clearMatchCache
} from './assetMatcherEnhanced';
