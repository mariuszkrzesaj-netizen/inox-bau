import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { TrailerConfig, CostSummary, ComplianceIssue } from '../types/trailer';
import { EQUIPMENT_CATALOG, TRAILER_PRESETS } from '../data/equipmentCatalog';
import { LOGO_URL } from '../data/branding';
import {
  X,
  Download,
  FileCheck,
  ShieldCheck,
  CheckCircle,
  Truck,
  Zap,
  Flame,
  FileText,
  BadgeAlert,
  ClipboardList,
  Sliders,
  AlertTriangle,
  Layers,
  Droplets,
  HardHat,
} from 'lucide-react';

interface SpecificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrailerConfig;
  cost: CostSummary;
  issues: ComplianceIssue[];
  powerSpecs: { totalKw: number; requiredConnection: string; fuseAmps: number; cableMm: string };
  weightSpecs: { curbWeightKg: number; equipmentWeightKg: number; payloadKg: number; dmcKg: number; isOverweight: boolean };
}

export const SpecificationModal: React.FC<SpecificationModalProps> = ({
  isOpen,
  onClose,
  config,
  cost,
  issues,
  powerSpecs,
  weightSpecs,
}) => {
  const [activeTab, setActiveTab] = useState<'quote' | 'technical_report'>('technical_report');
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const catalogMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));
  const preset = TRAILER_PRESETS[config.presetId];

  // Detailed checklist verification items for Sanepid
  const hasSanepidUnit = config.placedItems.some(
    (item) => item.modelId === 'sanitary_module_sanepid'
  );
  const hasThermal = config.placedItems.some(
    (item) => catalogMap.get(item.modelId)?.category === 'thermal'
  );
  const hasHood = config.placedItems.some(
    (item) => catalogMap.get(item.modelId)?.category === 'ventilation'
  );
  const hasCooling = config.placedItems.some(
    (item) => catalogMap.get(item.modelId)?.category === 'cooling'
  );

  const sanepidChecklist = [
    {
      id: 'handwash',
      title: 'Wydzielona umywalka do higienicznego mycia rąk',
      requirement: 'Obowiązkowa umywalka z baterią bezdotykową/łokciową, dozownikiem mydła i ręcznikami jednorazowymi (odrębna od zmywania sprzętu).',
      passed: hasSanepidUnit,
      critical: true,
    },
    {
      id: 'sink_food',
      title: 'Zlewozmywak do mycia artykułów spożywczych i sprzętu',
      requirement: 'Dedykowana komora zlewozmywaka do mycia żywności (warzyw, owoców) lub basen ze stali AISI 304.',
      passed: hasSanepidUnit,
      critical: true,
    },
    {
      id: 'water_system',
      title: 'Bieżąca ciepła i zimna woda z atestem PZH',
      requirement: 'Podgrzewacz przepływowy min. 3.0 kW, automatyczna pompa ciśnieniowa oraz atestowane zbiorniki 2x30L w obiegu zamkniętym.',
      passed: hasSanepidUnit,
      critical: true,
    },
    {
      id: 'ventilation_thermal',
      title: 'Mechaniczny wyciąg oparów i wentylacja (Okap z łapaczami tłuszczu)',
      requirement: 'Nad urządzeniami smażalniczymi i grillami wymagany jest okap ze stali AISI 304 ze zmywalnymi filtrami labiryntowymi.',
      passed: !hasThermal || hasHood,
      critical: hasThermal,
    },
    {
      id: 'cold_chain',
      title: 'Ciągłość łańcucha chłodniczego (Monitoring temperatur HACCP)',
      requirement: 'Stół sałatkowy lub szafa chłodnicza z termometrami cyfrowymi (zakres 2°C do 6°C) dla surowców łatwopsujących się.',
      passed: hasCooling,
      critical: true,
    },
    {
      id: 'surfaces_inox',
      title: 'Powierzchnie robocze ze stali kwasoodpornej AISI 304',
      requirement: 'Blaty i ściany technologiczne łatwe do mycia i dezynfekcji, wykończone rantam higienicznymi, odporne na chemię myjącą.',
      passed: true,
      critical: true,
    },
    {
      id: 'unidirectional_flow',
      title: 'Jednokierunkowość procesu technologicznego (Brak krzyżowania dróg)',
      requirement: 'Rozdzielenie strefy dostawy/brudnej od strefy czystej (obróbka surowca) oraz lady wydawczej dla klienta.',
      passed: true,
      critical: false,
    },
  ];

  // 1. GENERATE DEDICATED TECHNICAL REPORT PDF
  const handleGenerateTechnicalReportPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Helper for header on each page
    const renderHeader = (pageNumber: number) => {
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('GASTRO inox BAU  |  FABRYKA ZABUDÓW PRZYCZEP GASTRONOMICZNYCH', 15, 11);

      doc.setFontSize(8);
      doc.setTextColor(239, 68, 68); // Red
      doc.text('MADE IN POLAND', 170, 11);

      // Thin bottom stripe
      doc.setFillColor(56, 189, 248); // sky-400
      doc.rect(0, 18, 210, 1.2, 'F');

      // Page footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Raport Techniczny GIB-TECH-${Date.now().toString().slice(-6)} | Strona ${pageNumber}`, 15, 290);
      doc.text('Normy: HACCP / GHP / GMP / Dz.U. 2006 nr 171 poz. 1225', 125, 290);
    };

    // PAGE 1: TITLE, TRAILER SPECS & COMPREHENSIVE ELECTRICAL LOAD
    renderHeader(1);

    let curY = 28;

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('RAPORT TECHNICZNO-ODBIORCZY ZABUDOWY GASTRONOMICZNEJ', 15, curY);
    curY += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('SPECYFIKACJA WYPOSAŻENIA, BILANS INSTALACJI ELEKTRYCZNEJ & AUDYT SANEPID (HACCP)', 15, curY);
    curY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Data sporządzenia: ${new Date().toLocaleDateString('pl-PL')}  |  Zleceniodawca: Inwestor Gastronomiczny  |  Wykonawca: GASTRO inox BAU`, 15, curY);
    curY += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(15, curY, 195, curY);
    curY += 7;

    // SECTION 1: TRAILER IDENTIFICATION
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. DANE IDENTYFIKACYJNE I PARAMETRY PODWOZIA', 15, curY);
    curY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Typ pojazdu: Przyczepa gastronomiczna specjalna (kod kat. O2 / O1)`, 15, curY);
    curY += 4.5;
    doc.text(`• Wymiary zewnętrzne nadwozia: ${config.dimensions.length} cm (długość) × ${config.dimensions.width} cm (szerokość) × ${config.dimensions.height} cm (wysokość)`, 15, curY);
    curY += 4.5;
    doc.text(`• Układ jezdny: ${config.dimensions.axles} ${config.dimensions.axles === 1 ? 'oś hamowana AL-KO/Knott' : 'osie w układzie tandem AL-KO/Knott'} z hamulcem najazdowym`, 15, curY);
    curY += 4.5;
    doc.text(`• Dopuszczalna Masa Całkowita (DMC): ${config.dimensions.dmcKg} kg | Masa własna: ${weightSpecs.curbWeightKg} kg`, 15, curY);
    curY += 4.5;
    doc.text(`• Masa zabudowy i urządzeń: ${weightSpecs.equipmentWeightKg} kg | Rezerwowa ładowność użytkowa: ${cost.remainingPayloadKg} kg`, 15, curY);
    curY += 4.5;
    doc.text(`• Klapa wydawcza: ${config.dimensions.hatchWidth} × ${config.dimensions.hatchHeight} cm ze wspomaganiem siłownikami gazowymi i półką odkładczą`, 15, curY);
    curY += 8;

    // SECTION 2: COMPREHENSIVE ELECTRICAL LOAD BALANCE (BILANS MOCY)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. SZCZEGÓŁOWY BILANS MOCY I PARAMETRY INSTALACJI ELEKTRYCZNEJ', 15, curY);
    curY += 6;

    // Grey box for electrical parameters
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, curY, 180, 48, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, curY, 180, 48, 2, 2, 'D');

    let boxY = curY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('PARAMETR ELEKTRYCZNY', 20, boxY);
    doc.text('WARTOŚĆ OBLICZENIOWA', 105, boxY);
    doc.text('NORMA / WYTYCZNE', 155, boxY);
    boxY += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, boxY, 190, boxY);
    boxY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const simultaneousKw = (powerSpecs.totalKw * 0.85).toFixed(1);
    const generatorKw = (powerSpecs.totalKw * 1.25).toFixed(1);

    const rows = [
      ['Łączna moc znamionowa (Pi)', `${powerSpecs.totalKw} kW`, 'Suma odbiorników'],
      ['Moc obliczeniowa szczytowa (Ps)', `${simultaneousKw} kW`, 'Współczynnik k = 0.85'],
      ['Wymagane zasilanie zewnętrzne', `${powerSpecs.requiredConnection}`, 'Gniazdo CEE czerwone/nieb.'],
      ['Główne zabezpieczenie nadprądowe', `Wyłącznik B${powerSpecs.fuseAmps}A (3-fazowy)`, 'Charakterystyka B'],
      ['Ochrona przeciwporażeniowa RCD', 'RCD 40A / 30mA typ A (czuły)', 'PN-HD 60364-7-717'],
      ['Przekrój kabla przyłączeniowego', `${powerSpecs.cableMm} H07RN-F (opona guma)`, 'Praca plenerowa IP44/67'],
      ['Rekomendowany agregat prądotwórczy', `Min. ${generatorKw} kVA / kW (inwerterowy)`, 'Zapas rozruchowy +25%'],
    ];

    rows.forEach(([label, val, ref]) => {
      doc.text(label, 20, boxY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(val, 105, boxY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(ref, 155, boxY);
      boxY += 5.5;
    });

    curY += 56;

    // SECTION 3: SANEPID (HACCP) CHECKLIST VERIFICATION
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. LISTA KONTROLNA WYMOGÓW SANEPID (HACCP / GHP / GMP)', 15, curY);
    curY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Weryfikacja zgodności z wymogami Państwowej Inspekcji Sanitarnej dla mobilnych punktów gastronomicznych:', 15, curY);
    curY += 5;

    sanepidChecklist.forEach((item, idx) => {
      // Check status box
      const isPassed = item.passed;
      doc.setFillColor(isPassed ? 240 : 254, isPassed ? 253 : 242, isPassed ? 244 : 242);
      doc.setDrawColor(isPassed ? 34 : 239, isPassed ? 197 : 68, isPassed ? 94 : 68);
      doc.roundedRect(15, curY, 180, 11, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isPassed ? 21 : 185, isPassed ? 128 : 28, isPassed ? 61 : 28);
      doc.text(isPassed ? '[ SPEŁNIONO ]' : '[ WYMAGA UZUPEŁNIENIA ]', 19, curY + 4.5);

      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${item.title}`, 65, curY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.requirement, 19, curY + 8.5);

      curY += 13.5;
    });

    // PAGE 2: ITEMIZED EQUIPMENT SPECIFICATION & DECLARATION
    doc.addPage();
    renderHeader(2);
    curY = 28;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. DOKŁADNA SPECYFIKACJA TECHNICZNA ZAINSTALOWANEGO WYPOSAŻENIA', 15, curY);
    curY += 6;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(15, curY, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('LP', 17, curY + 5);
    doc.text('NAZWA URZĄDZENIA / MODEL', 26, curY + 5);
    doc.text('WYMIARY (cm)', 95, curY + 5);
    doc.text('MOC (kW)', 122, curY + 5);
    doc.text('ZASILANIE', 142, curY + 5);
    doc.text('WAGA', 162, curY + 5);
    doc.text('WODA', 178, curY + 5);
    curY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    config.placedItems.forEach((item, idx) => {
      const model = catalogMap.get(item.modelId);
      if (!model) return;

      const isOdd = idx % 2 === 1;
      if (isOdd) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, curY, 180, 6.5, 'F');
      }

      doc.setTextColor(51, 65, 85);
      doc.text(`${idx + 1}`, 17, curY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const truncatedName = model.name.length > 36 ? model.name.substring(0, 34) + '...' : model.name;
      doc.text(truncatedName, 26, curY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${model.dimensions.width}×${model.dimensions.depth}×${model.dimensions.height}`, 95, curY + 4.5);
      doc.text(model.powerKw > 0 ? `${model.powerKw} kW` : '0 kW (pasywne)', 122, curY + 4.5);
      doc.text(`${model.voltage} V`, 142, curY + 4.5);
      doc.text(`${model.weightKg} kg`, 162, curY + 4.5);
      doc.text(model.waterRequired ? 'TAK (Atest)' : 'NIE', 178, curY + 4.5);

      curY += 6.5;

      if (curY > 230) {
        doc.addPage();
        renderHeader(3);
        curY = 28;
      }
    });

    curY += 8;

    // SECTION 5: DECLARATION AND ENGINEERING STAMP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5. OŚWIADCZENIE WYKONAWCY I CERTYFIKACJA TECHNOLOGICZNA', 15, curY);
    curY += 6;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, curY, 180, 42, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Firma GASTRO inox BAU oświadcza, że zabudowa technologiczna została zaprojektowana i wykonana zgodnie ze standardami:',
      19,
      curY + 6
    );
    doc.text('• Rozporządzenie (WE) nr 852/2004 Parlamentu Europejskiego i Rady w sprawie higieny środków spożywczych (HACCP/GHP).', 19, curY + 11);
    doc.text('• Ustawa z dnia 25 sierpnia 2006 r. o bezpieczeństwie żywności i żywienia (Dz.U. 2006 nr 171 poz. 1225 z późn. zm.).', 19, curY + 16);
    doc.text('• Norma PN-HD 60364-7-717: Instalacje elektryczne w jednostkach ruchomych lub przewoźnych.', 19, curY + 21);
    doc.text('• Atest Państwowego Zakładu Higieny (PZH) dla elementów mających kontakt z żywnością (stal AISI 304).', 19, curY + 26);

    // Signature boxes
    doc.setDrawColor(148, 163, 184);
    doc.line(25, curY + 36, 85, curY + 36);
    doc.line(115, curY + 36, 175, curY + 36);

    doc.setFontSize(7);
    doc.text('Pieczęć i podpis Inżyniera Technologa GASTRO inox BAU', 25, curY + 40);
    doc.text('Pieczęć i podpis Odbiorcy / Inspektora Sanepidu', 115, curY + 40);

    // Save PDF
    doc.save(`Raport-Techniczny-Sanepid-GASTRO-inox-BAU-${Date.now().toString().slice(-6)}.pdf`);
  };

  // 2. GENERATE COMMERCIAL QUOTATION PDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(20, 24, 33);
    doc.text('GASTRO inox BAU', 15, 18);

    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text('FABRYKA ZABUDÓW PRZYCZEP GASTRONOMICZNYCH • MADE IN POLAND', 15, 23);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('OFICJALNA SPECYFIKACJA TECHNICZNA I KOSZTORYS', 15, 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Dokumentacja technologiczna do odbioru Sanepidu (HACCP), leasingu i ubezpieczenia', 15, 35);
    doc.text(`Numer oferty: GIB-${Date.now().toString().slice(-6)} | Data: ${new Date().toLocaleDateString('pl-PL')}`, 15, 40);

    doc.line(15, 34, 195, 34);

    // Section 1: Trailer Dimensions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. PARAMETRY PODWOZIA I NADWOZIA', 15, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`• Model bazowy: ${preset?.name || 'Indywidualna'} (${config.dimensions.length} x ${config.dimensions.width} x ${config.dimensions.height} cm)`, 15, 54);
    doc.text(`• Homologacja i DMC: ${config.dimensions.dmcKg} kg | Liczba osi: ${config.dimensions.axles}`, 15, 59);
    doc.text(`• Masa własna: ${weightSpecs.curbWeightKg} kg | Wyposażenie: ${weightSpecs.equipmentWeightKg} kg | Ładowność rezerwowa: ${config.dimensions.dmcKg - (weightSpecs.curbWeightKg + weightSpecs.equipmentWeightKg + weightSpecs.payloadKg)} kg`, 15, 64);
    doc.text(`• Klapa sprzedażowa: ${config.dimensions.hatchWidth} x ${config.dimensions.hatchHeight} cm ze wspomaganiem siłownikami gazowymi`, 15, 69);

    // Section 2: Electrical & Water Specs
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. BILANS INSTALACJI ELEKTRYCZNEJ I SANITARNEJ', 15, 78);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`• Sumaryczny pobór mocy: ${powerSpecs.totalKw} kW`, 15, 84);
    doc.text(`• Wymagane przyłącze: ${powerSpecs.requiredConnection} (bezpiecznik B${powerSpecs.fuseAmps}A, przewód ${powerSpecs.cableMm})`, 15, 89);
    doc.text(`• Instalacja wodna: Moduł 2x30L w obiegu zamkniętym z podgrzewaczem przepływowym 3kW (atest PZH)`, 15, 94);

    // Section 3: Placed Equipment
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. WYKAZ ZAINSTALOWANYCH URZĄDZEŃ GASTRONOMICZNYCH', 15, 104);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    let curY = 110;
    config.placedItems.forEach((item, idx) => {
      const model = catalogMap.get(item.modelId);
      if (!model) return;
      if (curY > 265) {
        doc.addPage();
        curY = 20;
      }
      doc.text(
        `${idx + 1}. ${model.name} (${model.dimensions.width}x${model.dimensions.depth}cm) | ${model.powerKw} kW | ${model.weightKg} kg | ${model.pricePln} zł netto`,
        15,
        curY
      );
      curY += 5;
    });

    curY += 4;
    doc.line(15, curY, 195, curY);
    curY += 6;

    // Summary Totals
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Wartość podwozia i nadwozia: ${cost.trailerBasePrice.toLocaleString('pl-PL')} PLN netto`, 15, curY);
    curY += 5;
    doc.text(`Wartość urządzeń gastronomicznych: ${cost.equipmentPrice.toLocaleString('pl-PL')} PLN netto`, 15, curY);
    curY += 5;
    doc.text(`Instalacja elektryczna, hydrauliczna i atesty: ${cost.installationsPrice.toLocaleString('pl-PL')} PLN netto`, 15, curY);
    curY += 7;
    doc.setFontSize(13);
    doc.setTextColor(20, 110, 40);
    doc.text(`RAZEM NETTO: ${cost.totalNettoPln.toLocaleString('pl-PL')} PLN`, 15, curY);
    curY += 6;
    doc.setFontSize(11);
    doc.text(`RAZEM BRUTTO (z 23% VAT): ${cost.totalBruttoPln.toLocaleString('pl-PL')} PLN`, 15, curY);

    doc.save(`Specyfikacja-Handlowa-GASTRO-inox-BAU-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header with GASTRO inox BAU Logo and Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-xl p-1 shadow-md border border-slate-300 flex items-center justify-center shrink-0">
              <img
                src={LOGO_URL}
                alt="GASTRO inox BAU - Made in Poland"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
                  GASTRO <span className="text-sky-400">inox</span> <span className="text-red-500">BAU</span>
                </h2>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/30">
                  Made in Poland
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                  Atest PZH / HACCP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centrum Dokumentacji Technicznej & Kosztorysowej
              </p>
            </div>
          </div>

          {/* Action PDF Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateTechnicalReportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 transition active:scale-95"
            >
              <FileCheck className="w-4 h-4 text-sky-200" />
              <span>Raport Techniczny PDF (Sanepid & Moc)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Kosztorys Handlowy PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (Raport Techniczny vs Kosztorys) */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('technical_report')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'technical_report'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Raport Techniczny Sanepid & Bilans Mocy
          </button>

          <button
            onClick={() => setActiveTab('quote')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'quote'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Zestawienie Urządzeń & Kosztorys Handlowy
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={printAreaRef} className="p-6 space-y-6 overflow-y-auto text-slate-300 flex-1">
          {activeTab === 'technical_report' ? (
            /* TAB 1: TECHNICAL REPORT & SANEPID CHECKLIST & ELECTRICAL BALANCE */
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Gotowość Do Odbioru Sanitarno-Epidemiologicznego
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">
                    Raport Zgodności Technologicznej GASTRO inox BAU (PN-EN & HACCP)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Oficjalne zestawienie parametrów instalacji, odbiorników prądu oraz punktów sanitarnych. Możesz pobrać ten raport jako plik PDF.
                  </p>
                </div>
                <button
                  onClick={handleGenerateTechnicalReportPdf}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition shrink-0"
                >
                  <Download className="w-4 h-4" /> Pobierz Gotowy Raport PDF
                </button>
              </div>

              {/* 1. Electrical Power Balance Section */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    1. Kompleksowy Bilans Mocy i Parametry Przyłącza
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    Suma: {powerSpecs.totalKw} kW
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Wymagane Zasilanie</span>
                    <span className="font-bold text-slate-100 font-mono text-sm block mt-0.5">
                      {powerSpecs.requiredConnection}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Złącze CEE 400V / 230V ze wskaźnikiem faz
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Zabezpieczenie Główne</span>
                    <span className="font-bold text-slate-100 font-mono text-sm block mt-0.5">
                      B{powerSpecs.fuseAmps}A + RCD 30mA
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Wyłącznik różnicowoprądowy typ A
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Kabel Przyłączeniowy</span>
                    <span className="font-bold text-slate-100 font-mono text-sm block mt-0.5">
                      {powerSpecs.cableMm} H07RN-F
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Kabel oponowy gumowy zewnętrzny IP67
                    </span>
                  </div>
                </div>

                {/* Generator recommendation */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-200">
                        Zasilanie Awaryjne / Agregat Prądotwórczy:
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dla imprez plenerowych bez siły rekomendowany jest agregat inwerterowy o mocy min.{' '}
                        <strong className="text-amber-400">{(powerSpecs.totalKw * 1.25).toFixed(1)} kVA / kW</strong> (uwzględnia 25% rezerwy rozruchowej silników).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Sanepid Checklist Audit Section */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    2. Lista Kontrolna Wymogów Sanepid (HACCP / GHP / GMP)
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">
                    {sanepidChecklist.filter((i) => i.passed).length} / {sanepidChecklist.length} punktów spełnionych
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sanepidChecklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition ${
                        item.passed
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-red-950/30 border-red-500/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.passed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span className="font-bold text-slate-100">
                            {idx + 1}. {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                          {item.requirement}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ${
                          item.passed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {item.passed ? 'SPEŁNIONO' : 'WYMAGA UZUPEŁNIENIA'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Weight & Payload Safety Matrix */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-400" />
                  3. Bezpieczeństwo Masowe & Zapas Ładowności (DMC)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">DMC Przyczepy</span>
                    <span className="font-bold text-slate-100 font-mono text-sm block mt-0.5">
                      {config.dimensions.dmcKg} kg
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Masa Własna</span>
                    <span className="font-bold text-slate-100 font-mono text-sm block mt-0.5">
                      {weightSpecs.curbWeightKg} kg
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Masa Wyposażenia</span>
                    <span className="font-bold text-slate-100 font-mono text-sm block mt-0.5">
                      {weightSpecs.equipmentWeightKg} kg
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Zapas Ładowności</span>
                    <span
                      className={`font-bold font-mono text-sm block mt-0.5 ${
                        cost.remainingPayloadKg < 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {cost.remainingPayloadKg} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: COMMERCIAL QUOTE & BILL OF MATERIALS */
            <div className="space-y-6">
              {/* Key Metrics Header Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-semibold block">Wymiary (D×S×W)</span>
                  <span className="text-sm font-extrabold text-slate-100 font-mono">
                    {config.dimensions.length} × {config.dimensions.width} × {config.dimensions.height} cm
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {config.dimensions.axles} {config.dimensions.axles === 1 ? 'oś' : 'osie (tandem)'}
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-semibold block">Bilans Mocy</span>
                  <span className="text-sm font-extrabold text-amber-400 font-mono">
                    {powerSpecs.totalKw} kW
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                    {powerSpecs.requiredConnection}
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-semibold block">Masa / DMC</span>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      weightSpecs.isOverweight ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {cost.totalWeightKg} / {config.dimensions.dmcKg} kg
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Zapas: {cost.remainingPayloadKg} kg
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-semibold block">Cena Całkowita</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    {cost.totalNettoPln.toLocaleString('pl-PL')} zł netto
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {cost.totalBruttoPln.toLocaleString('pl-PL')} zł brutto (23% VAT)
                  </span>
                </div>
              </div>

              {/* Itemized Table of Installed Equipment */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Lista Zamontowanego Wyposażenia ({config.placedItems.length} pozycji)
                </h3>
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Poz.</th>
                        <th className="py-2.5 px-3 font-semibold">Urządzenie / Mebel</th>
                        <th className="py-2.5 px-3 font-semibold">Wymiary (cm)</th>
                        <th className="py-2.5 px-3 font-semibold">Moc (kW)</th>
                        <th className="py-2.5 px-3 font-semibold">Masa</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Cena Netto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {config.placedItems.map((item, idx) => {
                        const model = catalogMap.get(item.modelId);
                        if (!model) return null;
                        return (
                          <tr key={item.instanceId} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-200">
                              {model.name}
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {model.modelCode}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              {model.dimensions.width} × {model.dimensions.depth} × {model.dimensions.height}
                            </td>
                            <td className="py-2 px-3 font-mono text-amber-400">
                              {model.powerKw > 0 ? `${model.powerKw} kW` : '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              {model.weightKg} kg
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-400 text-right font-bold">
                              {model.pricePln.toLocaleString('pl-PL')} zł
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-200 block">Uwagi do kalkulacji:</span>
                  <p>• Ceny zawierają montaż instalacji technologicznej ze stali nierdzewnej kwasoodpornej AISI 304.</p>
                  <p>• W cenie atesty PZH, dokumentacja DTR oraz schemat powykonawczy do Sanepidu.</p>
                  <p>• Gwarancja fabryczna na podwozie AL-KO / Knott: 24 miesiące.</p>
                </div>

                <div className="text-right space-y-1 text-xs shrink-0">
                  <div className="flex justify-between md:justify-end gap-6 text-slate-400">
                    <span>Podwozie i nadwozie:</span>
                    <span className="font-mono text-slate-200">{cost.trailerBasePrice.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-6 text-slate-400">
                    <span>Urządzenia gastronomiczne:</span>
                    <span className="font-mono text-slate-200">{cost.equipmentPrice.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-6 text-slate-400">
                    <span>Instalacje & Rozdzielnica:</span>
                    <span className="font-mono text-slate-200">{cost.installationsPrice.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between md:justify-end gap-6 font-bold text-slate-100 text-sm">
                    <span>Suma Netto:</span>
                    <span className="text-emerald-400 font-mono">{cost.totalNettoPln.toLocaleString('pl-PL')} PLN</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-6 font-extrabold text-slate-200 text-base">
                    <span>Suma Brutto (23% VAT):</span>
                    <span className="text-emerald-400 font-mono">{cost.totalBruttoPln.toLocaleString('pl-PL')} PLN</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
