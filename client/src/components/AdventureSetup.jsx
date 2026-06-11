import { useEffect, useState } from "react";
import { formatSkillNumbers, getSkillRoleLabel } from "../utils/formatSkillNumbers.js";

const MODELS = [
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const GENRES = ["奇幻", "謎團", "遺跡", "森林", "學院", "地城"];
const STEPS = [
  { id: "input", label: "冒險設定" },
  { id: "character", label: "角色預覽" },
  { id: "adventure", label: "冒險預覽" },
];

const CHARACTER_CARDS_STORAGE_KEY = "aiDungeonCharacterCards";

function loadCharacterCards() {
  try {
    const rawCards = JSON.parse(localStorage.getItem(CHARACTER_CARDS_STORAGE_KEY) || "[]");
    return Array.isArray(rawCards) ? rawCards.map(normalizeCharacterCard).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveCharacterCards(cards) {
  try {
    localStorage.setItem(CHARACTER_CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Character cards are a convenience cache; a storage failure should not block setup.
  }
}

function normalizeCharacterCard(card) {
  if (!card || typeof card !== "object") return null;
  const now = new Date().toISOString();

  return {
    ...card,
    id: card.id || `card_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: card.createdAt || now,
    updatedAt: card.updatedAt || now,
    attributes: card.attributes || {},
    skills: Array.isArray(card.skills) ? card.skills : [],
    starterEquipment: Array.isArray(card.starterEquipment) ? card.starterEquipment : card.equipment || [],
    traits: Array.isArray(card.traits) ? card.traits : [],
    portraitPrompt: card.portraitPrompt || {},
    generatedPortrait: card.generatedPortrait || null,
  };
}

function upsertCharacterCard(cards, characterPreview) {
  const normalized = normalizeCharacterCard(characterPreview);
  if (!normalized) return cards;

  const now = new Date().toISOString();
  const existingIndex = cards.findIndex((card) => card.id === normalized.id);
  const nextCard = {
    ...normalized,
    createdAt: normalized.createdAt || now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    return cards.map((card, index) => (index === existingIndex ? nextCard : card));
  }

  return [nextCard, ...cards].slice(0, 12);
}

function removeCharacterCard(cards, cardId) {
  return cards.filter((card) => card.id !== cardId);
}

function StatPill({ label, value }) {
  return (
    <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs text-stone-300">
      {label} {value ?? "-"}
    </span>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <header className="border-b border-white/10 pb-3">
      <p className="font-mono text-xs uppercase text-amber-300">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
    </header>
  );
}

function StepIndicator({ step }) {
  const activeIndex = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {STEPS.map((item, index) => (
        <div
          key={item.id}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
            index <= activeIndex
              ? "border-amber-200/40 bg-amber-300/15 text-amber-50"
              : "border-white/10 bg-white/[0.03] text-stone-500"
          }`}
        >
          {index + 1}. {item.label}
        </div>
      ))}
    </div>
  );
}

function AppearanceList({ appearance }) {
  if (!appearance || typeof appearance !== "object") {
    return <p className="mt-2 text-sm leading-6 text-teal-50/80">{appearance || "-"}</p>;
  }

  return (
    <dl className="mt-2 space-y-2 text-xs leading-5 text-teal-50/80">
      {Object.entries(appearance).map(([key, value]) => (
        <div key={key}>
          <dt className="font-mono uppercase text-teal-200/80">{key}</dt>
          <dd>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdventureSetup({
  loading,
  error,
  onStartDemo,
  onStartGeneratedAdventure,
}) {
  const [step, setStep] = useState("input");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [genre, setGenre] = useState(GENRES[0]);
  const [characterPrompt, setCharacterPrompt] = useState(
    "一位勇敢的新手冒險者，有清楚的外觀特色、實用的初始裝備，以及三個可用於戰鬥的技能。"
  );
  const [adventurePrompt, setAdventurePrompt] = useState(
    "建立一段 5 個房間的奇幻冒險，包含一個道具型挑戰、一條有意義的獎勵鏈，以及一個 Boss 房間。"
  );
  const [roomCount, setRoomCount] = useState(5);
  const [difficulty, setDifficulty] = useState(4);
  const [characterPreview, setCharacterPreview] = useState(null);
  const [adventurePreview, setAdventurePreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [isGeneratingAdventure, setIsGeneratingAdventure] = useState(false);
  const [comfyStatus, setComfyStatus] = useState({ loading: false, data: null });
  const [portraitGeneration, setPortraitGeneration] = useState({ loading: false, error: "" });
  const [characterCards, setCharacterCards] = useState([]);

  useEffect(() => {
    setApiKey(localStorage.getItem("aiDungeonGeminiApiKey") || "");
    setCharacterCards(loadCharacterCards());
  }, []);

  useEffect(() => {
    if (step === "character" && characterPreview) {
      checkComfyStatus();
    }
  }, [step, characterPreview]);

  function handleApiKeyChange(event) {
    const nextApiKey = event.target.value;
    setApiKey(nextApiKey);
    localStorage.setItem("aiDungeonGeminiApiKey", nextApiKey);
  }

  function buildBasePayload() {
    return {
      apiKey,
      model,
      genre,
      characterPrompt,
      adventurePrompt,
      roomCount: Number(roomCount),
      difficulty: Number(difficulty),
    };
  }

  async function checkComfyStatus() {
    setComfyStatus((current) => ({ ...current, loading: true }));

    try {
      const response = await fetch("/api/comfy/status");
      const data = await response.json();
      setComfyStatus({ loading: false, data });
    } catch {
      setComfyStatus({
        loading: false,
        data: { ok: false, message: "ComfyUI is not reachable" },
      });
    }
  }

  function persistCharacterCard(nextCharacterPreview) {
    setCharacterCards((currentCards) => {
      const nextCards = upsertCharacterCard(currentCards, nextCharacterPreview);
      saveCharacterCards(nextCards);
      return nextCards;
    });
  }

  function loadSavedCharacter(card) {
    setCharacterPreview(normalizeCharacterCard(card));
    setAdventurePreview(null);
    setPortraitGeneration({ loading: false, error: "" });
    setStep("character");
  }

  function deleteSavedCharacter(cardId) {
    setCharacterCards((currentCards) => {
      const nextCards = removeCharacterCard(currentCards, cardId);
      saveCharacterCards(nextCards);
      return nextCards;
    });
  }

  async function previewCharacter() {
    setIsGeneratingCharacter(true);
    setPreviewError("");

    try {
      const response = await fetch("/api/character/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBasePayload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "character_preview_failed");
      const nextCharacter = normalizeCharacterCard(data.character);
      setCharacterPreview(nextCharacter);
      setAdventurePreview(null);
      setPortraitGeneration({ loading: false, error: "" });
      persistCharacterCard(nextCharacter);
      setStep("character");
    } catch {
      setPreviewError("角色預覽生成失敗，請調整角色 prompt 後再試一次。");
    } finally {
      setIsGeneratingCharacter(false);
    }
  }

  async function previewAdventure() {
    setIsGeneratingAdventure(true);
    setPreviewError("");

    try {
      const response = await fetch("/api/adventure/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildBasePayload(),
          confirmedCharacter: characterPreview,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "adventure_preview_failed");
      setAdventurePreview(data);
      setStep("adventure");
    } catch {
      setPreviewError("冒險預覽生成失敗，請調整冒險 prompt 後再試一次。");
    } finally {
      setIsGeneratingAdventure(false);
    }
  }

  async function generateCharacterPortrait() {
    const portraitPrompt = characterPreview?.portraitPrompt || {};
    const positive = portraitPrompt.positive || characterPreview?.imagePrompt || "";
    const negative = portraitPrompt.negative || "";
    const { width, height } = getPortraitSize(portraitPrompt.aspectRatio);

    if (!positive.trim()) {
      setPortraitGeneration({
        loading: false,
        error: "缺少角色立繪 positive prompt，請先生成或載入角色。",
      });
      return;
    }

    setPortraitGeneration({ loading: true, error: "" });

    try {
      const response = await fetch("/api/image/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positive,
          negative,
          width,
          height,
          filenamePrefix: "character_portrait",
        }),
      });
      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "portrait_generation_failed");
      }

      setCharacterPreview((current) => {
        if (!current) return current;
        const nextCharacter = { ...current, generatedPortrait: data };
        persistCharacterCard(nextCharacter);
        return nextCharacter;
      });
      setPortraitGeneration({ loading: false, error: "" });
    } catch {
      setPortraitGeneration({
        loading: false,
        error: "角色立繪生成失敗，請確認 ComfyUI 與 workflow 後再試一次。",
      });
    }
  }

  function getPortraitSize() {
    return { width: 512, height: 768 };
  }

  function startGeneratedAdventure() {
    if (!adventurePreview?.state || !adventurePreview?.gameData) {
      setPreviewError("缺少冒險預覽，請先生成冒險預覽。");
      return;
    }

    onStartGeneratedAdventure({
      state: adventurePreview.state,
      gameData: adventurePreview.gameData,
      generationSummary: adventurePreview.generationSummary,
      preview: adventurePreview.preview,
      character: characterPreview,
    });
  }

  return (
    <main className="min-h-screen bg-[#15120f] text-stone-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_10%,rgba(245,158,11,0.22),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.2),transparent_28%),linear-gradient(135deg,#18130f_0%,#202129_48%,#0e1512_100%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-5">
          <p className="font-mono text-xs uppercase text-amber-300">Adventure Setup</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">AI Dungeon Demo</h1>
        </header>

        <StepIndicator step={step} />

        {error || previewError ? (
          <div className="rounded-lg border border-red-300/40 bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {previewError || error}
          </div>
        ) : null}

        {step === "input" ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <form className="rounded-lg border border-white/10 bg-black/20 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.38)] sm:p-5">
              <SectionTitle eyebrow="Step 1" title="冒險設定" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-stone-200">Gemini API Key</span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none focus:border-amber-200/70"
                    placeholder="Paste Gemini API key"
                  />
                  <span className="mt-1 block text-xs text-stone-500">只保存在瀏覽器 localStorage 與單次 request body。</span>
                </label>

                <label>
                  <span className="text-sm font-semibold text-stone-200">模型</span>
                  <select value={model} onChange={(event) => setModel(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none">
                    {MODELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold text-stone-200">類型</span>
                  <select value={genre} onChange={(event) => setGenre(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none">
                    {GENRES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold text-stone-200">房間數</span>
                  <input type="number" min="4" max="8" value={roomCount} onChange={(event) => setRoomCount(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none" />
                </label>
                <label>
                  <span className="text-sm font-semibold text-stone-200">難度</span>
                  <input type="number" min="1" max="10" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-stone-200">角色 Prompt</span>
                  <textarea value={characterPrompt} onChange={(event) => setCharacterPrompt(event.target.value)} rows={4} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#101216] px-3 py-3 text-sm leading-6 text-white outline-none" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-stone-200">冒險 Prompt</span>
                  <textarea value={adventurePrompt} onChange={(event) => setAdventurePrompt(event.target.value)} rows={5} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#101216] px-3 py-3 text-sm leading-6 text-white outline-none" />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" disabled={isGeneratingCharacter || !apiKey.trim()} onClick={previewCharacter} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60">
                  {isGeneratingCharacter ? "角色生成中..." : "生成角色預覽"}
                </button>
                <button type="button" disabled={loading || isGeneratingCharacter} onClick={onStartDemo} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.08] disabled:cursor-wait disabled:opacity-60">
                  使用預設 Demo
                </button>
              </div>
            </form>

            <aside className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-4 text-sm leading-7 text-teal-50/90">
              <p className="font-mono text-xs uppercase text-teal-200">生成冒險</p>
              <div className="mt-4 rounded-lg border border-teal-100/15 bg-black/15 p-3">
                <p className="font-mono text-xs uppercase text-teal-200">已保存角色</p>
                {characterCards.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {characterCards.map((card) => (
                      <div key={card.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex gap-3">
                          {card.generatedPortrait?.imageUrl ? (
                            <img src={card.generatedPortrait.imageUrl} alt={`${card.name} portrait`} className="h-16 w-12 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="grid h-16 w-12 shrink-0 place-items-center rounded bg-black/30 font-mono text-xs text-stone-400">AD</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{card.name || "未命名角色"}</p>
                            <p className="truncate text-xs text-teal-100/70">{card.title || "冒險者"}</p>
                            <p className="mt-1 text-xs leading-5 text-stone-400">HP {card.attributes?.maxHp ?? "-"} / MP {card.attributes?.maxMp ?? "-"} / ATK {card.attributes?.attack ?? "-"} / DEF {card.attributes?.defense ?? "-"}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => loadSavedCharacter(card)} className="rounded border border-teal-200/30 bg-teal-300/10 px-2 py-1 text-xs font-semibold text-teal-50">載入</button>
                          <button type="button" onClick={() => deleteSavedCharacter(card.id)} className="rounded border border-red-200/30 bg-red-400/10 px-2 py-1 text-xs font-semibold text-red-100">刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-teal-50/60">生成過的角色會保存在這個瀏覽器。</p>
                )}
              </div>
              <p className="mt-3">先生成角色，再預覽圍繞該角色建立的冒險。</p>
              <p className="mt-3">Step 3 開始冒險時會直接使用預覽的 state/gameData。</p>
            </aside>
          </section>
        ) : null}

        {step === "character" && characterPreview ? (
          <section className="rounded-lg border border-white/10 bg-black/20 p-5">
            <SectionTitle eyebrow="Step 2" title="角色預覽" />
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-sm font-semibold text-amber-200">{characterPreview.title}</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{characterPreview.name}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-300">{characterPreview.summary}</p>
                <p className="mt-3 text-sm leading-7 text-stone-400">{characterPreview.background}</p>
                <p className="mt-3 text-sm leading-7 text-stone-300">{characterPreview.personality}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatPill label="HP" value={characterPreview.attributes.maxHp} />
                  <StatPill label="MP" value={characterPreview.attributes.maxMp} />
                  <StatPill label="ATK" value={characterPreview.attributes.attack} />
                  <StatPill label="DEF" value={characterPreview.attributes.defense} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {characterPreview.skills.map((skill) => (
                    <div key={skill.id} className="rounded-lg border border-amber-200/20 bg-amber-300/10 p-3">
                      <p className="font-semibold text-white">{skill.name}</p>
                      <p className="mt-1 font-mono text-xs text-amber-100/70">{getSkillRoleLabel(skill)} / {formatSkillNumbers(skill)}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-400">{skill.description}</p>
                      {skill.flavorText ? <p className="mt-2 text-xs leading-5 text-amber-100/70">{skill.flavorText}</p> : null}
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(characterPreview.starterEquipment || characterPreview.equipment || []).map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="mt-1 font-mono text-xs text-stone-400">{item.slot}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-300">{item.description}</p>
                      {item.flavorText ? <p className="mt-2 text-xs leading-5 text-stone-500">{item.flavorText}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
              <aside className="space-y-3">
                <div className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-4">
                  <p className="font-semibold text-teal-50">外觀</p>
                  <AppearanceList appearance={characterPreview.appearance} />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">立繪 Prompt</p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">{characterPreview.portraitPrompt?.positive || characterPreview.imagePrompt}</p>
                  <p className="mt-3 font-mono text-xs text-red-200/80">{characterPreview.portraitPrompt?.negative}</p>
                  {characterPreview.generatedPortrait?.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-lg border border-teal-200/20 bg-black/30">
                      <img
                        src={characterPreview.generatedPortrait.imageUrl}
                        alt={`${characterPreview.name} portrait`}
                        className="aspect-[2/3] w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">ComfyUI</p>
                  <p className={`mt-2 text-sm leading-6 ${
                    comfyStatus.loading
                      ? "text-amber-100"
                      : comfyStatus.data?.ok
                        ? "text-teal-100"
                        : "text-stone-300"
                  }`}>
                    {comfyStatus.loading
                      ? "檢查中..."
                      : comfyStatus.data?.ok
                        ? `ComfyUI 已連線：${comfyStatus.data.baseUrl}`
                        : "ComfyUI 未連線，仍可使用文字 prompt 繼續冒險"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={checkComfyStatus} disabled={comfyStatus.loading} className="rounded-lg border border-teal-200/30 bg-teal-300/10 px-3 py-2 text-xs font-semibold text-teal-50 transition hover:bg-teal-300/20 disabled:cursor-wait disabled:opacity-60">
                      {comfyStatus.loading ? "檢查中..." : "重新檢查 ComfyUI"}
                    </button>
                    <button type="button" onClick={generateCharacterPortrait} disabled={!comfyStatus.data?.ok || portraitGeneration.loading} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-55">
                      {portraitGeneration.loading ? "立繪生成中..." : "生成角色立繪"}
                    </button>
                  </div>
                  {!comfyStatus.data?.ok ? (
                    <p className="mt-3 text-xs leading-5 text-stone-500">ComfyUI 未啟動時，文字 RPG 生成流程仍可正常使用。</p>
                  ) : null}
                  {portraitGeneration.error ? (
                    <p className="mt-3 text-xs leading-5 text-red-200">{portraitGeneration.error}</p>
                  ) : null}
                  {characterPreview.generatedPortrait ? (
                    <p className="mt-3 text-xs leading-5 text-teal-100">
                      立繪已保存：{characterPreview.generatedPortrait.filename}
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={previewAdventure} disabled={isGeneratingAdventure} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 disabled:cursor-wait disabled:opacity-60">
                {isGeneratingAdventure ? "冒險生成中..." : "確認角色並預覽冒險"}
              </button>
              <button type="button" onClick={previewCharacter} disabled={isGeneratingCharacter} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 disabled:cursor-wait disabled:opacity-60">
                重新生成角色
              </button>
              <button type="button" onClick={() => setStep("input")} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-stone-300">
                回到設定
              </button>
            </div>
          </section>
        ) : null}

        {step === "adventure" && adventurePreview?.preview ? (
          <section className="rounded-lg border border-white/10 bg-black/20 p-5">
            <SectionTitle eyebrow="Step 3" title="冒險預覽" />
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="overflow-hidden rounded-lg border border-white/10">
                <div className="grid grid-cols-[1.05fr_0.7fr_0.9fr_0.9fr_0.9fr] border-b border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-stone-400">
                  <span>房間</span><span>類型</span><span>敵人 / 道具</span><span>挑戰</span><span>獎勵 / 出口</span>
                </div>
                {adventurePreview.preview.rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-[1.05fr_0.7fr_0.9fr_0.9fr_0.9fr] gap-2 border-b border-white/5 px-3 py-3 text-sm text-stone-200 last:border-b-0">
                    <span>
                      <span className="block font-semibold text-white">{room.name}</span>
                      <span className="mt-1 line-clamp-2 block text-xs text-stone-500">{room.summary}</span>
                    </span>
                    <span className="font-mono text-xs text-amber-100/80">{room.kind}</span>
                    <span className="text-xs text-stone-400">{room.monsterName || room.itemNames?.join(", ") || "-"}</span>
                    <span className="text-xs text-stone-400">{room.requiredItemName || room.challengeType || "-"}</span>
                    <span className="text-xs text-stone-400">{room.rewardItemNames?.join(", ") || room.exits?.join(" / ") || "-"}</span>
                  </div>
                ))}
              </div>
              <aside className="space-y-3 text-sm leading-6">
                <div className="rounded-lg border border-red-200/20 bg-red-400/10 p-3">
                  <p className="font-semibold text-red-50">Boss</p>
                  <p className="mt-1 text-red-50/80">{adventurePreview.preview.boss?.name || "沒有 Boss"}</p>
                </div>
                <div className="rounded-lg border border-amber-200/20 bg-amber-300/10 p-3">
                  <p className="font-semibold text-amber-50">玩家</p>
                  <p className="mt-1 text-amber-50/80">
                    HP {adventurePreview.preview.playerSummary?.hp} / MP {adventurePreview.preview.playerSummary?.mp} / ATK {adventurePreview.preview.playerSummary?.attack}
                  </p>
                </div>
                <div className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-3">
                  <p className="font-semibold text-teal-50">內容</p>
                  <p className="mt-1 text-teal-50/80">裝備 {adventurePreview.preview.equipment?.length || 0} / 消耗品 {adventurePreview.preview.consumables?.length || 0} / 挑戰 {adventurePreview.preview.challenges?.length || 0}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="font-semibold text-white">道具鏈</p>
                  <div className="mt-2 space-y-2">
                    {(adventurePreview.preview.itemChains || []).map((chain) => (
                      <p key={`${chain.challengeRoomId}-${chain.requiredItemId}`} className="text-xs leading-5 text-stone-300">
                        {`${chain.source} -> ${chain.challengeRoomName} 使用 ${chain.requiredItemName}${chain.rewardItemNames?.length ? ` -> ${chain.rewardItemNames.join(", ")}` : ""}`}
                      </p>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={startGeneratedAdventure} disabled={loading} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 disabled:cursor-wait disabled:opacity-60">
                {loading ? "開始中..." : "開始冒險"}
              </button>
              <button type="button" onClick={previewAdventure} disabled={isGeneratingAdventure} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 disabled:cursor-wait disabled:opacity-60">
                重新生成冒險
              </button>
              <button type="button" onClick={() => setStep("character")} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-stone-300">
                回到角色
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
