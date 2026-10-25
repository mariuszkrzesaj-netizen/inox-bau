import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Sparkles, Send, Bot, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TrailerConfig, CostSummary } from '../types/trailer';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { LOGO_URL } from '../data/branding';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrailerConfig;
  cost: CostSummary;
  totalPowerKw: number;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

const EXPERT_KNOWLEDGE: Record<string, string> = {
  sanepid: `Wymogi Sanepidu dla przyczep gastronomicznych (HACCP / GHP):
1. **Wydzielony punkt do mycia rąk**: Bezwzględny wymóg prawny. Umywalka do rąk personelu musi być oddzielna od zlewu do mycia warzyw lub sprzętu. Wymagana jest bieżąca ciepła i zimna woda (podgrzewacz min. 2-3 kW) oraz atestowane zbiorniki na wodę czystą i szarą (minimum 2x30L) lub stałe przyłącze.
2. **Jednokierunkowość procesu**: Droga surowca brudnego (np. surowe mięso, niemowlaki warzyw) nie może krzyżować się z wydawką gotowych dań do klienta.
3. **Ciąg chłodniczy**: Temperatura wewnątrz szaf i stołów chłodniczych musi być monitorowana termometrami z atestem (np. 2-6°C).
4. **Wentylacja mechaniczna**: Nad płytami grillowymi, piecami i frytownicami wymagany jest okap z filtrami labiryntowymi ze stali nierdzewnej AISI 304 zatrzymującymi tłuszcz.
5. **Gładkie, zmywalne powierzchnie**: Ściany z płyt warstwowych lub stali nierdzewnej, posadzka antypoślizgowa z atestem higienicznym.`,

  electrical: `Zasilanie elektryczne food trucka:
• Przy obecnym projekcie pobór mocy wynosi **{POWER} kW**.
• Jeżeli moc przekracza 11 kW, standardowe gniazdo 16A nie wystarczy – konieczne jest złącze siłowe 400V 32A (gniazdo 5-bolcowe czerwone) oraz przewód zasilający min. 5x6 mm².
• Jeśli planujesz pracę na eventach plenerowych bez dostępu do sieci, polecamy agregat prądotwórczy wyciszony (inwerterowy) o mocy ciągłej min. 20-25% wyższej niż suma pracujących jednocześnie urządzeń.`,

  drivingLicense: `Kategorie prawa jazdy na przyczepę gastronomiczną:
1. **Kategoria B**: Zestaw (auto + przyczepa) o łącznym DMC do 3500 kg. Jeśli auto waży np. 2100 kg DMC, przyczepa może mieć max 1400 kg DMC (nasz model Kompakt 3.0m mieści się w kat. B!).
2. **Kategoria B z kodem 96 (B96)**: Zestaw do 4250 kg DMC (wymaga jedynie zdanego egzaminu praktycznego, bez kursu).
3. **Kategoria B+E**: Zestaw do 7000 kg DMC (auto do 3.5t + przyczepa do 3.5t z hamulcem najazdowym). Wymagana dla modeli Maxi 5.0m i Gigant 6.0m.`,

  workflow: `Optymalny układ technologiczny przyczepy:
• **Ściana tylna**: Ciąg gorący (grill, frytury, piec) zlokalizowany centralnie pod okapem wyciągowym.
• **Kącik sanitarny**: Zlewozmywak i umywalka w lewym narożniku, z dala od okna wydawczego.
• **Ściana przednia (pod oknem)**: Stół chłodniczy z nadstawą sałatkową (dostęp do warzyw/sosów w trakcie składania zamówienia) oraz stanowisko kasowe POS w prawym narożniku okna.`,
};

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  config,
  cost,
  totalPowerKw,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Dzień dobry! Jestem doradcą inżynierii technologicznej fabryki GASTRO inox BAU (Made in Poland) oraz audytorem HACCP/Sanepid. Twój projekt ma obecnie ${config.placedItems.length} urządzeń o mocy ${totalPowerKw} kW. W czym mogę pomóc przy doborze wyposażenia, odbiorze Sanepidu lub instalacji 400V/230V?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const catalogMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));
  const itemNames = config.placedItems
    .map((p) => catalogMap.get(p.modelId)?.name)
    .filter(Boolean)
    .join(', ');

  const handleSend = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `Jesteś głównym inżynierem technologicznym w polskiej fabryce przyczep gastronomicznych i certyfikowanym audytorem Sanepid / HACCP.
Aktualny konfigurowany pojazd:
- Długość: ${config.dimensions.length} cm, szerokość: ${config.dimensions.width} cm, DMC: ${config.dimensions.dmcKg} kg.
- Pobór mocy: ${totalPowerKw} kW.
- Zamontowane wyposażenie: ${itemNames || 'Brak'}.
- Szacunkowy koszt: ${cost.totalNettoPln} zł netto.
Udzielaj zwięzłych, technicznych, rzetelnych odpowiedzi w języku polskim, uwzględniając polskie normy Sanepidu, BHP, podłączenia 400V/230V i uprawnienia kierowców.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userText,
          config: { systemInstruction: systemPrompt },
        });

        const reply = response.text || 'Przepraszam, nie udało się wygenerować odpowiedzi.';
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: 'ai', text: reply },
        ]);
      } else {
        // Fallback to domain expert responses
        setTimeout(() => {
          let reply = '';
          const lower = userText.toLowerCase();
          if (lower.includes('sanepid') || lower.includes('haccp') || lower.includes('odbiór')) {
            reply = EXPERT_KNOWLEDGE.sanepid;
          } else if (lower.includes('prąd') || lower.includes('moc') || lower.includes('zasilan') || lower.includes('agregat')) {
            reply = EXPERT_KNOWLEDGE.electrical.replace('{POWER}', totalPowerKw.toString());
          } else if (lower.includes('prawo jazdy') || lower.includes('kat') || lower.includes('holowan')) {
            reply = EXPERT_KNOWLEDGE.drivingLicense;
          } else {
            reply = EXPERT_KNOWLEDGE.workflow;
          }
          setMessages((prev) => [
            ...prev,
            { id: (Date.now() + 1).toString(), sender: 'ai', text: reply },
          ]);
          setIsLoading(false);
        }, 500);
        return;
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: EXPERT_KNOWLEDGE.sanepid,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200/40 flex items-center justify-center shrink-0">
            <img
              src={LOGO_URL}
              alt="GASTRO inox BAU Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs text-slate-100">Doradca GASTRO inox BAU</h3>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400">Inżynieria Technologiczna & Sanepid HACCP</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-6 h-6 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200'
              }`}
            >
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 text-slate-400 text-xs italic">
            <Bot className="w-4 h-4 animate-spin text-violet-400" /> Doradca analizuje projekt...
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
          Szybkie pytania eksperckie:
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleSend('Jakie są obowiązkowe wymogi Sanepidu dla tego projektu?')}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition"
          >
            Wymogi Sanepidu
          </button>
          <button
            onClick={() => handleSend('Czy moc przyłącza prądu wystarczy do moich urządzeń?')}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition"
          >
            Moc i Zasilanie
          </button>
          <button
            onClick={() => handleSend('Jakie prawo jazdy jest potrzebne do holowania tej przyczepy?')}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition"
          >
            Prawo Jazdy B vs B+E
          </button>
        </div>
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-slate-800 bg-slate-950/90 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zadaj pytanie technologowi..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
