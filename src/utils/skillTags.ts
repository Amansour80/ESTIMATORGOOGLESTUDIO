export interface SkillTagCategory {
  id: string;
  label: string;
  color: string;
  tags: SkillTag[];
}

export interface SkillTag {
  id: string;
  label: string;
  keywords: string[];
}

export const SKILL_TAG_CATEGORIES: SkillTagCategory[] = [
  {
    id: 'hvac-cooling',
    label: 'HVAC & Cooling',
    color: 'bg-blue-100 text-blue-800',
    tags: [
      { id: 'hvac', label: 'HVAC Systems', keywords: ['hvac', 'heating', 'ventilation', 'air conditioning'] },
      { id: 'chiller', label: 'Chillers', keywords: ['chiller', 'chilled water', 'cooling tower', 'condenser'] },
      { id: 'ahu', label: 'Air Handling Units', keywords: ['ahu', 'air handling unit', 'air handler'] },
      { id: 'fcu', label: 'Fan Coil Units', keywords: ['fcu', 'fan coil', 'fan coil unit'] },
      { id: 'ventilation', label: 'Ventilation', keywords: ['ventilation', 'exhaust fan', 'fresh air', 'ventilator'] },
      { id: 'ac', label: 'Air Conditioning', keywords: ['ac', 'air conditioner', 'split unit', 'vrf', 'vrv', 'package unit'] },
    ],
  },
  {
    id: 'electrical',
    label: 'Electrical',
    color: 'bg-yellow-100 text-yellow-800',
    tags: [
      { id: 'electrical', label: 'General Electrical', keywords: ['electrical', 'electric', 'wiring', 'circuit'] },
      { id: 'lighting', label: 'Lighting Systems', keywords: ['lighting', 'light', 'lamp', 'fixture', 'led', 'luminaire'] },
      { id: 'power', label: 'Power Systems', keywords: ['power', 'distribution', 'panel', 'switchgear', 'mdb', 'db'] },
      { id: 'ups', label: 'UPS Systems', keywords: ['ups', 'uninterruptible power', 'battery backup'] },
      { id: 'generator', label: 'Generators', keywords: ['generator', 'genset', 'dg', 'diesel generator'] },
      { id: 'low-voltage', label: 'Low Voltage', keywords: ['low voltage', 'lv', 'control voltage', 'data', 'network'] },
    ],
  },
  {
    id: 'plumbing-sanitary',
    label: 'Plumbing & Sanitary',
    color: 'bg-cyan-100 text-cyan-800',
    tags: [
      { id: 'plumbing', label: 'General Plumbing', keywords: ['plumbing', 'plumber', 'pipe', 'piping', 'valve', 'fitting'] },
      { id: 'sanitary', label: 'Sanitary Fixtures', keywords: ['sanitary', 'toilet', 'wc', 'water closet', 'urinal', 'wash basin', 'sink', 'faucet', 'tap', 'shower', 'bathtub', 'lavatory', 'washroom', 'bathroom'] },
      { id: 'drainage', label: 'Drainage Systems', keywords: ['drainage', 'drain', 'sewer', 'waste', 'wastewater', 'grease trap', 'floor drain'] },
      { id: 'water-supply', label: 'Water Supply', keywords: ['water supply', 'potable water', 'domestic water', 'water line', 'water main'] },
      { id: 'pumps', label: 'Pumps', keywords: ['pump', 'water pump', 'sump pump', 'booster pump', 'fire pump'] },
      { id: 'sewage', label: 'Sewage Systems', keywords: ['sewage', 'sewage pump', 'sewage treatment', 'stp'] },
    ],
  },
  {
    id: 'mechanical',
    label: 'Mechanical',
    color: 'bg-gray-100 text-gray-800',
    tags: [
      { id: 'mechanical', label: 'General Mechanical', keywords: ['mechanical', 'mechanic'] },
      { id: 'elevator', label: 'Elevators', keywords: ['elevator', 'lift', 'passenger lift', 'service lift'] },
      { id: 'escalator', label: 'Escalators', keywords: ['escalator', 'moving walkway', 'travelator'] },
      { id: 'conveyors', label: 'Conveyors', keywords: ['conveyor', 'conveyor belt', 'material handling'] },
      { id: 'motors', label: 'Motors & Drives', keywords: ['motor', 'drive', 'vfd', 'vsd', 'variable frequency'] },
      { id: 'compressor', label: 'Compressors', keywords: ['compressor', 'air compressor', 'compressed air'] },
    ],
  },
  {
    id: 'fire-safety',
    label: 'Fire & Safety',
    color: 'bg-red-100 text-red-800',
    tags: [
      { id: 'fire-alarm', label: 'Fire Alarm Systems', keywords: ['fire alarm', 'smoke detector', 'heat detector', 'fire panel', 'facp'] },
      { id: 'sprinkler', label: 'Sprinkler Systems', keywords: ['sprinkler', 'fire sprinkler', 'wet pipe', 'dry pipe'] },
      { id: 'fire-suppression', label: 'Fire Suppression', keywords: ['fire suppression', 'fm200', 'co2', 'gas suppression', 'fire fighting'] },
      { id: 'fire-extinguisher', label: 'Fire Extinguishers', keywords: ['fire extinguisher', 'extinguisher', 'portable extinguisher'] },
      { id: 'safety-systems', label: 'Safety Systems', keywords: ['safety', 'emergency', 'evacuation', 'emergency lighting', 'exit sign'] },
    ],
  },
  {
    id: 'bms-controls',
    label: 'BMS & Controls',
    color: 'bg-purple-100 text-purple-800',
    tags: [
      { id: 'bms', label: 'Building Management', keywords: ['bms', 'building management', 'building automation'] },
      { id: 'automation', label: 'Automation', keywords: ['automation', 'automated', 'automatic'] },
      { id: 'controls', label: 'Control Systems', keywords: ['control', 'controller', 'control system', 'ddc'] },
      { id: 'scada', label: 'SCADA', keywords: ['scada', 'supervisory control'] },
      { id: 'smart-building', label: 'Smart Building', keywords: ['smart building', 'iot', 'smart', 'intelligent building'] },
    ],
  },
  {
    id: 'access-security',
    label: 'Access & Security',
    color: 'bg-indigo-100 text-indigo-800',
    tags: [
      { id: 'access-control', label: 'Access Control', keywords: ['access control', 'card reader', 'biometric', 'fingerprint', 'face recognition', 'turnstile', 'access'] },
      { id: 'cctv', label: 'CCTV', keywords: ['cctv', 'camera', 'surveillance', 'nvr', 'dvr', 'ip camera'] },
      { id: 'security', label: 'Security Systems', keywords: ['security', 'intrusion', 'alarm system', 'burglar alarm'] },
      { id: 'gates', label: 'Gates & Barriers', keywords: ['gate', 'barrier', 'boom barrier', 'sliding gate', 'rolling shutter', 'shutter door'] },
      { id: 'doors', label: 'Automatic Doors', keywords: ['automatic door', 'sliding door', 'revolving door', 'swing door', 'door operator'] },
      { id: 'locks', label: 'Locks & Hardware', keywords: ['lock', 'door lock', 'magnetic lock', 'electric lock', 'door closer'] },
    ],
  },
  {
    id: 'civil-finishing',
    label: 'Civil & Finishing',
    color: 'bg-orange-100 text-orange-800',
    tags: [
      { id: 'civil', label: 'Civil Works', keywords: ['civil', 'structural', 'masonry', 'concrete', 'construction'] },
      { id: 'painting', label: 'Painting', keywords: ['painting', 'paint', 'coating', 'repainting'] },
      { id: 'flooring', label: 'Flooring', keywords: ['flooring', 'floor', 'tile', 'tiles', 'marble', 'granite', 'vinyl', 'carpet'] },
      { id: 'waterproofing', label: 'Waterproofing', keywords: ['waterproofing', 'waterproof', 'sealing', 'membrane'] },
      { id: 'false-ceiling', label: 'False Ceiling', keywords: ['false ceiling', 'ceiling', 'gypsum', 'suspended ceiling'] },
      { id: 'partitions', label: 'Partitions', keywords: ['partition', 'wall partition', 'gypsum partition', 'glass partition'] },
    ],
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    color: 'bg-amber-100 text-amber-800',
    tags: [
      { id: 'carpentry', label: 'General Carpentry', keywords: ['carpentry', 'carpenter', 'wood', 'wooden'] },
      { id: 'doors-frames', label: 'Doors & Frames', keywords: ['door', 'door frame', 'door leaf', 'door hardware'] },
      { id: 'furniture', label: 'Furniture', keywords: ['furniture', 'cabinet', 'desk', 'table', 'chair', 'shelving'] },
      { id: 'joinery', label: 'Joinery', keywords: ['joinery', 'millwork', 'trim', 'molding'] },
    ],
  },
  {
    id: 'specialized',
    label: 'Specialized Equipment',
    color: 'bg-green-100 text-green-800',
    tags: [
      { id: 'kitchen-equipment', label: 'Kitchen Equipment', keywords: ['kitchen', 'cooking', 'oven', 'stove', 'refrigerator', 'freezer', 'dishwasher', 'range', 'hood'] },
      { id: 'laundry', label: 'Laundry Equipment', keywords: ['laundry', 'washing machine', 'dryer', 'washer', 'extractor'] },
      { id: 'medical-equipment', label: 'Medical Equipment', keywords: ['medical', 'medical gas', 'oxygen', 'vacuum', 'hospital'] },
      { id: 'parking', label: 'Parking Systems', keywords: ['parking', 'car park', 'parking guidance', 'parking gate'] },
      { id: 'landscaping', label: 'Landscaping', keywords: ['landscaping', 'irrigation', 'sprinkler', 'garden', 'lawn'] },
    ],
  },
  {
    id: 'general',
    label: 'General Maintenance',
    color: 'bg-slate-100 text-slate-800',
    tags: [
      { id: 'general-maintenance', label: 'General Maintenance', keywords: ['general', 'general maintenance', 'maintenance'] },
      { id: 'handyman', label: 'Handyman', keywords: ['handyman', 'handy man', 'all-round'] },
      { id: 'multi-skilled', label: 'Multi-Skilled', keywords: ['multi-skilled', 'multi skill', 'versatile', 'all-rounder'] },
    ],
  },
];

export function getAllSkillTags(): SkillTag[] {
  return SKILL_TAG_CATEGORIES.flatMap(category => category.tags);
}

export function getSkillTagById(id: string): SkillTag | undefined {
  return getAllSkillTags().find(tag => tag.id === id);
}

export function getSkillTagColor(tagId: string): string {
  for (const category of SKILL_TAG_CATEGORIES) {
    if (category.tags.some(tag => tag.id === tagId)) {
      return category.color;
    }
  }
  return 'bg-gray-100 text-gray-800';
}

export function detectSkillTagsFromText(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  const matchedTags = new Map<string, number>();

  for (const category of SKILL_TAG_CATEGORIES) {
    for (const tag of category.tags) {
      for (const keyword of tag.keywords) {
        if (normalized.includes(keyword)) {
          const currentScore = matchedTags.get(tag.id) || 0;
          const keywordLength = keyword.length;
          matchedTags.set(tag.id, currentScore + keywordLength);
        }
      }
    }
  }

  const sortedTags = Array.from(matchedTags.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tagId]) => tagId);

  return sortedTags;
}
