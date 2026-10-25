import React, { useState } from 'react';
import { TrailerConfig, EquipmentCategory, TrailerSizeId } from '../types/trailer';
import { EQUIPMENT_CATALOG, COLOR_PALETTE, TRAILER_PRESETS } from '../data/equipmentCatalog';
import { INDUSTRY_TEMPLATES } from '../data/industryTemplates';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Palette,
  Truck,
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Flame,
  Snowflake,
  Layers,
  Sliders,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface BottomDockProps {
  config: TrailerConfig;
  onUpdateConfig: (partial: Partial<TrailerConfig>) => void;
  onAddItem: (modelId: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onOpenOfferModal: () => void;
  complianceIssuesCount: { errors: number; warnings: number; success: number };
  totalPowerKw: number;
  totalWeightKg: number;
  dmcKg: number;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  config,
  onUpdateConfig,
  onAddItem,
  onApplyTemplate,
  onOpenOfferModal,
  complianceIssuesCount,
  totalPowerKw,
  totalWeightKg,
  dmcKg,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'trailer' | 'templates' | 'compliance'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = EQUIPMENT_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-4 pointer-events-none transition-all duration-300">
      {/* Collapse / Expand Tab Button */}
      <div className="flex justify-center mb-1 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-t-xl text-xs font-semibold backdrop-blur shadow-lg transition"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Rozwiń Konfigurator
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Zwiń Panel (Widok Pełnoekranowy)
            </>
          )}
        </button>
      </div>

      {/* Main Glass Dock */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
          {/* Top Dock Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5 bg-slate-950/60">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'catalog'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Dodaj Wyposażenie
              </button>

              <button
                onClick={() => setActiveTab('trailer')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'trailer'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> Nadwozie & Kolor
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'templates'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Gotowe Szablony
              </button>

              <button
                onClick={() => setActiveTab('compliance')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'compliance'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {complianceIssuesCount.errors > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Sanepid & Instalacje
                {complianceIssuesCount.errors > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 ml-0.5" />
                )}
              </button>
            </div>

            {/* Quick Offer CTA */}
            <button
              onClick={onOpenOfferModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition shrink-0 ml-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Kosztorys & Oferta PDF
            </button>
          </div>

          {/* Tab 1: Equipment Catalog */}
          {activeTab === 'catalog' && (
            <div className="p-4 space-y-3">
              {/* Category Pills & Search */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      selectedCategory === 'all'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Wszystkie ({EQUIPMENT_CATALOG.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory('sanitary')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      selectedCategory === 'sanitary'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Sanepid (Wymagane)
                  </button>
                  <button
                    onClick={() => setSelectedCategory('thermal')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      selectedCategory === 'thermal'
                        ? 'bg-red-950 text-red-300 border border-red-500/50 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-red-400" /> Termika & Grille
                  </button>
                  <button
                    onClick={() => setSelectedCategory('cooling')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      selectedCategory === 'cooling'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Snowflake className="w-3 h-3 text-cyan-400" /> Chłodnictwo
                  </button>
                  <button
                    onClick={() => setSelectedCategory('ventilation')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      selectedCategory === 'ventilation'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/50 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3 h-3 text-amber-400" /> Okapy & Wyciągi
                  </button>
                  <button
                    onClick={() => setSelectedCategory('furniture')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      selectedCategory === 'furniture'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Meble Inox
                  </button>
                  <button
                    onClick={() => setSelectedCategory('special')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      selectedCategory === 'special'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Kawa & Desery
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Szukaj urządzenia (np. frytownica, zlew, piec)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 w-56"
                />
              </div>

              {/* Horizontal Scrollable Equipment Cards */}
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-64 bg-slate-950/80 border border-slate-800 hover:border-slate-600 rounded-xl p-3 flex flex-col justify-between group transition hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-slate-200 group-hover:text-amber-400 transition leading-snug">
                          {item.name}
                        </span>
                        {item.isSanepidRequired && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
                            HACCP
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 font-mono mb-2">
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded">
                          {item.dimensions.width}×{item.dimensions.depth} cm
                        </span>
                        {item.powerKw > 0 && (
                          <span className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400">
                            {item.powerKw} kW ({item.voltage}V)
                          </span>
                        )}
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded">
                          {item.weightKg} kg
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="font-extrabold text-xs text-emerald-400">
                        {item.pricePln.toLocaleString('pl-PL')} zł netto
                      </span>
                      <button
                        onClick={() => onAddItem(item.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition active:scale-95"
                      >
                        <Plus className="w-3 h-3" /> Dodaj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Trailer Specs, Colors & Doors */}
          {activeTab === 'trailer' && (
            <div className="p-4 space-y-4">
              {/* Size Presets */}
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                  Długość i Model Podwozia Przyczepy:
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(TRAILER_PRESETS) as TrailerSizeId[])
                    .filter((id) => id !== 'custom')
                    .map((presetId) => {
                      const preset = TRAILER_PRESETS[presetId];
                      const isSelected = config.presetId === presetId;
                      return (
                        <button
                          key={presetId}
                          onClick={() =>
                            onUpdateConfig({
                              presetId,
                              dimensions: preset.dimensions,
                            })
                          }
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-400 text-white'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{preset.name}</span>
                            <span className="text-[10px] text-amber-400 font-bold">
                              {preset.dimensions.axles} {preset.dimensions.axles === 1 ? 'oś' : 'osie'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {preset.subtitle}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-400">
                            <span>DMC: {preset.dimensions.dmcKg} kg</span>
                            <span className="text-emerald-400 font-semibold">
                              {preset.basePricePln.toLocaleString('pl-PL')} zł
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Exterior Color RAL Swatches & Roof Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                    Lakierowanie Poszycia Zewnętrznego (Paleta RAL):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          onUpdateConfig({ wallColor: c.hex, roofColor: c.roofHex })
                        }
                        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
                          config.wallColor === c.hex
                            ? 'border-amber-400 bg-slate-800 text-white font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[11px]">{c.name.split(' (')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Serving Hatch & Cutaway Controls */}
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                    Elementy Ruchome & Widoki Przekroju:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => onUpdateConfig({ hatchOpen: !config.hatchOpen })}
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                        config.hatchOpen
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Klapa: {config.hatchOpen ? 'Otwarta (75°)' : 'Zamknięta'}
                    </button>

                    <button
                      onClick={() =>
                        onUpdateConfig({ customerShelfOut: !config.customerShelfOut })
                      }
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                        config.customerShelfOut
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Półka Klienta: {config.customerShelfOut ? 'Rozłożona' : 'Złożona'}
                    </button>

                    <button
                      onClick={() =>
                        onUpdateConfig({
                          cutawayMode:
                            config.cutawayMode === 'roof_off' ? 'full' : 'roof_off',
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                        config.cutawayMode === 'roof_off'
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Zdejmij Dach (Wnętrze 3D)
                    </button>

                    <button
                      onClick={() =>
                        onUpdateConfig({
                          cutawayMode:
                            config.cutawayMode === 'transparent_walls'
                              ? 'full'
                              : 'transparent_walls',
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                        config.cutawayMode === 'transparent_walls'
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Szklane Ściany X-Ray
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ lightsOn: !config.lightsOn })}
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                        config.lightsOn
                          ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Oświetlenie LED: {config.lightsOn ? 'Włączone' : 'Wyłączone'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Turnkey Industry Templates */}
          {activeTab === 'templates' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Gotowe Układy Technologiczne Fabryki GASTRO inox BAU (Made in Poland):
                </span>
                <span className="text-[10px] text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                  Atestowana Stal AISI 304
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {INDUSTRY_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/70 rounded-xl p-3 flex flex-col justify-between group transition shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">{tmpl.icon}</span>
                        <span className="font-bold text-xs text-slate-200 group-hover:text-amber-400 transition">
                          {tmpl.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {tmpl.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onApplyTemplate(tmpl.id)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-lg transition active:scale-95 shadow-sm"
                    >
                      Załaduj Ten Układ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Compliance, Sanepid & Electrical Load */}
          {activeTab === 'compliance' && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Sanepid Audit Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audytor Sanepid & HACCP
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        complianceIssuesCount.errors === 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {complianceIssuesCount.errors === 0 ? 'ZGODA SANEPID' : 'WYMAGA POPRAWEK'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automatyczna weryfikacja pod kątem ustawy o bezpieczeństwie żywności, wydzielenia umywalki do rąk i okapu nad urządzeniami gorącymi.
                  </p>
                </div>

                {/* Electrical Load Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Bilans Mocy Elektrycznej
                    </span>
                    <span className="text-xs font-bold font-mono text-amber-400">
                      {totalPowerKw} kW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {totalPowerKw > 11
                      ? 'Wymagane mocne przyłącze siłowe 400V 32A z kablem 5x6mm².'
                      : totalPowerKw > 0
                      ? 'Wystarczy standardowe gniazdo siłowe 400V 16A lub 230V.'
                      : 'Brak urządzeń elektrycznych w projekcie.'}
                  </p>
                </div>

                {/* Weight & DMC Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-sky-400" /> Kontrola Wagi i DMC
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        totalWeightKg > dmcKg ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {totalWeightKg} / {dmcKg} kg
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {totalWeightKg > dmcKg
                      ? 'UWAGA: Przekroczone dopuszczalne DMC przyczepy! Zwiększ DMC podwozia.'
                      : `Bezpieczny margines: wolne ${dmcKg - totalWeightKg} kg ładowności.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
