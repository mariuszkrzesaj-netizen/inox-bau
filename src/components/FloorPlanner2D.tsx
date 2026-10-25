import React, { useRef, useState } from 'react';
import { PlacedEquipment, TrailerConfig } from '../types/trailer';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { LOGO_URL } from '../data/branding';
import {
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Flame,
  Snowflake,
  Sparkles,
  AlertTriangle,
  Route,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  CornerDownRight,
  DoorOpen,
} from 'lucide-react';

interface FloorPlanner2DProps {
  config: TrailerConfig;
  selectedInstanceId: string | null;
  onSelectItem: (instanceId: string | null) => void;
  onUpdateItemPosition: (instanceId: string, x: number, z: number, rotation: number) => void;
  onDeleteItem: (instanceId: string) => void;
  onAddItemAtCenter: (modelId: string) => void;
}

export const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({
  config,
  selectedInstanceId,
  onSelectItem,
  onUpdateItemPosition,
  onDeleteItem,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSanitaryFlow, setShowSanitaryFlow] = useState(true);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialZ: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialZ: 0,
  });

  const catalogMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));

  // Canvas scaling: convert trailer cm to pixels on screen
  const scale = 1.45; // 1cm = 1.45px
  const trailerW_px = config.dimensions.length * scale;
  const trailerH_px = config.dimensions.width * scale;

  const toPxX = (cmX: number) => trailerW_px / 2 + cmX * scale;
  const toPxY = (cmZ: number) => trailerH_px / 2 + cmZ * scale;
  const toCmX = (pxX: number) => (pxX - trailerW_px / 2) / scale;
  const toCmZ = (pxY: number) => (pxY - trailerH_px / 2) / scale;

  const selectedItem = config.placedItems.find((i) => i.instanceId === selectedInstanceId);
  const selectedModel = selectedItem ? catalogMap.get(selectedItem.modelId) : null;

  // --- AUTOMATED DIRTY-TO-CLEAN SANITARY PATH & COLLISION DETECTION ---
  const dirtyItems = config.placedItems.filter((i) => {
    const m = catalogMap.get(i.modelId);
    return m?.category === 'sanitary';
  });

  const thermalItems = config.placedItems.filter((i) => {
    const m = catalogMap.get(i.modelId);
    return m?.category === 'thermal';
  });

  const cleanItems = config.placedItems.filter((i) => {
    const m = catalogMap.get(i.modelId);
    return m?.category === 'cooling';
  });

  const cashierItem = config.placedItems.find((i) => i.modelId === 'cashier_desk_pos');

  // Collision Check: Any dirty/sanitary equipment placed along the front wall (z > 20) near customer serving hatch
  const dirtyItemsOnFront = dirtyItems.filter((i) => i.z > 20);
  const hasCrossContamination = dirtyItemsOnFront.length > 0;

  // Flow nodes coordinates in pixel space
  const halfLen = config.dimensions.length / 2;
  const halfWid = config.dimensions.width / 2;

  // 1. Delivery & Staff Entry Door (Lewa ściana)
  const nodeEntry = { x: toPxX(-halfLen + 15), y: toPxY(0), label: 'DOSTAWA / WEJŚCIE' };

  // 2. Dirty Zone (Zmywalnia / Punkt sanitarny)
  const nodeDirty = dirtyItems.length > 0
    ? {
        x: toPxX(dirtyItems.reduce((acc, it) => acc + it.x, 0) / dirtyItems.length),
        y: toPxY(dirtyItems.reduce((acc, it) => acc + it.z, 0) / dirtyItems.length),
        label: 'STREFA BRUDNA (Mycie/Odpady)',
      }
    : { x: toPxX(-halfLen + 50), y: toPxY(-halfWid + 35), label: 'STREFA BRUDNA' };

  // 3. Thermal Cooking Zone (Grille / Frytury / Piece)
  const nodeThermal = thermalItems.length > 0
    ? {
        x: toPxX(thermalItems.reduce((acc, it) => acc + it.x, 0) / thermalItems.length),
        y: toPxY(thermalItems.reduce((acc, it) => acc + it.z, 0) / thermalItems.length),
        label: 'OBRÓBKA TERMICZNA (Gorąca)',
      }
    : { x: toPxX(0), y: toPxY(-halfWid + 35), label: 'OBRÓBKA GORĄCA' };

  // 4. Clean Plating & Preparation Zone (Stoły chłodnicze / Sałatkowe)
  const nodeClean = cleanItems.length > 0
    ? {
        x: toPxX(cleanItems.reduce((acc, it) => acc + it.x, 0) / cleanItems.length),
        y: toPxY(cleanItems.reduce((acc, it) => acc + it.z, 0) / cleanItems.length),
        label: 'STREFA CZYSTA (Składanie Dań)',
      }
    : { x: toPxX(0), y: toPxY(halfWid - 40), label: 'STREFA CZYSTA' };

  // 5. Customer Service Window (Klapa / Wydawka)
  const nodeWindow = {
    x: cashierItem ? toPxX(cashierItem.x) : toPxX(0),
    y: toPxY(halfWid - 8),
    label: 'WYDAWKA DLA KLIENTA',
  };

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, item: PlacedEquipment) => {
    e.stopPropagation();
    onSelectItem(item.instanceId);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: item.x,
      initialZ: item.z,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedItem) return;
    const dx = (e.clientX - dragStartRef.current.mouseX) / scale;
    const dz = (e.clientY - dragStartRef.current.mouseY) / scale;

    let newX = Math.round((dragStartRef.current.initialX + dx) / 5) * 5;
    let newZ = Math.round((dragStartRef.current.initialZ + dz) / 5) * 5;

    const maxX = config.dimensions.length / 2 - 25;
    const maxZ = config.dimensions.width / 2 - 25;
    newX = Math.max(-maxX, Math.min(maxX, newX));
    newZ = Math.max(-maxZ, Math.min(maxZ, newZ));

    onUpdateItemPosition(selectedItem.instanceId, newX, newZ, selectedItem.rotation);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Nudge selected item
  const nudge = (dx: number, dz: number) => {
    if (!selectedItem) return;
    onUpdateItemPosition(
      selectedItem.instanceId,
      selectedItem.x + dx,
      selectedItem.z + dz,
      selectedItem.rotation
    );
  };

  const rotateSelected = () => {
    if (!selectedItem) return;
    const nextRot = (selectedItem.rotation + 90) % 360;
    onUpdateItemPosition(selectedItem.instanceId, selectedItem.x, selectedItem.z, nextRot);
  };

  const snapToWall = (wall: 'back' | 'front' | 'left' | 'right') => {
    if (!selectedItem || !selectedModel) return;
    const itemD = selectedModel.dimensions.depth / 2;

    if (wall === 'back') {
      onUpdateItemPosition(selectedItem.instanceId, selectedItem.x, -halfWid + itemD + 2, 0);
    } else if (wall === 'front') {
      onUpdateItemPosition(selectedItem.instanceId, selectedItem.x, halfWid - itemD - 2, 180);
    } else if (wall === 'left') {
      onUpdateItemPosition(selectedItem.instanceId, -halfLen + itemD + 2, selectedItem.z, 90);
    } else if (wall === 'right') {
      onUpdateItemPosition(selectedItem.instanceId, halfLen - itemD - 2, selectedItem.z, 270);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelectItem(null)}
      className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden select-none"
    >
      {/* Top CAD Metryczka with GASTRO inox BAU and Sanitary Flow Switch */}
      <div className="absolute top-4 inset-x-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Company Title Block */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 border border-slate-800 backdrop-blur rounded-2xl px-3.5 py-2 text-xs shadow-xl">
          <div className="bg-white rounded-lg p-1 shadow-sm flex items-center justify-center shrink-0">
            <img
              src={LOGO_URL}
              alt="GASTRO inox BAU Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-100 text-xs">
                GASTRO <span className="text-sky-400">inox</span> <span className="text-red-500">BAU</span>
              </span>
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider bg-red-950/60 px-1 py-0.2 rounded border border-red-500/20">
                Made in Poland
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span className="text-amber-400 font-semibold">Rzut 2D (Skala 1:{Math.round(100 / scale)})</span>
              <span>•</span>
              <span>{config.dimensions.length} × {config.dimensions.width} cm</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" /> HACCP
              </span>
            </div>
          </div>
        </div>

        {/* Sanitary Dirty-to-Clean Flow Controller & Status Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Status Indicator Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-lg backdrop-blur ${
              hasCrossContamination
                ? 'bg-red-950/80 border-red-500/70 text-red-200'
                : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200'
            }`}
          >
            {hasCrossContamination ? (
              <>
                <XCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                <span className="truncate">KOLIZJA SANITARNA: Krzyżowanie dróg brudnej i wydawki!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ciąg Jednokierunkowy HACCP (Dirty-to-Clean OK)</span>
              </>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShowSanitaryFlow(!showSanitaryFlow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-lg backdrop-blur active:scale-95 ${
              showSanitaryFlow
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Ścieżka Sanitarna: {showSanitaryFlow ? 'Widoczna' : 'Ukryta'}</span>
          </button>
        </div>
      </div>

      {/* Blueprint Drawing Board */}
      <div
        style={{ width: trailerW_px, height: trailerH_px }}
        className="relative bg-slate-900/70 border-4 border-slate-700/80 rounded-2xl shadow-2xl transition-all"
      >
        {/* Technical Grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #38bdf8 1px, transparent 1px),
              linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
            `,
            backgroundSize: `${scale * 10}px ${scale * 10}px`,
          }}
        />

        {/* Tow bar indicator (Left Side / Dyszel) */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <div className="w-10 h-8 border-2 border-dashed border-amber-500/60 rounded-l-lg flex items-center justify-center text-[10px] text-amber-400 font-mono rotate-90">
            DYSZEL
          </div>
        </div>

        {/* Entry / Delivery Door Marker (Left end wall) */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 -translate-x-full pr-1.5 flex flex-col items-center pointer-events-none">
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-md">
            <DoorOpen className="w-3.5 h-3.5 text-red-400" />
            <span>DRZWI DOSTAW (WEJŚCIE)</span>
          </div>
        </div>

        {/* Customer Serving Window Indicator (Front wall / bottom side) */}
        <div
          style={{
            width: config.dimensions.hatchWidth * scale,
            left: (trailerW_px - config.dimensions.hatchWidth * scale) / 2,
            bottom: -6,
          }}
          className="absolute h-3 bg-amber-500 rounded-b-md flex items-center justify-center text-[9px] font-bold text-slate-950 uppercase tracking-widest pointer-events-none shadow-lg shadow-amber-500/20"
        >
          KLAPA SPRZEDAŻOWA / OKNO WYDAWCZE ({config.dimensions.hatchWidth} cm)
        </div>

        {/* Back Technological Wall label (Top side) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-500 uppercase tracking-widest pointer-events-none">
          ŚCIANA TECHNOLOGICZNA (CIĄG GORĄCY / OKAPY / SANEPID)
        </div>

        {/* Center aisle walkway guidelines */}
        <div className="absolute inset-x-8 top-1/3 bottom-1/3 border border-dashed border-slate-700/40 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-600 font-mono tracking-widest">
            CIĄG KOMUNIKACYJNY OBSŁUGI
          </span>
        </div>

        {/* SVG VECTOR OVERLAY: SANITARY PATH & DIRTY-TO-CLEAN FLOW */}
        {showSanitaryFlow && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full z-15 overflow-visible">
            <defs>
              {/* Arrowhead markers */}
              <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrow-sky" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Path 1: Entry Delivery -> Dirty Sanitary Zone (Red Flow) */}
            <path
              d={`M ${nodeEntry.x} ${nodeEntry.y} Q ${(nodeEntry.x + nodeDirty.x) / 2} ${nodeDirty.y} ${nodeDirty.x} ${nodeDirty.y}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              markerEnd="url(#arrow-red)"
            />

            {/* Path 2: Dirty Zone -> Thermal Cooking Zone (Amber Flow) */}
            <path
              d={`M ${nodeDirty.x} ${nodeDirty.y} Q ${(nodeDirty.x + nodeThermal.x) / 2} ${(nodeDirty.y + nodeThermal.y) / 2} ${nodeThermal.x} ${nodeThermal.y}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              markerEnd="url(#arrow-amber)"
            />

            {/* Path 3: Thermal Cooking Zone -> Clean Plating Zone (Emerald Flow) */}
            <path
              d={`M ${nodeThermal.x} ${nodeThermal.y} Q ${(nodeThermal.x + nodeClean.x) / 2} ${(nodeThermal.y + nodeClean.y) / 2} ${nodeClean.x} ${nodeClean.y}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              markerEnd="url(#arrow-emerald)"
            />

            {/* Path 4: Clean Plating -> Customer Serving Window (Dispensing Flow) */}
            <path
              d={`M ${nodeClean.x} ${nodeClean.y} L ${nodeWindow.x} ${nodeWindow.y}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              markerEnd="url(#arrow-sky)"
            />

            {/* CROSS-FLOW COLLISION WARNING VECTOR */}
            {hasCrossContamination && dirtyItemsOnFront.map((item) => {
              const itemPxX = toPxX(item.x);
              const itemPxY = toPxY(item.z);
              return (
                <g key={`collision_${item.instanceId}`}>
                  {/* Flashing collision cross line */}
                  <line
                    x1={itemPxX - 35}
                    y1={itemPxY - 35}
                    x2={itemPxX + 35}
                    y2={itemPxY + 35}
                    stroke="#dc2626"
                    strokeWidth="4"
                    strokeDasharray="6,4"
                  />
                  <line
                    x1={itemPxX + 35}
                    y1={itemPxY - 35}
                    x2={itemPxX - 35}
                    y2={itemPxY + 35}
                    stroke="#dc2626"
                    strokeWidth="4"
                    strokeDasharray="6,4"
                  />
                  {/* Warning Badge Marker */}
                  <circle cx={itemPxX} cy={itemPxY} r="18" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
                  <text
                    x={itemPxX}
                    y={itemPxY + 4}
                    fill="#fef2f2"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    !
                  </text>
                  <text
                    x={itemPxX}
                    y={itemPxY - 24}
                    fill="#ef4444"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="filter drop-shadow"
                  >
                    KOLIZJA HACCP (Zmywanie przy wydawce)
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Placed Equipment Boxes */}
        {config.placedItems.map((item) => {
          const model = catalogMap.get(item.modelId);
          if (!model) return null;

          const isSelected = item.instanceId === selectedInstanceId;

          const isRotated90 = item.rotation === 90 || item.rotation === 270;
          const wCm = isRotated90 ? model.dimensions.depth : model.dimensions.width;
          const dCm = isRotated90 ? model.dimensions.width : model.dimensions.depth;

          const boxW = wCm * scale;
          const boxH = dCm * scale;
          const posX = toPxX(item.x) - boxW / 2;
          const posY = toPxY(item.z) - boxH / 2;

          // HACCP zone styling & classification
          let zoneBg = 'bg-slate-800 border-slate-600 text-slate-300';
          let badgeIcon = null;
          let zoneTag = 'STREFA PASYWNA';
          let tagColor = 'bg-slate-700 text-slate-300';

          if (model.category === 'sanitary') {
            const isHazard = item.z > 20;
            zoneBg = isHazard
              ? 'bg-red-950/90 border-red-500 text-red-200 ring-2 ring-red-500'
              : 'bg-red-950/60 border-red-500/80 text-red-200';
            badgeIcon = <ShieldCheck className="w-3 h-3 text-red-400 shrink-0" />;
            zoneTag = isHazard ? 'KOLIZJA: BRUDNA' : 'STREFA BRUDNA';
            tagColor = isHazard ? 'bg-red-600 text-white font-black' : 'bg-red-500/30 text-red-300';
          } else if (model.category === 'thermal') {
            zoneBg = 'bg-amber-950/70 border-amber-500/80 text-amber-200';
            badgeIcon = <Flame className="w-3 h-3 text-amber-400 shrink-0" />;
            zoneTag = 'OBRÓBKA GORĄCA';
            tagColor = 'bg-amber-500/30 text-amber-300';
          } else if (model.category === 'cooling') {
            zoneBg = 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200';
            badgeIcon = <Snowflake className="w-3 h-3 text-emerald-400 shrink-0" />;
            zoneTag = 'STREFA CZYSTA';
            tagColor = 'bg-emerald-500/30 text-emerald-300';
          } else if (model.id === 'cashier_desk_pos') {
            zoneBg = 'bg-sky-950/70 border-sky-500/80 text-sky-200';
            badgeIcon = <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />;
            zoneTag = 'WYDAWKA & POS';
            tagColor = 'bg-sky-500/30 text-sky-300';
          } else if (model.category === 'ventilation') {
            zoneBg = 'bg-slate-850 border-slate-500 text-slate-200 border-dashed';
            badgeIcon = <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />;
            zoneTag = 'WYCIĄG OKAP';
            tagColor = 'bg-slate-800 text-slate-400';
          }

          return (
            <div
              key={item.instanceId}
              onMouseDown={(e) => handleMouseDown(e, item)}
              style={{
                width: boxW,
                height: boxH,
                left: posX,
                top: posY,
              }}
              className={`absolute cursor-move border-2 rounded-lg p-1.5 flex flex-col justify-between transition-shadow shadow-md z-16 ${zoneBg} ${
                isSelected ? 'ring-2 ring-sky-400 shadow-xl shadow-sky-500/30 scale-[1.02]' : 'hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1 overflow-hidden">
                <div className="flex items-center gap-1 min-w-0">
                  {badgeIcon}
                  <span className="font-bold text-[10px] truncate leading-tight">
                    {model.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                  {model.powerKw > 0 ? `${model.powerKw}kW` : ''}
                </span>
              </div>

              {/* Sanitary Zone Tag Badge */}
              <div className="flex items-center justify-between text-[8px] font-mono mt-1">
                <span className={`px-1 py-0.2 rounded font-bold uppercase ${tagColor}`}>
                  {zoneTag}
                </span>
                <span className="text-slate-400">{item.rotation}°</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sanitary Path Legend Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl backdrop-blur">
        <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
          Legenda Ciągu Technologicznego:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Strefa Brudna (Dostawy / Zmywanie)</span>
        </div>
        <span>➡️</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Obróbka Termiczna (Grill / Piece)</span>
        </div>
        <span>➡️</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Strefa Czysta (Składanie Dań)</span>
        </div>
        <span>➡️</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Wydawka dla Klienta (Okno / POS)</span>
        </div>
      </div>

      {/* Selected Item Control Bar */}
      {selectedItem && selectedModel && (
        <div className="absolute bottom-6 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center gap-4 text-xs z-30 backdrop-blur">
          <div className="flex flex-col">
            <span className="font-bold text-slate-200">{selectedModel.name}</span>
            <span className="text-slate-400 text-[11px] font-mono">
              X: {selectedItem.x} cm • Z: {selectedItem.z} cm • {selectedModel.powerKw} kW • {selectedModel.weightKg} kg
            </span>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Quick Snap Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => snapToWall('back')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              title="Przyciągnij do ściany tylnej"
            >
              Ściana Tył
            </button>
            <button
              onClick={() => snapToWall('front')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              title="Przyciągnij do lady wydawczej"
            >
              Lada Przód
            </button>
            <button
              onClick={() => snapToWall('left')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              title="Bok Lewy (Dostawy/Sanepid)"
            >
              Bok Lewy
            </button>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Nudge arrows */}
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              onClick={() => nudge(0, -5)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Góra"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <div />
            <button
              onClick={() => nudge(-5, 0)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Lewo"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudge(0, 5)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Dół"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudge(5, 0)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Prawo"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Rotate & Delete */}
          <button
            onClick={rotateSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/30 border border-sky-500/50 hover:bg-sky-600/50 text-sky-200 font-medium transition"
          >
            <RotateCw className="w-3.5 h-3.5" /> Obróć 90°
          </button>
          <button
            onClick={() => onDeleteItem(selectedItem.instanceId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 hover:bg-red-600/40 text-red-300 font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Usuń
          </button>
        </div>
      )}
    </div>
  );
};
