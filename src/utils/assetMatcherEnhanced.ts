import type { IndustryStandardAssetLibraryItem } from '../types/fm';
import { supabase } from '../lib/supabase';

const DEBUG = false;

export interface UploadedAsset {
  assetType: string;
  brand: string;
  model: string;
  quantity: number;
  rowIndex: number;
}

export interface ScoreBreakdown {
  nameScore: number;
  categoryScore: number;
  brandScore: number;
  modelScore: number;
  standardCodeScore: number;
  learningBoost: number;
}

export interface AssetMatch {
  uploadedAsset: UploadedAsset;
  suggestedMatch: IndustryStandardAssetLibraryItem | null;
  alternativeMatches: IndustryStandardAssetLibraryItem[];
  confidence: number;
  matchExplanation?: MatchExplanation;
  scoreBreakdown?: ScoreBreakdown;
}

export interface MatchExplanation {
  standardCodeMatch: boolean;
  nameScore: number;
  categoryScore: number;
  brandScore: number;
  modelScore: number;
  learningBoost: number;
  matchReason: string;
}

interface CacheEntry {
  results: AssetMatch[];
  timestamp: number;
}

interface LearningCorrection {
  uploadedText: string;
  normalizedText: string;
  correctedAssetId: string;
  frequency: number;
  lastUsed: Date;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const matchCache = new Map<string, CacheEntry>();
const learningData = new Map<string, LearningCorrection>();

// Performance optimization: Only log in development mode
const isDevelopment = import.meta.env.DEV;
const ENABLE_VERBOSE_LOGGING = false; // Set to true for detailed debugging

function log(message: string, ...args: any[]) {
  if (isDevelopment && ENABLE_VERBOSE_LOGGING) {
    if (DEBUG) console.log(message, ...args);
  }
}

function logImportant(message: string, ...args: any[]) {
  if (isDevelopment) {
    if (DEBUG) console.log(message, ...args);
  }
}

// TYPO & ALIAS CORRECTIONS
const TYPO_CORRECTIONS: Record<string, string> = {
  'PACKEGE': 'PACKAGE',
  'PAKAGE': 'PACKAGE',
  'FESH': 'FRESH',
  'FREASH': 'FRESH',
  'DUCTABLE': 'DUCTED',
  'DUCTIBLE': 'DUCTED',
  'MAUNTAIN': 'MOUNTED',
  'MAUNTED': 'MOUNTED',
  'MOUNTIAN': 'MOUNTED',
  'SPLITE': 'SPLIT',
  'SIPLT': 'SPLIT',
  'ACEESS': 'ACCESS',
  'ACCES': 'ACCESS',
  'ESCLATOR': 'ESCALATOR',
  'DOZING': 'DOSING',
  'COOLLING': 'COOLING',
  'SUPPY': 'SUPPLY',
  'RECIVER': 'RECEIVER',
  'COMPRESSER': 'COMPRESSOR',
  'EXHAST': 'EXHAUST',
  'EXHUST': 'EXHAUST'
};

// CATEGORY INCOMPATIBILITY MAP - prevent obviously wrong matches
const CATEGORY_INCOMPATIBLE: Record<string, string[]> = {
  'HVAC': ['Fire Safety', 'Security'],
  'Electrical': ['HVAC', 'Plumbing'],
  'Plumbing': ['Electrical', 'Fire Safety', 'Security'],
  'Fire Safety': ['HVAC', 'Electrical', 'Plumbing'],
  'Security': ['HVAC', 'Fire Safety', 'Plumbing'],
  'Vertical Transport': ['HVAC', 'Electrical', 'Plumbing', 'Fire Safety', 'Security'],
  'Doors': ['Electrical', 'Plumbing', 'Fire Safety']
};

// CATEGORY ALIASES
const CATEGORY_ALIASES: Record<string, string[]> = {
  'HVAC': ['Air Conditioning', 'AC', 'Heating Ventilation', 'Climate Control', 'HVAC & Ventilation'],
  'Electrical': ['Electrical & Power', 'Power', 'Electrical Systems', 'Power Distribution'],
  'Plumbing': ['Plumbing & Water', 'Water', 'Drainage', 'Water Systems', 'Sanitary'],
  'Fire Safety': ['Fire', 'Fire Protection', 'Fire Fighting', 'Fire Alarm', 'Fire Suppression'],
  'Security': ['Security / ELV / ICT', 'ELV', 'ICT', 'Access Control', 'CCTV', 'Security Systems'],
  'Vertical Transport': ['Vertical Transport & Facade', 'Lifts', 'Elevators', 'Escalators', 'Facade'],
  'Doors': ['Doors & Gates / Facade', 'Gates', 'Facade', 'Automatic Doors'],
  'Utilities': ['Utilities & Gas', 'Gas', 'Compressed Air', 'Utility Systems'],
  'Special': ['Special Systems', 'Specialty', 'Miscellaneous Systems']
};

// ADAPTIVE SCORING WEIGHTS
// Name is the primary factor (75%), remaining 25% split among other factors
const SCORING_WEIGHTS = {
  assetName: 0.75,       // 75% - PRIMARY matching factor
  category: 0.10,        // 10% - Secondary validation
  brand: 0.05,           // 5%  - Bonus if available
  model: 0.03,           // 3%  - Bonus if available
  standardCode: 0.15,    // 15% - Bonus if matches
  learning: 0.20,        // 20% - Boost from history (can push score over 100%) - increased to ensure learned matches auto-select

  // Thresholds
  minConfidence: 0.30,     // Filter out below 30%
  autoSelectThreshold: 0.65, // Auto-select at 65%
  highConfidence: 0.75,
  mediumConfidence: 0.50,

  // Learning decay
  learningDecayDays: 90
};

// FM_ABBREVIATIONS from shared module
const FM_ABBREVIATIONS: Record<string, string[]> = {
  // HVAC & Ventilation
  'AHU': ['Air Handling Unit', 'Air-Handling Unit', 'Air Handler'],
  'AIR HANDLING UNIT': ['Air Handling Unit', 'AHU', 'Air Handler'],
  'FAHU': ['Fresh Air Handling Unit', 'Fresh Air Unit', 'FA Unit'],
  'FRESH AIR UNIT': ['Fresh Air Handling Unit', 'Fresh Air Unit'],
  'FRESH AIR HANDLING UNIT': ['Fresh Air Handling Unit', 'Air Handling Unit'],
  'FAU': ['Fresh Air Unit', 'Fresh Air Handling Unit'],
  'MAHU': ['Mixed Air Handling Unit', 'Air Handling Unit'],
  'PAU': ['Pre-Air Unit', 'Pre-Conditioning Air Unit'],
  'FCU': ['Fan Coil Unit', 'FC Unit'],
  'FAN COIL UNIT': ['Fan Coil Unit', 'FCU', 'Fan Coil'],
  'VAV': ['Variable Air Volume Box', 'VAV Box', 'Variable Air Volume'],
  'VRF': ['Variable Refrigerant Flow'],
  'VRV': ['Variable Refrigerant Volume', 'Variable Refrigerant Flow'],
  'DX UNIT': ['Direct Expansion Unit', 'DX Air Conditioner'],
  'SPLIT AC': ['Split AC Unit', 'Hi-Wall Split AC', 'Wall Mounted Split AC'],
  'WALL MOUNTED': ['Wall Mounted Split AC', 'Wall Mounted Split Unit', 'Wall Mounted AC Unit', 'Split AC Unit'],
  'DUCTED SPLIT': ['Ducted Split Unit', 'Ducted Split AC', 'DX Split'],
  'PACKAGE UNIT': ['Packaged Air Conditioner', 'Rooftop Package Unit', 'RTU', 'Package Unit'],
  'PACKAGE': ['Packaged Air Conditioner', 'Package Unit'],
  'PK UNIT': ['Package Unit', 'Packaged Air Conditioner'],
  'RTU': ['Rooftop Unit', 'Rooftop Package Unit', 'Package Unit'],
  'CHILLER': ['Chiller', 'Air Cooled Chiller', 'Water Cooled Chiller'],
  'AIR COOLED CHILLER': ['Air Cooled Chiller', 'Chiller'],
  'WATER COOLED CHILLER': ['Water Cooled Chiller', 'Chiller'],
  'CT': ['Cooling Tower'],
  'COOLING TOWER': ['Cooling Tower'],
  'EXHAUST FAN': ['Exhaust Fan', 'Toilet Exhaust Fan', 'Kitchen Exhaust Fan', 'Extract Fan', 'Ex Fan'],
  'EXTRACT FAN': ['Extract Fan', 'Exhaust Fan', 'Ducted Extract Fan'],
  'CHW PUMP': ['Chilled Water Pump'],
  'CHILLED WATER PUMP': ['Chilled Water Pump', 'CHW Pump'],
  'CHEMICAL DOZING': ['Chemical Dosing System', 'Chemical Dozing Unit', 'Dosing System'],
  'CHEMICAL DOZING UNIT': ['Chemical Dozing Unit', 'Chemical Dosing System'],

  // Electrical & Power
  'UPS': ['Uninterruptible Power Supply', 'UPS System'],
  'GENERATOR': ['Diesel Generator', 'Emergency Generator', 'Genset', 'Gen-set', 'DG Set'],
  'DG': ['Diesel Generator', 'DG Set'],
  'MDB': ['Main Distribution Board', 'Main Switchboard', 'MSB', 'LV Panel'],
  'DB': ['Distribution Board', 'Panel Board', 'Panelboard'],
  'TRANSFORMER': ['Transformer', 'Power Transformer'],
  'LIGHTING': ['Lighting Fixture', 'Luminaires', 'Light Fittings'],

  // Plumbing & Water
  'PUMP': ['Water Pump', 'Pump'],
  'PUMPS': ['Pump', 'Water Pump'],
  'BOOSTER PUMP': ['Water Booster Pump', 'Booster Set', 'Hydropneumatic Pump'],
  'TRANSFER PUMP': ['Transfer Pump', 'Water Transfer Pump'],
  'WATER TANK': ['Water Storage Tank'],
  'WATER PUMP': ['Water Pump'],

  // Fire Safety
  'FAS': ['Fire Alarm System'],
  'FACP': ['Fire Alarm Control Panel', 'Fire Alarm Panel'],
  'SPRINKLER': ['Sprinkler System', 'Automatic Sprinkler'],
  'FIRE PUMP': ['Fire Pump', 'Main Fire Pump'],

  // Security / ELV
  'CCTV': ['CCTV Camera'],
  'CAMERA': ['CCTV Camera'],
  'ACS': ['Access Control System', 'Access Control Panel'],
  'ACCESS CONTROL': ['Access Control Panel', 'Access Control System'],
  'BMS': ['Building Management System', 'BAS', 'Building Automation System'],

  // Vertical Transport
  'LIFT': ['Lift', 'Elevator'],
  'ELEVATOR': ['Lift', 'Elevator'],
  'ESCALATOR': ['Escalator']
};

// PREPROCESSING PIPELINE
function normalizeAssetText(text: string): string {
  if (!text) return '';

  let normalized = text.toUpperCase().trim();

  // Apply typo corrections
  Object.entries(TYPO_CORRECTIONS).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    normalized = normalized.replace(regex, correct);
  });

  // Remove unit suffixes (KW, HP, TR, etc.)
  normalized = normalized.replace(/\b\d+(\.\d+)?\s*(KW|HP|TR|TON|TONS|CFM|LPM|GPM|KVA|W|BTU)\b/gi, '');

  // Remove instance numbers and codes (/-01, /-02, /04, -Unit1, etc.)
  normalized = normalized.replace(/[-/]\s*\d+[A-Z]*/g, '');
  normalized = normalized.replace(/[-/]\s*UNIT\s*\d*/gi, '');

  // Remove model codes (alphanumeric with hyphens/slashes but preserve main asset names)
  normalized = normalized.replace(/\b[A-Z]{2,}\d+[-/]?\d*[A-Z]*\b/g, '');

  // Remove excessive punctuation
  normalized = normalized.replace(/[^\w\s/-]/g, ' ');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

function expandAbbreviations(text: string): string[] {
  const normalized = normalizeAssetText(text);
  const results = [text, normalized];

  log(`[EXPAND] Input: "${text}" -> Normalized: "${normalized}"`);

  for (const [abbr, expansions] of Object.entries(FM_ABBREVIATIONS)) {
    if (normalized === abbr) {
      if (DEBUG) console.log(`[EXPAND] ✓ Exact match: "${abbr}" -> ${expansions.length} expansions`);
      results.push(...expansions);
    } else if (normalized.includes(abbr) && abbr.length > 2) {
      if (DEBUG) console.log(`[EXPAND] ✓ Contains: "${abbr}" -> ${expansions.length} expansions`);
      results.push(...expansions);
    }
  }

  const unique = [...new Set(results)];
  if (DEBUG) console.log(`[EXPAND] Final: ${unique.length} unique terms`);
  return unique;
}

// TOKEN-SET SIMILARITY (order-insensitive, noise-tolerant)
function tokenSetSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const tokens1 = new Set(str1.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  const tokens2 = new Set(str2.toLowerCase().split(/\s+/).filter(t => t.length > 2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);

  const jaccardScore = intersection.size / union.size;

  // Boost if all tokens from smaller set are in larger set
  const smallerSize = Math.min(tokens1.size, tokens2.size);
  const containmentScore = intersection.size / smallerSize;

  return Math.max(jaccardScore, containmentScore * 0.9);
}

// TRIGRAM SIMILARITY
function trigramSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const trigrams1 = new Set<string>();
  const trigrams2 = new Set<string>();

  for (let i = 0; i <= s1.length - 3; i++) {
    trigrams1.add(s1.substring(i, i + 3));
  }

  for (let i = 0; i <= s2.length - 3; i++) {
    trigrams2.add(s2.substring(i, i + 3));
  }

  if (trigrams1.size === 0 || trigrams2.size === 0) return 0;

  const intersection = new Set([...trigrams1].filter(t => trigrams2.has(t)));
  return (2 * intersection.size) / (trigrams1.size + trigrams2.size);
}

// LEVENSHTEIN SIMILARITY
function levenshteinSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(j - 1) !== shorter.charAt(i - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }

  const distance = costs[longer.length];
  return (longer.length - distance) / longer.length;
}

// BLENDED SIMILARITY CALCULATION
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // Single word containment
  const words1 = s1.split(/\s+/).filter(w => w.length > 0);
  const words2 = s2.split(/\s+/).filter(w => w.length > 0);

  if (words1.length === 1 && words2.includes(words1[0])) return 0.92;
  if (words2.length === 1 && words1.includes(words2[0])) return 0.92;

  // Substring containment
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return Math.max(0.75, shorter / longer * 0.95);
  }

  // Blended scoring
  const tokenScore = tokenSetSimilarity(str1, str2);
  const trigramScore = trigramSimilarity(str1, str2);
  const levScore = levenshteinSimilarity(s1, s2);

  // Weighted average favoring token-based matching
  return tokenScore * 0.5 + trigramScore * 0.3 + levScore * 0.2;
}

// CATEGORY SIMILARITY
function normalizeCategoryName(category: string): string {
  const catLower = category.toLowerCase().trim();

  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (canonical.toLowerCase() === catLower) return canonical;
    if (aliases.some(alias => alias.toLowerCase() === catLower)) return canonical;
  }

  return category;
}

function getCategorySimilarity(cat1: string, cat2: string): number {
  const norm1 = normalizeCategoryName(cat1);
  const norm2 = normalizeCategoryName(cat2);

  if (norm1 === norm2) return 1.0;

  return calculateSimilarity(cat1, cat2);
}

// CATEGORY SANITY CHECK
function isCategorySane(uploadedText: string, assetCategory: string): boolean {
  const normalized = normalizeAssetText(uploadedText);
  const assetCat = normalizeCategoryName(assetCategory);

  // Check incompatibility
  const incompatible = CATEGORY_INCOMPATIBLE[assetCat] || [];

  for (const incompCat of incompatible) {
    const incompLower = incompCat.toLowerCase();
    if (normalized.toLowerCase().includes(incompLower)) {
      return false;
    }
  }

  return true;
}

// STANDARD CODE MATCHING
function checkStandardCodeMatch(uploadedText: string, standardAsset: IndustryStandardAssetLibraryItem): boolean {
  const upperText = uploadedText.toUpperCase().trim();
  const standardCode = standardAsset.standard_code?.toUpperCase().trim();

  if (!standardCode) return false;

  if (upperText === standardCode) return true;
  if (upperText.includes(standardCode)) return true;
  if (standardCode.includes(upperText) && upperText.length >= 4) return true;

  const codeParts = standardCode.split('-');
  return codeParts.some(part => part === upperText);
}

// CANDIDATE PRE-FILTER
function getCandidateAssets(
  uploadedAsset: UploadedAsset,
  allAssets: IndustryStandardAssetLibraryItem[]
): IndustryStandardAssetLibraryItem[] {
  const normalized = normalizeAssetText(uploadedAsset.assetType);
  const tokens = new Set(normalized.toLowerCase().split(/\s+/).filter(t => t.length > 2));

  const expansions = expandAbbreviations(uploadedAsset.assetType);
  expansions.forEach(exp => {
    exp.toLowerCase().split(/\s+/).filter(t => t.length > 2).forEach(t => tokens.add(t));
  });

  if (tokens.size === 0) {
    if (DEBUG) console.log('[FILTER] No tokens extracted, returning all assets');
    return allAssets;
  }

  if (DEBUG) console.log('[FILTER] Search tokens:', Array.from(tokens));

  const candidates = allAssets.filter(asset => {
    const assetTokens = asset.asset_name.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const descTokens = (asset.description || '').toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const allTokens = [...assetTokens, ...descTokens];

    // Include if any token matches
    const hasMatch = allTokens.some(t => tokens.has(t));

    // Also include if there's partial overlap in tokens
    const tokenOverlap = assetTokens.some(at =>
      Array.from(tokens).some(st => at.includes(st) || st.includes(at))
    );

    return hasMatch || tokenOverlap;
  });

  // If filter is too aggressive (removes > 95% of assets), return all
  if (candidates.length < allAssets.length * 0.05) {
    if (DEBUG) console.log('[FILTER] Pre-filter too aggressive, returning all assets');
    return allAssets;
  }

  return candidates;
}

// LEARNING SYSTEM
async function loadLearningData(organizationId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('asset_matching_corrections')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('frequency', 1)
      .order('frequency', { ascending: false })
      .limit(200);

    if (error) throw error;

    if (data) {
      learningData.clear();
      if (DEBUG) console.log(`[LEARNING] Loading ${data.length} learned corrections with frequency >= 1`);
      data.forEach(row => {
        const normalizedText = row.normalized_text || normalizeAssetText(row.uploaded_text);
        const key = normalizedText.toLowerCase().trim();

        // Only set if this key doesn't exist yet (keep highest frequency since data is ordered by frequency DESC)
        if (!learningData.has(key)) {
          learningData.set(key, {
            uploadedText: row.uploaded_text,
            normalizedText: normalizedText,
            correctedAssetId: row.corrected_asset_id,
            frequency: row.frequency,
            lastUsed: new Date(row.last_used)
          });
          if (DEBUG) console.log(`[LEARNING] Loaded: "${row.uploaded_text}" (normalized: "${normalizedText}") -> ${row.corrected_asset_id.substring(0, 8)}... (freq: ${row.frequency})`);
        } else {
          if (DEBUG) console.log(`[LEARNING] Skipped duplicate: "${row.uploaded_text}" (normalized: "${normalizedText}") -> ${row.corrected_asset_id.substring(0, 8)}... (freq: ${row.frequency}) - keeping higher frequency entry`);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load learning data:', error);
  }
}

function getLearningBoost(uploadedText: string, assetId: string): number {
  const normalized = normalizeAssetText(uploadedText);
  const key = normalized.toLowerCase().trim();

  if (DEBUG) console.log(`[LEARNING] Checking boost for "${uploadedText}" (normalized: "${normalized}") -> ${assetId.substring(0, 8)}...`);
  if (DEBUG) console.log(`[LEARNING] Learning data size: ${learningData.size} entries`);

  // Try exact match first (normalized and original)
  let correction = learningData.get(key) || learningData.get(uploadedText.toLowerCase().trim());

  if (correction) {
    if (DEBUG) console.log(`[LEARNING] ✓ Exact match found: "${correction.uploadedText}" -> ${correction.correctedAssetId.substring(0, 8)}...`);
  }

  // If no exact match, try fuzzy matching on learned corrections
  if (!correction) {
    if (DEBUG) console.log(`[LEARNING] No exact match, trying fuzzy matching...`);
    const uploadedTokens = new Set(key.split(/\s+/).filter(t => t.length > 2));
    if (DEBUG) console.log(`[LEARNING] Uploaded tokens:`, Array.from(uploadedTokens));

    for (const [learnedKey, learnedData] of learningData.entries()) {
      if (learnedData.correctedAssetId !== assetId) continue;

      const learnedTokens = new Set(learnedKey.split(/\s+/).filter(t => t.length > 2));

      // Check if uploaded text tokens are subset of learned tokens or vice versa
      const uploadedInLearned = [...uploadedTokens].every(t => learnedTokens.has(t));
      const learnedInUploaded = [...learnedTokens].every(t => uploadedTokens.has(t));

      if (uploadedInLearned || learnedInUploaded) {
        correction = learnedData;
        if (DEBUG) console.log(`[LEARNING] ✓ Fuzzy match: "${uploadedText}" matches learned "${learnedData.uploadedText}"`);
        break;
      }
    }
  }

  if (!correction) {
    if (DEBUG) console.log(`[LEARNING] ✗ No matching correction found for this asset`);
    return 0;
  }

  if (correction.correctedAssetId !== assetId) {
    if (DEBUG) console.log(`[LEARNING] ✗ Correction found but for different asset: ${correction.correctedAssetId.substring(0, 8)}...`);
    return 0;
  }

  if (DEBUG) console.log(`[LEARNING] ✓ Applying boost for "${uploadedText}" -> ${assetId.substring(0, 8)}... (freq: ${correction.frequency})`);

  const daysSinceLastUse = (Date.now() - correction.lastUsed.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastUse > SCORING_WEIGHTS.learningDecayDays) {
    if (DEBUG) console.log(`[LEARNING] ✗ Learning data too old (${daysSinceLastUse.toFixed(1)} days)`);
    return 0;
  }

  // When user clicks "Learn", they're 100% sure of the match
  // Return a boost large enough to guarantee 100% confidence
  // Since base scores can be as low as 30%, we need up to 70% boost
  const recencyBoost = 1 - (daysSinceLastUse / SCORING_WEIGHTS.learningDecayDays);
  const finalBoost = 0.70 * recencyBoost; // 70% boost ensures learned matches reach 100%

  if (DEBUG) console.log(`[LEARNING] Boost calculation: recency=${recencyBoost.toFixed(2)}, boost=70%, final=${finalBoost.toFixed(3)} (will reach 100% confidence)`);

  return finalBoost;
}

export async function recordCorrection(
  organizationId: string,
  uploadedText: string,
  correctedAssetId: string
): Promise<void> {
  try {
    const normalizedText = normalizeAssetText(uploadedText);
    if (DEBUG) console.log(`[LEARNING] Recording: "${uploadedText}" (normalized: "${normalizedText}") -> ${correctedAssetId.substring(0, 8)}...`);

    const { error } = await supabase.rpc('record_asset_correction', {
      p_organization_id: organizationId,
      p_uploaded_text: uploadedText,
      p_corrected_asset_id: correctedAssetId
    });

    if (error) throw error;

    // Update normalized_text field
    await supabase
      .from('asset_matching_corrections')
      .update({ normalized_text: normalizedText })
      .eq('organization_id', organizationId)
      .eq('uploaded_text', uploadedText)
      .eq('corrected_asset_id', correctedAssetId);

    // Immediately update the in-memory learning data
    const key = normalizedText.toLowerCase().trim();
    const existing = learningData.get(key);
    const newFreq = existing ? existing.frequency + 1 : 1;
    learningData.set(key, {
      uploadedText,
      normalizedText,
      correctedAssetId,
      frequency: newFreq,
      lastUsed: new Date()
    });
    if (DEBUG) console.log(`[LEARNING] ✓ Recorded and updated in-memory! Frequency: ${newFreq}`);
    if (DEBUG) console.log(`[LEARNING] In-memory cache now has ${learningData.size} entries`);
  } catch (error) {
    console.error('Failed to record correction:', error);
  }
}

// Force reload learning data from database
export async function reloadLearningData(organizationId: string): Promise<void> {
  await loadLearningData(organizationId);
}

// CACHING
function getCacheKey(uploadedAssets: UploadedAsset[], organizationId?: string): string {
  const assetsKey = uploadedAssets.map(a => `${a.assetType}|${a.brand}|${a.model}`).join('::');
  return organizationId ? `${organizationId}::${assetsKey}` : assetsKey;
}

function getCachedResults(cacheKey: string): AssetMatch[] | null {
  const entry = matchCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    matchCache.delete(cacheKey);
    return null;
  }
  return entry.results;
}

function setCacheResults(cacheKey: string, results: AssetMatch[]): void {
  matchCache.set(cacheKey, { results, timestamp: Date.now() });
  if (matchCache.size > 50) {
    const oldestKey = Array.from(matchCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    matchCache.delete(oldestKey);
  }
}

export function clearMatchCache(): void {
  matchCache.clear();
}

// Check if there's a learned match for this asset
function getLearnedAssetId(uploadedText: string): string | null {
  const normalized = normalizeAssetText(uploadedText);
  const key = normalized.toLowerCase().trim();

  // Try exact match first
  let correction = learningData.get(key) || learningData.get(uploadedText.toLowerCase().trim());

  if (correction) {
    // Check if learning data is still fresh (within decay period)
    const daysSinceLastUse = (Date.now() - correction.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse > SCORING_WEIGHTS.learningDecayDays) {
      if (DEBUG) console.log(`[LEARNING] ✗ Learning data too old (${daysSinceLastUse.toFixed(1)} days), ignoring`);
      return null;
    }

    if (DEBUG) console.log(`[LEARNING] ✓ Found learned match: "${uploadedText}" -> ${correction.correctedAssetId.substring(0, 8)}...`);
    return correction.correctedAssetId;
  }

  // Try fuzzy matching
  const uploadedTokens = new Set(key.split(/\s+/).filter(t => t.length > 2));

  for (const [learnedKey, learnedData] of learningData.entries()) {
    // Check recency
    const daysSinceLastUse = (Date.now() - learnedData.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse > SCORING_WEIGHTS.learningDecayDays) {
      continue;
    }

    const learnedTokens = new Set(learnedKey.split(/\s+/).filter(t => t.length > 2));

    const uploadedInLearned = [...uploadedTokens].every(t => learnedTokens.has(t));
    const learnedInUploaded = [...learnedTokens].every(t => uploadedTokens.has(t));

    if (uploadedInLearned || learnedInUploaded) {
      if (DEBUG) console.log(`[LEARNING] ✓ Found fuzzy learned match: "${uploadedText}" -> ${learnedData.correctedAssetId.substring(0, 8)}...`);
      return learnedData.correctedAssetId;
    }
  }

  return null;
}

// MAIN MATCHING FUNCTION
export async function matchAsset(
  uploadedAsset: UploadedAsset,
  industryStandardAssets: IndustryStandardAssetLibraryItem[],
  organizationId?: string
): Promise<AssetMatch> {
  if (DEBUG) console.log(`\n[MATCHING] "${uploadedAsset.assetType}"`);

  // Check if there's a learned match - if so, use it directly with 100% confidence
  if (organizationId) {
    if (DEBUG) console.log(`[LEARNING] Checking for learned match, learning data has ${learningData.size} entries`);
    const learnedAssetId = getLearnedAssetId(uploadedAsset.assetType);
    if (learnedAssetId) {
      const learnedAsset = industryStandardAssets.find(a => a.id === learnedAssetId);
      if (learnedAsset) {
        if (DEBUG) console.log(`[LEARNING] ✓✓✓ Using learned match with 100% confidence: ${learnedAsset.asset_name}`);

        // Still calculate alternatives for user reference
        const expandedSearchTerms = expandAbbreviations(uploadedAsset.assetType);
        const candidates = getCandidateAssets(uploadedAsset, industryStandardAssets);

        const alternatives = candidates
          .filter(a => a.id !== learnedAssetId)
          .map(standardAsset => {
            let maxNameScore = 0;
            expandedSearchTerms.forEach(searchTerm => {
              const nameScore = calculateSimilarity(searchTerm, standardAsset.asset_name);
              maxNameScore = Math.max(maxNameScore, nameScore);
            });
            return { asset: standardAsset, score: maxNameScore };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 14)
          .map(m => m.asset);

        return {
          uploadedAsset,
          suggestedMatch: learnedAsset,
          alternativeMatches: alternatives,
          confidence: 100,
          matchExplanation: {
            standardCodeMatch: false,
            nameScore: 1.0,
            categoryScore: 1.0,
            brandScore: 0,
            modelScore: 0,
            learningBoost: 1.0,
            matchReason: 'Previously learned (100% confidence)'
          },
          scoreBreakdown: {
            nameScore: 0,
            categoryScore: 0,
            brandScore: 0,
            modelScore: 0,
            standardCodeScore: 0,
            learningBoost: 1.0
          }
        };
      }
    }
  }

  const expandedSearchTerms = expandAbbreviations(uploadedAsset.assetType);
  const candidates = getCandidateAssets(uploadedAsset, industryStandardAssets);

  if (DEBUG) console.log(`[FILTER] Reduced from ${industryStandardAssets.length} to ${candidates.length} candidates`);

  const matches = candidates.map(standardAsset => {
    // Category sanity check
    if (!isCategorySane(uploadedAsset.assetType, standardAsset.category)) {
      return { asset: standardAsset, score: 0, scoreBreakdown: null };
    }

    const hasStandardCodeMatch = checkStandardCodeMatch(uploadedAsset.assetType, standardAsset);

    let maxNameScore = 0;
    let maxCategoryScore = 0;

    expandedSearchTerms.forEach(searchTerm => {
      const nameScore = calculateSimilarity(searchTerm, standardAsset.asset_name);
      maxNameScore = Math.max(maxNameScore, nameScore);

      const catScore = getCategorySimilarity(searchTerm, standardAsset.category);
      maxCategoryScore = Math.max(maxCategoryScore, catScore);
    });

    let brandScore = 0;
    if (uploadedAsset.brand && uploadedAsset.brand.toUpperCase() !== 'NA' && uploadedAsset.brand.toUpperCase() !== 'N/A') {
      brandScore = Math.max(
        calculateSimilarity(uploadedAsset.brand, standardAsset.asset_name),
        calculateSimilarity(uploadedAsset.brand, standardAsset.description || '')
      );
    }

    let modelScore = 0;
    if (uploadedAsset.model && uploadedAsset.model.toUpperCase() !== 'NA' && uploadedAsset.model.toUpperCase() !== 'N/A') {
      modelScore = Math.max(
        calculateSimilarity(uploadedAsset.model, standardAsset.asset_name),
        calculateSimilarity(uploadedAsset.model, standardAsset.description || '')
      );
    }

    const standardCodeScore = hasStandardCodeMatch ? 1.0 : 0;
    const learningBoost = organizationId ? getLearningBoost(uploadedAsset.assetType, standardAsset.id) : 0;

    // Calculate weighted total (learning boost can push over 1.0)
    const totalScore =
      maxNameScore * SCORING_WEIGHTS.assetName +
      maxCategoryScore * SCORING_WEIGHTS.category +
      brandScore * SCORING_WEIGHTS.brand +
      modelScore * SCORING_WEIGHTS.model +
      standardCodeScore * SCORING_WEIGHTS.standardCode +
      learningBoost;

    const scoreBreakdown: ScoreBreakdown = {
      nameScore: maxNameScore,
      categoryScore: maxCategoryScore,
      brandScore,
      modelScore,
      standardCodeScore,
      learningBoost
    };

    let matchReason = 'Fuzzy match';
    if (standardCodeScore > 0) matchReason = 'Standard code match';
    else if (learningBoost > 0.03) matchReason = 'Previously learned';
    else if (maxNameScore > 0.85) matchReason = 'High name similarity';
    else if (maxCategoryScore > 0.85) matchReason = 'Category + name match';

    return {
      asset: standardAsset,
      score: totalScore,
      scoreBreakdown,
      explanation: {
        standardCodeMatch: hasStandardCodeMatch,
        nameScore: maxNameScore,
        categoryScore: maxCategoryScore,
        brandScore,
        modelScore,
        learningBoost,
        matchReason
      }
    };
  });

  matches.sort((a, b) => b.score - a.score);

  // Filter out matches below 30% confidence
  const relevantMatches = matches.filter(m => m.score >= SCORING_WEIGHTS.minConfidence);

  if (DEBUG) console.log(`[RESULT] Top 3 for "${uploadedAsset.assetType}":`,
    matches.slice(0, 3).map(m => ({
      name: m.asset.asset_name,
      score: (m.score * 100).toFixed(1) + '%',
      breakdown: m.scoreBreakdown
    }))
  );

  const result: AssetMatch = {
    uploadedAsset,
    suggestedMatch: relevantMatches.length > 0 ? relevantMatches[0].asset : null,
    alternativeMatches: relevantMatches.slice(1, 15).map(m => m.asset),
    confidence: relevantMatches.length > 0 ? Math.round(relevantMatches[0].score * 100) : 0,
    matchExplanation: relevantMatches.length > 0 ? relevantMatches[0].explanation : undefined,
    scoreBreakdown: relevantMatches.length > 0 ? relevantMatches[0].scoreBreakdown : undefined
  };

  if (DEBUG) console.log(`[FINAL] Best: ${result.suggestedMatch?.asset_name || 'NONE'} (${result.confidence}%)\n`);

  return result;
}

export async function matchAssets(
  uploadedAssets: UploadedAsset[],
  industryStandardAssets: IndustryStandardAssetLibraryItem[],
  organizationId?: string
): Promise<AssetMatch[]> {
  const cacheKey = getCacheKey(uploadedAssets, organizationId);
  const cached = getCachedResults(cacheKey);

  if (cached) {
    if (DEBUG) console.log('[CACHE] Using cached results');
    return cached;
  }

  if (organizationId) {
    await loadLearningData(organizationId);
    if (DEBUG) console.log(`[LEARNING] Loaded learning data for matching, ${learningData.size} corrections available`);
  }

  const results = await Promise.all(
    uploadedAssets.map(asset => matchAsset(asset, industryStandardAssets, organizationId))
  );

  setCacheResults(cacheKey, results);

  return results;
}
