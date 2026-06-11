import { useEffect, useState } from "react";

const MODELS = [
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const GENRES = ["奇幻地下城", "蒸氣龐克", "科幻遺跡", "東方玄幻", "暗黑童話", "校園異能"];
const STEPS = [
  { id: "input", label: "冒險設定" },
  { id: "character", label: "角色預覽" },
  { id: "adventure", label: "冒險預覽" },
];

function StatPill({ label, value }) {
  return (
    <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs text-stone-300">
      {label} {value}
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
          <dd>{value}</dd>
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
    "一位擅長觀察與使用道具的年輕冒險者，第一次進入古老遺跡。"
  );
  const [adventurePrompt, setAdventurePrompt] = useState(
    "設計 5 個房間的短篇冒險，包含至少一個需要道具解開的機關、一件 Boss 前可取得的裝備，以及一名守護關鍵物品的 Boss。"
  );
  const [roomCount, setRoomCount] = useState(5);
  const [difficulty, setDifficulty] = useState(4);
  const [characterPreview, setCharacterPreview] = useState(null);
  const [adventurePreview, setAdventurePreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [isGeneratingAdventure, setIsGeneratingAdventure] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("aiDungeonGeminiApiKey") || "");
  }, []);

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
      setCharacterPreview(data.character);
      setAdventurePreview(null);
      setStep("character");
    } catch {
      setPreviewError("角色預覽生成失敗，請調整角色描述或稍後再試。");
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
      setPreviewError("冒險預覽生成失敗，請調整冒險 Prompt 或稍後再試。");
    } finally {
      setIsGeneratingAdventure(false);
    }
  }

  function startGeneratedAdventure() {
    if (!adventurePreview?.state || !adventurePreview?.gameData) {
      setPreviewError("目前沒有可開始的冒險資料，請重新生成冒險預覽。");
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
                    placeholder="貼上 Gemini API key"
                  />
                  <span className="mt-1 block text-xs text-stone-500">API key 只存在 localStorage 與單次 request body。</span>
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
                  <span className="text-sm font-semibold text-stone-200">角色描述</span>
                  <textarea value={characterPrompt} onChange={(event) => setCharacterPrompt(event.target.value)} rows={4} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#101216] px-3 py-3 text-sm leading-6 text-white outline-none" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-stone-200">冒險 Prompt</span>
                  <textarea value={adventurePrompt} onChange={(event) => setAdventurePrompt(event.target.value)} rows={5} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#101216] px-3 py-3 text-sm leading-6 text-white outline-none" />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" disabled={isGeneratingCharacter || !apiKey.trim()} onClick={previewCharacter} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60">
                  {isGeneratingCharacter ? "生成角色中" : "生成角色預覽"}
                </button>
                <button type="button" disabled={loading || isGeneratingCharacter} onClick={onStartDemo} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.08] disabled:cursor-wait disabled:opacity-60">
                  使用預設 Demo
                </button>
              </div>
            </form>

            <aside className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-4 text-sm leading-7 text-teal-50/90">
              <p className="font-mono text-xs uppercase text-teal-200">Generated Adventure</p>
              <p className="mt-3">流程會先生成角色，再用確認後的角色生成可遊玩的短篇冒險。</p>
              <p className="mt-3">冒險預覽成功後，開始冒險會直接使用同一份 preview state/gameData。</p>
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
                      <p className="mt-1 font-mono text-xs text-amber-100/70">{skill.role} / {skill.mpCost} MP / DMG {skill.damage}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-400">{skill.description}</p>
                      <p className="mt-2 text-xs leading-5 text-amber-100/70">{skill.flavorText}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(characterPreview.starterEquipment || characterPreview.equipment || []).map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="mt-1 font-mono text-xs text-stone-400">{item.slot}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-300">{item.description}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-500">{item.flavorText}</p>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="space-y-3">
                <div className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-4">
                  <p className="font-semibold text-teal-50">Appearance</p>
                  <AppearanceList appearance={characterPreview.appearance} />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">Portrait Prompt</p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">{characterPreview.portraitPrompt?.positive || characterPreview.imagePrompt}</p>
                  <p className="mt-3 font-mono text-xs text-red-200/80">{characterPreview.portraitPrompt?.negative}</p>
                </div>
              </aside>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={previewAdventure} disabled={isGeneratingAdventure} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 disabled:cursor-wait disabled:opacity-60">
                {isGeneratingAdventure ? "生成冒險中" : "確認角色，生成冒險"}
              </button>
              <button type="button" onClick={previewCharacter} disabled={isGeneratingCharacter} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 disabled:cursor-wait disabled:opacity-60">
                重新生成角色
              </button>
              <button type="button" onClick={() => setStep("input")} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-stone-300">
                返回設定
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
                  <span>房間</span><span>類型</span><span>敵人/物品</span><span>需求</span><span>獎勵/出口</span>
                </div>
                {adventurePreview.preview.rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-[1.05fr_0.7fr_0.9fr_0.9fr_0.9fr] gap-2 border-b border-white/5 px-3 py-3 text-sm text-stone-200 last:border-b-0">
                    <span>
                      <span className="block font-semibold text-white">{room.name}</span>
                      <span className="mt-1 line-clamp-2 block text-xs text-stone-500">{room.summary}</span>
                    </span>
                    <span className="font-mono text-xs text-amber-100/80">{room.kind}</span>
                    <span className="text-xs text-stone-400">{room.monsterName || room.itemNames.join("、") || "-"}</span>
                    <span className="text-xs text-stone-400">{room.requiredItemName || room.challengeType || "-"}</span>
                    <span className="text-xs text-stone-400">{room.rewardItemNames?.join("、") || room.exits?.join(" / ") || "-"}</span>
                  </div>
                ))}
              </div>
              <aside className="space-y-3 text-sm leading-6">
                <div className="rounded-lg border border-red-200/20 bg-red-400/10 p-3">
                  <p className="font-semibold text-red-50">Boss</p>
                  <p className="mt-1 text-red-50/80">{adventurePreview.preview.boss?.name || "未標示"}</p>
                </div>
                <div className="rounded-lg border border-amber-200/20 bg-amber-300/10 p-3">
                  <p className="font-semibold text-amber-50">玩家摘要</p>
                  <p className="mt-1 text-amber-50/80">
                    HP {adventurePreview.preview.playerSummary?.hp} / MP {adventurePreview.preview.playerSummary?.mp} / ATK {adventurePreview.preview.playerSummary?.attack}
                  </p>
                </div>
                <div className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-3">
                  <p className="font-semibold text-teal-50">內容統計</p>
                  <p className="mt-1 text-teal-50/80">裝備 {adventurePreview.preview.equipment.length} / 消耗品 {adventurePreview.preview.consumables.length} / 挑戰 {adventurePreview.preview.challenges.length}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="font-semibold text-white">Item Chains</p>
                  <div className="mt-2 space-y-2">
                    {(adventurePreview.preview.itemChains || []).map((chain) => (
                      <p key={`${chain.challengeRoomId}-${chain.requiredItemId}`} className="text-xs leading-5 text-stone-300">
                        {`${chain.source} -> ${chain.challengeRoomName} 使用 ${chain.requiredItemName}${chain.rewardItemNames?.length ? ` -> ${chain.rewardItemNames.join("、")}` : ""}`}
                      </p>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={startGeneratedAdventure} disabled={loading} className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 disabled:cursor-wait disabled:opacity-60">
                {loading ? "開始中" : "開始冒險"}
              </button>
              <button type="button" onClick={previewAdventure} disabled={isGeneratingAdventure} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 disabled:cursor-wait disabled:opacity-60">
                重新生成冒險
              </button>
              <button type="button" onClick={() => setStep("character")} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-stone-300">
                返回角色
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
