import { PlacedEquipment, TrailerSizeId } from '../types/trailer';

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommendedSize: TrailerSizeId;
  defaultWallColor: string;
  placedItems: PlacedEquipment[];
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'burger_fries',
    name: 'Burger & Belgijskie Frytki Pro',
    description: 'Klasyczny, najbardziej dochodowy układ: płyta chromowana do smash burgerów, frytownica 2x8L, stół sałatkowy z nadstawą GN i okap ze stali nierdzewnej.',
    icon: '🍔',
    recommendedSize: 'standard_40',
    defaultWallColor: '#1e2024', // Matte Black
    placedItems: [
      // Tylna ściana technologiczna (z = -65):
      // Stół roboczy ze stali pod okapem
      { instanceId: 'bf_work_1', modelId: 'worktable_cabinet_160', x: -80, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      // Płyta grillowa na stole
      { instanceId: 'bf_grill_1', modelId: 'grill_plate_dual', x: -110, z: -65, y: 85, rotation: 0, wallSnap: 'back' },
      // Frytownica podwójna na stole
      { instanceId: 'bf_fry_1', modelId: 'double_fryer_electric', x: -40, z: -65, y: 85, rotation: 0, wallSnap: 'back' },
      // Okap nad płytą i frytownicą
      { instanceId: 'bf_hood_1', modelId: 'hood_wall_exhaust_160', x: -75, z: -65, y: 160, rotation: 0, wallSnap: 'back' },
      // Szafa chłodnicza w rogu
      { instanceId: 'bf_fridge_1', modelId: 'upright_refrigerator_500l', x: 60, z: -60, y: 0, rotation: 0, wallSnap: 'back' },
      // Półka wisząca
      { instanceId: 'bf_shelf_1', modelId: 'hanging_shelf_140', x: 60, z: -65, y: 165, rotation: 0, wallSnap: 'back' },
      
      // Lewa ściana - moduł Sanepid (obowiązkowy!)
      { instanceId: 'bf_san_1', modelId: 'sanitary_module_sanepid', x: -145, z: 10, y: 0, rotation: 90, wallSnap: 'left' },

      // Przednia ściana wydawcza (z = 65, pod oknem klienta):
      // Stół chłodniczy z nadstawą sałatkową do składania burgerów
      { instanceId: 'bf_salad_1', modelId: 'refrigerated_saladette_140', x: -30, z: 65, y: 0, rotation: 180, wallSnap: 'front' },
      // Toster do bułek
      { instanceId: 'bf_toast_1', modelId: 'conveyor_bun_toaster', x: 65, z: 65, y: 85, rotation: 180, wallSnap: 'front' },
      // Stanowisko kasowe w oknie
      { instanceId: 'bf_pos_1', modelId: 'cashier_desk_pos', x: 120, z: 65, y: 0, rotation: 180, wallSnap: 'front' },
    ],
  },
  {
    id: 'kebab_street',
    name: 'Kebab & Gyros Master',
    description: 'Duża wydajność cieplna: opiekacz do kebaba 50kg, duża frytura, chłodzenie surówek i wydajny okap ze stali kwasoodpornej.',
    icon: '🌯',
    recommendedSize: 'maxi_50',
    defaultWallColor: '#dc2626', // Food Truck Red
    placedItems: [
      // Tył
      { instanceId: 'kb_kebab_1', modelId: 'kebab_gyro_grill', x: -140, z: -70, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'kb_fry_1', modelId: 'heavy_fryer_free_standing', x: -65, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'kb_bain_1', modelId: 'bain_marie_gn', x: 0, z: -65, y: 85, rotation: 0, wallSnap: 'back' },
      { instanceId: 'kb_table_1', modelId: 'worktable_cabinet_160', x: 20, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'kb_fridge_1', modelId: 'upright_refrigerator_500l', x: 130, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'kb_hood_1', modelId: 'hood_wall_exhaust_200', x: -100, z: -70, y: 160, rotation: 0, wallSnap: 'back' },
      
      // Lewy bok: Sanepid
      { instanceId: 'kb_san_1', modelId: 'sanitary_module_sanepid', x: -195, z: 10, y: 0, rotation: 90, wallSnap: 'left' },
      
      // Przód (wydawka)
      { instanceId: 'kb_salad_1', modelId: 'refrigerated_saladette_140', x: -60, z: 70, y: 0, rotation: 180, wallSnap: 'front' },
      { instanceId: 'kb_drink_1', modelId: 'beverage_glass_showcase', x: 40, z: 70, y: 0, rotation: 180, wallSnap: 'front' },
      { instanceId: 'kb_pos_1', modelId: 'cashier_desk_pos', x: 120, z: 70, y: 0, rotation: 180, wallSnap: 'front' },
    ],
  },
  {
    id: 'coffee_bakery',
    name: 'Kawiarnia Specialty, Lody & Gofry',
    description: 'Mobilna kawiarnia i cukiernia: ciśnieniowy ekspres 2-grupowy, młynek, stacja filtracji Brita, gofrownica obrotowa oraz witryna ze słodkościami.',
    icon: '☕',
    recommendedSize: 'compact_30',
    defaultWallColor: '#86efac', // Vintage Mint
    placedItems: [
      // Tył: ekspres do kawy na blacie
      { instanceId: 'cb_tbl_1', modelId: 'worktable_cabinet_160', x: -20, z: -60, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'cb_esp_1', modelId: 'espresso_machine_2group', x: -30, z: -60, y: 85, rotation: 0, wallSnap: 'back' },
      { instanceId: 'cb_brita_1', modelId: 'water_filtration_system', x: -80, z: -60, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'cb_waffle_1', modelId: 'waffle_maker_cast_iron', x: 30, z: -60, y: 85, rotation: 0, wallSnap: 'back' },
      
      // Sanepid
      { instanceId: 'cb_san_1', modelId: 'sanitary_module_sanepid', x: -100, z: 10, y: 0, rotation: 90, wallSnap: 'left' },

      // Przód: witryna z ciastami i kasa
      { instanceId: 'cb_show_1', modelId: 'beverage_glass_showcase', x: -20, z: 60, y: 0, rotation: 180, wallSnap: 'front' },
      { instanceId: 'cb_pos_1', modelId: 'cashier_desk_pos', x: 60, z: 60, y: 0, rotation: 180, wallSnap: 'front' },
    ],
  },
  {
    id: 'pizza_napoletana',
    name: 'Pizza Mobilna z Piecem Kamiennym',
    description: 'Klimatyczna pizzeria: piec elektryczny kamienny 450°C, stół chłodniczy z pojemnikami na sos i mozzarellę, stacja mycia basenowego.',
    icon: '🍕',
    recommendedSize: 'maxi_50',
    defaultWallColor: '#f59e0b', // Sun Yellow
    placedItems: [
      // Tył
      { instanceId: 'pz_oven_1', modelId: 'stone_pizza_oven', x: -110, z: -65, y: 85, rotation: 0, wallSnap: 'back' },
      { instanceId: 'pz_tbl_1', modelId: 'worktable_cabinet_160', x: -110, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'pz_hood_1', modelId: 'hood_wall_exhaust_160', x: -110, z: -65, y: 160, rotation: 0, wallSnap: 'back' },
      { instanceId: 'pz_fridge_1', modelId: 'upright_refrigerator_500l', x: 30, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      { instanceId: 'pz_basin_1', modelId: 'deep_sink_basin', x: 120, z: -65, y: 0, rotation: 0, wallSnap: 'back' },
      
      // Sanepid
      { instanceId: 'pz_san_1', modelId: 'sanitary_module_sanepid', x: -195, z: 10, y: 0, rotation: 90, wallSnap: 'left' },
      
      // Przód
      { instanceId: 'pz_salad_1', modelId: 'refrigerated_saladette_140', x: -40, z: 70, y: 0, rotation: 180, wallSnap: 'front' },
      { instanceId: 'pz_pos_1', modelId: 'cashier_desk_pos', x: 70, z: 70, y: 0, rotation: 180, wallSnap: 'front' },
    ],
  },
];
