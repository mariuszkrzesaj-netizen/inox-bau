/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { TrailerConfig, PlacedEquipment } from './types/trailer';
import { TRAILER_PRESETS, EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { INDUSTRY_TEMPLATES } from './data/industryTemplates';
import { calculateSummaryAndCompliance } from './services/complianceEngine';
import { ThreeCanvas, ThreeCanvasExportHandlers } from './components/ThreeCanvas';
import { FloorPlanner2D } from './components/FloorPlanner2D';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { SpecificationModal } from './components/SpecificationModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { Export3DModal } from './components/Export3DModal';

export default function App() {
  // Default configuration starts with the popular 4.0m Standard Burger & Fries layout
  const initialTemplate = INDUSTRY_TEMPLATES[0];

  const exportHandlerRef = useRef<ThreeCanvasExportHandlers | null>(null);
  const [isExport3DModalOpen, setIsExport3DModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [config, setConfig] = useState<TrailerConfig>({
    presetId: 'standard_40',
    dimensions: TRAILER_PRESETS.standard_40.dimensions,
    wallColor: '#1e2024', // Matte Black RAL 9005
    roofColor: '#141619',
    chassisColor: '#475569',
    floorType: 'checker_plate_alu',
    stainlessFinish: 'brushed_inox',
    hatchOpen: true,
    hatchAngle: 75,
    customerShelfOut: true,
    cutawayMode: 'full',
    lightsOn: true,
    neonText: 'STREET FOOD',
    neonColor: '#f59e0b',
    electricalConnection: '400V_32A',
    waterSystem: 'tanks_pump_30l',
    placedItems: initialTemplate.placedItems,
  });

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'interior' | 'top' | 'customer'>('iso');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // Recalculate Compliance, Costs, Power, and Weight on the fly
  const { issues, cost, powerByPhase, weightSummary } = useMemo(
    () => calculateSummaryAndCompliance(config),
    [config]
  );

  const complianceCounts = useMemo(() => {
    let errors = 0;
    let warnings = 0;
    let success = 0;
    issues.forEach((i) => {
      if (i.level === 'error') errors++;
      else if (i.level === 'warning') warnings++;
      else if (i.level === 'success') success++;
    });
    return { errors, warnings, success };
  }, [issues]);

  // Handlers
  const handleUpdateConfig = (partial: Partial<TrailerConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleAddItem = (modelId: string) => {
    const model = EQUIPMENT_CATALOG.find((m) => m.id === modelId);
    if (!model) return;

    // Find smart placement along back or front wall
    const isHood = model.category === 'ventilation';
    const isThermal = model.category === 'thermal';
    const isFurniture = model.category === 'furniture';
    const isCooling = model.category === 'cooling';

    // Place back wall (z = -65) or front wall (z = 65)
    let targetZ = -65;
    let targetY = 0;
    let targetRot = 0;

    if (isHood) {
      targetY = 160;
    } else if (model.id === 'cashier_desk_pos') {
      targetZ = 65;
      targetRot = 180;
    } else if (model.category === 'cooling' && model.dimensions.depth <= 70) {
      targetZ = 65;
      targetRot = 180;
    }

    // Offset X so items don't completely overlap
    const existingCount = config.placedItems.length;
    const targetX = ((existingCount % 5) - 2) * 50;

    const newItem: PlacedEquipment = {
      instanceId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      modelId,
      x: targetX,
      z: targetZ,
      y: targetY,
      rotation: targetRot,
      wallSnap: targetZ < 0 ? 'back' : 'front',
    };

    setConfig((prev) => ({
      ...prev,
      placedItems: [...prev.placedItems, newItem],
    }));
    setSelectedInstanceId(newItem.instanceId);
  };

  const handleUpdateItemPosition = (
    instanceId: string,
    x: number,
    z: number,
    rotation: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      placedItems: prev.placedItems.map((item) =>
        item.instanceId === instanceId ? { ...item, x, z, rotation } : item
      ),
    }));
  };

  const handleDeleteItem = (instanceId: string) => {
    setConfig((prev) => ({
      ...prev,
      placedItems: prev.placedItems.filter((item) => item.instanceId !== instanceId),
    }));
    if (selectedInstanceId === instanceId) {
      setSelectedInstanceId(null);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = INDUSTRY_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const preset = TRAILER_PRESETS[template.recommendedSize];

    setConfig((prev) => ({
      ...prev,
      presetId: template.recommendedSize,
      dimensions: preset.dimensions,
      wallColor: template.defaultWallColor,
      placedItems: template.placedItems,
      cutawayMode: 'full',
    }));
    setSelectedInstanceId(null);
  };

  const handleResetLayout = () => {
    setConfig((prev) => ({
      ...prev,
      placedItems: [],
    }));
    setSelectedInstanceId(null);
  };

  const handleExportSTL = (options: { binary: boolean; includeRoof: boolean }) => {
    setIsExporting(true);
    try {
      exportHandlerRef.current?.exportSTL(options);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGLTF = (options: { binary: boolean; includeRoof: boolean }) => {
    setIsExporting(true);
    try {
      exportHandlerRef.current?.exportGLTF(options);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Bar HUD */}
      <TopBar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        cameraPreset={cameraPreset}
        onSetCameraPreset={setCameraPreset}
        cost={cost}
        totalPowerKw={powerByPhase.totalKw}
        totalWeightKg={cost.totalWeightKg}
        dmcKg={config.dimensions.dmcKg}
        hasSanepidErrors={complianceCounts.errors > 0}
        onOpenOffer={() => setIsOfferModalOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onResetLayout={handleResetLayout}
        onOpenExport3D={() => setIsExport3DModalOpen(true)}
      />

      {/* Main Viewport: 3D Canvas OR 2D Architectural Floor Plan */}
      <main className="w-full h-full pt-16 pb-20">
        {viewMode === '3d' ? (
          <ThreeCanvas
            config={config}
            selectedInstanceId={selectedInstanceId}
            onSelectItem={setSelectedInstanceId}
            viewCameraPreset={cameraPreset}
            onOpenExport3D={() => setIsExport3DModalOpen(true)}
            exportHandlerRef={exportHandlerRef}
          />
        ) : (
          <FloorPlanner2D
            config={config}
            selectedInstanceId={selectedInstanceId}
            onSelectItem={setSelectedInstanceId}
            onUpdateItemPosition={handleUpdateItemPosition}
            onDeleteItem={handleDeleteItem}
            onAddItemAtCenter={handleAddItem}
          />
        )}
      </main>

      {/* Collapsible Unified Bottom Control Dock */}
      <BottomDock
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onAddItem={handleAddItem}
        onApplyTemplate={handleApplyTemplate}
        onOpenOfferModal={() => setIsOfferModalOpen(true)}
        complianceIssuesCount={complianceCounts}
        totalPowerKw={powerByPhase.totalKw}
        totalWeightKg={cost.totalWeightKg}
        dmcKg={config.dimensions.dmcKg}
      />

      {/* Specification & Cost Estimate Modal */}
      <SpecificationModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        config={config}
        cost={cost}
        issues={issues}
        powerSpecs={powerByPhase}
        weightSpecs={weightSummary}
      />

      {/* AI Technologist & Sanepid Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        config={config}
        cost={cost}
        totalPowerKw={powerByPhase.totalKw}
      />

      {/* 3D Export to STL and GLTF Modal for CAD & 3D Printing */}
      <Export3DModal
        isOpen={isExport3DModalOpen}
        onClose={() => setIsExport3DModalOpen(false)}
        onExportSTL={handleExportSTL}
        onExportGLTF={handleExportGLTF}
        isExporting={isExporting}
      />
    </div>
  );
}
