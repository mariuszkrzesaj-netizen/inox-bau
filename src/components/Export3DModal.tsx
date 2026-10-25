import React, { useState } from 'react';
import { X, Box, Download, Printer, Layers, Info, CheckCircle2, Sparkles } from 'lucide-react';

interface Export3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSTL: (options: { binary: boolean; includeRoof: boolean }) => void;
  onExportGLTF: (options: { binary: boolean; includeRoof: boolean }) => void;
  isExporting: boolean;
}

export const Export3DModal: React.FC<Export3DModalProps> = ({
  isOpen,
  onClose,
  onExportSTL,
  onExportGLTF,
  isExporting,
}) => {
  const [includeRoof, setIncludeRoof] = useState(false); // default false so 3D print shows the inside equipment!
  const [format, setFormat] = useState<'stl' | 'glb' | 'gltf'>('stl');
  const [scalePreset, setScalePreset] = useState<'1:50' | '1:25' | '1:1'>('1:50');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (format === 'stl') {
      onExportSTL({ binary: true, includeRoof });
      setDownloadSuccess('Model STL został pomyślnie wygenerowany i pobrany!');
    } else if (format === 'glb') {
      onExportGLTF({ binary: true, includeRoof });
      setDownloadSuccess('Model GLB (binarny) został wyeksportowany!');
    } else {
      onExportGLTF({ binary: false, includeRoof });
      setDownloadSuccess('Model GLTF (JSON) został wyeksportowany!');
    }

    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  Eksport Modelu 3D do CAD i Druku 3D
                </h3>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
                  STL & GLTF
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pobierz trójwymiarową bryłę food trucka do slicera 3D lub oprogramowania inżynierskiego
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Format Selection Cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Wybierz format eksportu:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* STL Card */}
              <button
                type="button"
                onClick={() => setFormat('stl')}
                className={`p-4 rounded-2xl border text-left transition relative ${
                  format === 'stl'
                    ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm">Format STL (.stl)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Drukarka 3D
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zoptymalizowany format siatki trójkątów do slicerów (PrusaSlicer, Bambu Studio, Cura, Creality). Gotowy do pocięcia na warstwy i wydruku makiety.
                </p>
              </button>

              {/* GLTF / GLB Card */}
              <button
                type="button"
                onClick={() => setFormat('glb')}
                className={`p-4 rounded-2xl border text-left transition relative ${
                  format === 'glb' || format === 'gltf'
                    ? 'bg-sky-500/10 border-sky-400 ring-1 ring-sky-400 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-sm">Format GLTF / GLB (.glb)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    CAD & AR
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zawiera strukturę drzewa komponentów, tekstury i materiały. Kompatybilny z Blenderem, Fusion 360, SolidWorks, SketchUp i wizualizacjami AR.
                </p>
              </button>
            </div>
          </div>

          {/* Options: Roof Cutaway */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Opcje geometrii modelu:
            </span>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Uwzględnij dach w bryle 3D:
                </span>
                <span className="text-[11px] text-slate-400">
                  {includeRoof
                    ? 'Model pełny (zamknięta bryła zewnętrzna przyczepy).'
                    : 'Zalecane: Model bez dachu (umożliwia podgląd i wydruk mebli oraz wyposażenia wewnątrz!).'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeRoof(!includeRoof)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  includeRoof
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {includeRoof ? 'Dach Zamknięty' : 'Otwarty Przekrój (Zalecane)'}
              </button>
            </div>

            {/* Slicer printing tip */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-semibold text-slate-200">
                  Wskazówka dla druku 3D (FDM / Żywica SLA):
                </span>
                <p className="text-[11px]">
                  Model jest eksportowany w skali 1:1 w metrach (lub milimetrach). W slicerze (np. Bambu Studio lub Cura) ustaw skalowanie <strong>2% (dla skali 1:50)</strong> lub <strong>4% (dla skali 1:25)</strong>, aby otrzymać poręczną makietę prezentacyjną o długości 8-16 cm.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Producent: GASTRO inox BAU • Standard STL/GLTF v2.0
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? 'Przetwarzanie bryły 3D...' : `Pobierz plik .${format.toUpperCase()}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
