import { ComplianceIssue, CostSummary, TrailerConfig } from '../types/trailer';
import { EQUIPMENT_CATALOG, TRAILER_PRESETS } from '../data/equipmentCatalog';

export function calculateSummaryAndCompliance(config: TrailerConfig): {
  issues: ComplianceIssue[];
  cost: CostSummary;
  powerByPhase: { totalKw: number; requiredConnection: string; fuseAmps: number; cableMm: string };
  weightSummary: { curbWeightKg: number; equipmentWeightKg: number; payloadKg: number; dmcKg: number; isOverweight: boolean };
} {
  const issues: ComplianceIssue[] = [];
  const modelMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));

  const basePrice = TRAILER_PRESETS[config.presetId]?.basePricePln || 45000;
  let equipmentPrice = 0;
  let equipmentWeightKg = 0;
  let totalPowerKw = 0;
  let hasSanepidUnit = false;
  let hasThermal = false;
  let hasExhaustHood = false;
  let hasCooling = false;
  let thermalItemsUnderHood = 0;
  let thermalTotal = 0;
  let has400V = false;

  // Analyze each placed equipment
  for (const placed of config.placedItems) {
    const model = modelMap.get(placed.modelId);
    if (!model) continue;

    equipmentPrice += model.pricePln;
    equipmentWeightKg += model.weightKg;
    totalPowerKw += model.powerKw;

    if (model.voltage === 400) {
      has400V = true;
    }

    if (model.id === 'sanitary_module_sanepid' || model.isSanepidRequired) {
      hasSanepidUnit = true;
    }

    if (model.category === 'thermal') {
      hasThermal = true;
      thermalTotal++;
      // Check if it is near an exhaust hood (back wall, similar X)
      const nearbyHood = config.placedItems.some((other) => {
        const otherModel = modelMap.get(other.modelId);
        return otherModel?.category === 'ventilation' && Math.abs(other.x - placed.x) < 70;
      });
      if (nearbyHood) {
        thermalItemsUnderHood++;
      }
    }

    if (model.category === 'ventilation') {
      hasExhaustHood = true;
    }

    if (model.category === 'cooling') {
      hasCooling = true;
    }
  }

  // Installations pricing (electrical box, water installation, stainless steel splashbacks)
  const installationsPrice = 4500 + (has400V ? 1800 : 0) + (hasSanepidUnit ? 1200 : 0);
  const furniturePrice = config.placedItems
    .filter((item) => modelMap.get(item.modelId)?.category === 'furniture')
    .reduce((sum, item) => sum + (modelMap.get(item.modelId)?.pricePln || 0), 0);

  const totalNettoPln = basePrice + equipmentPrice + installationsPrice;
  const vatPln = Math.round(totalNettoPln * 0.23);
  const totalBruttoPln = totalNettoPln + vatPln;

  // Weight calculations
  const curbWeightKg = config.dimensions.curbWeightKg;
  const payloadAllowanceKg = 180; // towary, butle, personel
  const totalWeightKg = curbWeightKg + equipmentWeightKg + payloadAllowanceKg;
  const dmcKg = config.dimensions.dmcKg;
  const remainingPayloadKg = dmcKg - totalWeightKg;
  const isOverweight = remainingPayloadKg < 0;

  // Electrical Connection specs
  let requiredConnection = '230V 16A (Jednofazowe)';
  let fuseAmps = 16;
  let cableMm = '3x2.5 mm²';

  if (has400V || totalPowerKw > 7.0) {
    if (totalPowerKw <= 11) {
      requiredConnection = '400V 16A (Siła 3-fazowa)';
      fuseAmps = 16;
      cableMm = '5x2.5 mm²';
    } else if (totalPowerKw <= 22) {
      requiredConnection = '400V 32A (Siła 3-fazowa mocna)';
      fuseAmps = 32;
      cableMm = '5x6.0 mm²';
    } else {
      requiredConnection = '400V 63A (Przyłącze przemysłowe)';
      fuseAmps = 63;
      cableMm = '5x10.0 mm²';
    }
  }

  // --- COMPLIANCE CHECKS ---
  // 1. Sanepid / HACCP Handwash & Sink check
  if (!hasSanepidUnit) {
    issues.push({
      id: 'no_sanepid_module',
      level: 'error',
      title: 'Brak obowiązkowego punktu sanitarnego Sanepid',
      description: 'Zgodnie z wymogami Sanepid (HACCP), każdy mobilny punkt gastronomiczny musi posiadać wydzieloną umywalkę do higienicznego mycia rąk z bieżącą ciepłą wodą, oddzielną od zlewu myjącego żywność/sprzęt.',
      category: 'sanepid',
      recommendation: 'Dodaj "Kompleksowy Punkt Sanitarny Sanepid (HACCP)" z katalogu wyposażenia.',
    });
  } else {
    issues.push({
      id: 'sanepid_unit_ok',
      level: 'success',
      title: 'Wymóg sanitarny Sanepid spełniony',
      description: 'Przyczepa posiada certyfikowany moduł z umywalką do rąk, zlewem, podgrzewaczem wody i atestowanymi zbiornikami.',
      category: 'sanepid',
    });
  }

  // 2. Ventilation for thermal equipment
  if (hasThermal && !hasExhaustHood) {
    issues.push({
      id: 'thermal_without_hood',
      level: 'error',
      title: 'Brak okapu gastronomicznego nad strefą gorącą',
      description: 'Wykryto urządzenia termiczne (grill / frytownica / piec). Przepisy Sanepidu i BHP wymagają mechanicznego wyciągu z łapaczami tłuszczu, aby odprowadzać opary i chronić załogę.',
      category: 'ventilation',
      recommendation: 'Zamontuj okap gastronomiczny ścienny 160cm lub 200cm nad płytą grillową lub frytownicami.',
    });
  } else if (hasThermal && hasExhaustHood && thermalItemsUnderHood < thermalTotal) {
    issues.push({
      id: 'thermal_not_aligned',
      level: 'warning',
      title: 'Urządzenie termiczne poza strefą wyciągu okapu',
      description: 'Część urządzeń grzewczych nie znajduje się bezpośrednio pod okapem wyciągowym. Zadbaj o wyrównanie pozycji X na ścianie technologicznej.',
      category: 'ventilation',
      recommendation: 'Przesuń okap lub urządzenia, by wyciąg obejmował wszystkie źródła oparów tłuszczowych.',
    });
  } else if (hasThermal && hasExhaustHood) {
    issues.push({
      id: 'hood_ok',
      level: 'success',
      title: 'Wentylacja termiczna poprawna',
      description: 'Urządzenia generujące ciepło i tłuszcz znajdują się pod atestowanym okapem ze stali nierdzewnej.',
      category: 'ventilation',
    });
  }

  // 3. Cold chain verification (HACCP)
  if (!hasCooling) {
    issues.push({
      id: 'no_cooling',
      level: 'warning',
      title: 'Brak urządzeń chłodniczych (Ciąg chłodniczy HACCP)',
      description: 'Brak stołu lub szafy chłodniczej. Przy kontroli Sanepidu wymagane jest potwierdzenie utrzymania ciągłości łańcucha chłodniczego dla surowców psujących się (mięso, sosy, nabiał, warzywa).',
      category: 'sanepid',
      recommendation: 'Dodaj stół chłodniczy sałatkowy lub szafę chłodniczą 500L.',
    });
  }

  // 4. Weight & DMC Warning
  if (isOverweight) {
    issues.push({
      id: 'dmc_exceeded',
      level: 'error',
      title: `Przekroczone DMC przyczepy o ${Math.abs(remainingPayloadKg)} kg!`,
      description: `Łączna masa rzeczywista przyczepy (${totalWeightKg} kg) przekracza dopuszczalną masę całkowitą w dowodzie rejestracyjnym (${dmcKg} kg). Jazda z takim przeciążeniem grozi mandatem, zatrzymaniem dowodu rejestracyjnego i utratą gwarancji na osie.`,
      category: 'weight',
      recommendation: `Zwiększ DMC przyczepy w konfiguracji do kolejnej klasy (np. z 2000kg na 2700kg z podwójną osią) lub zredukuj liczbę ciężkich urządzeń.`,
    });
  } else if (remainingPayloadKg < 80) {
    issues.push({
      id: 'dmc_tight',
      level: 'warning',
      title: `Niewielki margines ładowności (${remainingPayloadKg} kg)`,
      description: 'Zapas ładowności jest minimalny. Po załadowaniu napojów, sosów i zapasów mięsa przyczepa może zbliżyć się do limitu DMC.',
      category: 'weight',
      recommendation: 'Rekomendujemy wybór podwozia o wyższym DMC (np. 2000kg lub 2700kg).',
    });
  } else {
    issues.push({
      id: 'dmc_ok',
      level: 'success',
      title: `Bezpieczny margines ładowności (${remainingPayloadKg} kg)`,
      description: 'Masa własna i wyposażenie mieszczą się w normach DMC wybranego podwozia AL-KO / Knott.',
      category: 'weight',
    });
  }

  // 5. Electrical check
  if (totalPowerKw > 0) {
    issues.push({
      id: 'power_info',
      level: 'info',
      title: `Bilans mocy: ${totalPowerKw.toFixed(1)} kW (${requiredConnection})`,
      description: `Wymagana rozdzielnica z bezpiecznikami B${fuseAmps}A oraz przewód zasilający ${cableMm}. Zadbaj o odpowiednie złącze kempingowe CEE na imprezach masowych.`,
      category: 'electrical',
    });
  }

  // 6. Cross-Contamination / Dirty-to-Clean Pathway Check (Zasada jednokierunkowości HACCP)
  const dirtyItemsOnFront = config.placedItems.filter((i) => {
    const m = modelMap.get(i.modelId);
    return m?.category === 'sanitary' && i.z > 20; // placed directly on front serving wall
  });

  if (dirtyItemsOnFront.length > 0) {
    issues.push({
      id: 'cross_contamination_hazard',
      level: 'error',
      title: 'Krytyczne krzyżowanie dróg: Strefa brudna przy oknie wydawczym',
      description: 'Zlewozmywak lub punkt sanitarny znajduje się na przedniej ścianie obok okna wydawczego klienta. Zgodnie z zasadą HACCP „Dirty-to-Clean”, strefa zmywania brudnego sprzętu nie może kolidować z wydawką gotowych posiłków ze względu na ryzyko zakażenia krzyżowego (aerozole i rozpryski brudnej wody).',
      category: 'sanepid',
      recommendation: 'Przenieś punkt sanitarny na ścianę boczną (obok wejścia) lub technologiczną z tyłu, z dala od okna klienta.',
    });
  } else {
    issues.push({
      id: 'clean_pathway_ok',
      level: 'success',
      title: 'Prawidłowy ciąg technologiczny (Brak krzyżowania dróg)',
      description: 'Strefa brudna (zmywanie i dostawy) jest prawidłowo odseparowana od strefy czystej (składanie potraw i okno klienta).',
      category: 'sanepid',
    });
  }

  const cost: CostSummary = {
    trailerBasePrice: basePrice,
    furniturePrice,
    equipmentPrice,
    installationsPrice,
    totalNettoPln,
    vatPln,
    totalBruttoPln,
    totalWeightKg,
    remainingPayloadKg,
    totalPowerKw: Number(totalPowerKw.toFixed(2)),
  };

  return {
    issues,
    cost,
    powerByPhase: {
      totalKw: Number(totalPowerKw.toFixed(1)),
      requiredConnection,
      fuseAmps,
      cableMm,
    },
    weightSummary: {
      curbWeightKg,
      equipmentWeightKg,
      payloadKg: payloadAllowanceKg,
      dmcKg,
      isOverweight,
    },
  };
}
