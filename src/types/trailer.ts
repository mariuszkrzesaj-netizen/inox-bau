export type TrailerSizeId = 'compact_30' | 'standard_40' | 'maxi_50' | 'gigant_60' | 'custom';

export interface TrailerDimensions {
  length: number; // in cm (e.g. 400 = 4.0m)
  width: number;  // in cm (e.g. 220 = 2.2m)
  height: number; // in cm (e.g. 230 = 2.3m)
  curbWeightKg: number; // masa własna samej pustej przyczepy
  dmcKg: number; // Dopuszczalna Masa Całkowita (np. 1500, 2000, 2700 kg)
  axles: 1 | 2;
  hatchWidth: number; // szerokość klapy w cm
  hatchHeight: number; // wysokość okna w cm
}

export type EquipmentCategory = 
  | 'thermal'      // Termiczna (grille, frytury, piece)
  | 'cooling'      // Chłodnictwo (stoły, szafy, zamrażarki)
  | 'sanitary'     // Sanitarna & Sanepid (zlewy, umywalki, pompy)
  | 'ventilation'  // Wentylacja (okapy, wentylatory)
  | 'furniture'    // Meble ze stali nierdzewnej inox
  | 'special';     // Ekspresy, gofrownice, dyspensery

export interface EquipmentModel {
  id: string;
  name: string;
  modelCode: string;
  category: EquipmentCategory;
  categoryLabel: string;
  dimensions: {
    width: number;  // cm (szerokość frontu)
    depth: number;  // cm (głębokość)
    height: number; // cm (wysokość)
  };
  powerKw: number;
  voltage: 230 | 400;
  weightKg: number;
  pricePln: number;
  waterRequired: boolean;
  drainRequired: boolean;
  requiresHood: boolean;
  isHandwashOnly?: boolean;
  description: string;
  tags: string[];
  threeType: string;
  color?: string;
  isSanepidRequired?: boolean;
}

export interface PlacedEquipment {
  instanceId: string;
  modelId: string;
  x: number; // cm from center
  z: number; // cm from center
  y: number; // cm elevation (0 for floor items, ~150-180 for hoods/shelves)
  rotation: number; // 0, 90, 180, 270 degrees
  wallSnap?: 'back' | 'front' | 'left' | 'right' | 'free';
}

export interface TrailerConfig {
  presetId: TrailerSizeId;
  dimensions: TrailerDimensions;
  wallColor: string;
  roofColor: string;
  chassisColor: string;
  floorType: 'checker_plate_alu' | 'antislip_pvc' | 'epoxy_resin';
  stainlessFinish: 'brushed_inox' | 'scotch_brite' | 'mirror_polish';
  hatchOpen: boolean;
  hatchAngle: number; // 0 to 80 deg
  customerShelfOut: boolean;
  cutawayMode: 'full' | 'roof_off' | 'transparent_walls' | 'exploded';
  lightsOn: boolean;
  neonText: string;
  neonColor: string;
  electricalConnection: '230V_16A' | '400V_16A' | '400V_32A' | '400V_63A';
  waterSystem: 'tanks_pump_30l' | 'tanks_pump_60l' | 'mains_connection';
  placedItems: PlacedEquipment[];
}

export interface ComplianceIssue {
  id: string;
  level: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  category: 'sanepid' | 'electrical' | 'weight' | 'ventilation' | 'ergonomics';
  recommendation?: string;
}

export interface CostSummary {
  trailerBasePrice: number;
  furniturePrice: number;
  equipmentPrice: number;
  installationsPrice: number;
  totalNettoPln: number;
  vatPln: number;
  totalBruttoPln: number;
  totalWeightKg: number;
  remainingPayloadKg: number;
  totalPowerKw: number;
}
