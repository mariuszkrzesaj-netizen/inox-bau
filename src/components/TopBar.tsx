import React from 'react';
import {
  Boxes,
  Compass,
  FileSpreadsheet,
  HelpCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
  Box,
} from 'lucide-react';
import { CostSummary } from '../types/trailer';
import { LOGO_URL } from '../data/branding';

interface TopBarProps {
  viewMode: '3d' | '2d';
  onSetViewMode: (mode: '3d' | '2d') => void;
  cameraPreset: 'iso' | 'interior' | 'top' | 'customer';
  onSetCameraPreset: (preset: 'iso' | 'interior' | 'top' | 'customer') => void;
  cost: CostSummary;
  totalPowerKw: number;
  totalWeightKg: number;
  dmcKg: number;
  hasSanepidErrors: boolean;
  onOpenOffer: () => void;
  onOpenAiAssistant: () => void;
  onResetLayout: () => void;
  onOpenExport3D?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onSetViewMode,
  cameraPreset,
  onSetCameraPreset,
  cost,
  totalPowerKw,
  totalWeightKg,
  dmcKg,
  hasSanepidErrors,
  onOpenOffer,
  onOpenAiAssistant,
  onResetLayout,
  onOpenExport3D,
}) => {
  return (
    <header className="fixed top-3 inset-x-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Official Factory Logo */}
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl px-3 py-2 shadow-xl backdrop-blur">
        <div className="bg-white rounded-xl p-1 shadow-md border border-slate-200/40 flex items-center justify-center shrink-0">
          <img
            src={LOGO_URL}
            alt="GASTRO inox BAU - Made in Poland"
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="pr-1">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm text-slate-100 tracking-tight leading-none">
              GASTRO <span className="text-sky-400 font-bold">inox</span> <span className="text-red-500 font-black">BAU</span>
            </h1>
            <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/30">
              Made in Poland
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Konfigurator Zabudowy Przyczep & Standard HACCP
          </p>
        </div>
      </div>

      {/* Center: View Switcher (3D vs 2D Plan) & Camera Presets */}
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1 shadow-xl backdrop-blur">
        <div className="flex items-center bg-slate-950/80 rounded-xl p-0.5 border border-slate-800">
          <button
            onClick={() => onSetViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === '3d'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> Wizualizacja 3D
          </button>
          <button
            onClick={() => onSetViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === '2d'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Rzut 2D (HACCP)
          </button>
        </div>

        {/* 3D Camera Angles */}
        {viewMode === '3d' && (
          <div className="hidden md:flex items-center gap-1 pl-1 text-xs">
            <button
              onClick={() => onSetCameraPreset('iso')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                cameraPreset === 'iso'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Izometria
            </button>
            <button
              onClick={() => onSetCameraPreset('customer')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                cameraPreset === 'customer'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Klient (Okno)
            </button>
            <button
              onClick={() => onSetCameraPreset('interior')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                cameraPreset === 'interior'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wnętrze
            </button>
            <button
              onClick={() => onSetCameraPreset('top')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                cameraPreset === 'top'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Z góry
            </button>

            {onOpenExport3D && (
              <>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <button
                  onClick={onOpenExport3D}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition active:scale-95"
                  title="Eksportuj model do STL (Druk 3D) lub GLTF (CAD)"
                >
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  <span>Eksport 3D</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Key Engineering Badges & Actions */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Live Status Cluster */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl px-3.5 py-2 shadow-xl backdrop-blur text-xs">
          {/* Power */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-slate-300 font-bold">{totalPowerKw} kW</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Weight */}
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span
              className={`font-mono font-bold ${
                totalWeightKg > dmcKg ? 'text-red-400' : 'text-slate-300'
              }`}
            >
              {totalWeightKg}/{dmcKg} kg
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Sanepid */}
          <div className="flex items-center gap-1">
            {hasSanepidErrors ? (
              <span className="flex items-center gap-1 text-red-400 font-bold">
                <ShieldAlert className="w-3.5 h-3.5" /> Sanepid!
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> HACCP OK
              </span>
            )}
          </div>
        </div>

        {/* AI Technologist Drawer Trigger */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition active:scale-95"
          title="Doradca technologiczny i Sanepid AI"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Doradca AI</span>
        </button>

        {/* Technical Offer Button */}
        <button
          onClick={onOpenOffer}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>
            {cost.totalNettoPln.toLocaleString('pl-PL')} zł
            <span className="text-[10px] font-normal opacity-80 ml-1">netto</span>
          </span>
        </button>
      </div>
    </header>
  );
};
