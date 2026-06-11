import { useEffect, useState } from "react";

const MODELS = [
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const GENRES = ["奇幻遺跡", "賽博龐克", "黑暗童話", "蒸氣龐克", "校園怪談", "太空歌劇"];

export default function AdventureSetup({ loading, error, onStartDemo, onGenerate }) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [genre, setGenre] = useState(GENRES[0]);
  const [characterPrompt, setCharacterPrompt] = useState(
    "一位背負龍印的年輕冒險者，擅長近戰，也能用記憶火花保護自己。"
  );
  const [adventurePrompt, setAdventurePrompt] = useState(
    "生成 5 個房間的短篇地下城：要有補血道具、關鍵任務物品、至少一個普通怪物、一個 Boss，以及能返回起點完成任務的勝利條件。"
  );
  const [roomCount, setRoomCount] = useState(5);
  const [difficulty, setDifficulty] = useState(4);

  useEffect(() => {
    setApiKey(localStorage.getItem("aiDungeonGeminiApiKey") || "");
  }, []);

  function handleApiKeyChange(event) {
    const nextApiKey = event.target.value;
    setApiKey(nextApiKey);
    localStorage.setItem("aiDungeonGeminiApiKey", nextApiKey);
  }

  function handleGenerate(event) {
    event.preventDefault();
    onGenerate({
      apiKey,
      model,
      genre,
      characterPrompt,
      adventurePrompt,
      roomCount: Number(roomCount),
      difficulty: Number(difficulty),
    });
  }

  return (
    <main className="min-h-screen bg-[#15120f] text-stone-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_10%,rgba(245,158,11,0.22),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.2),transparent_28%),linear-gradient(135deg,#18130f_0%,#202129_48%,#0e1512_100%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-5">
          <p className="font-mono text-xs uppercase text-amber-300">Adventure Setup</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            AI Dungeon Demo
          </h1>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-300/40 bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form
            onSubmit={handleGenerate}
            className="rounded-lg border border-white/10 bg-black/20 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.38)] sm:p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-stone-200">Gemini API Key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-amber-200/70 focus:ring-2 focus:ring-amber-200/15"
                  placeholder="貼上你的 Gemini API key"
                />
                <span className="mt-1 block text-xs text-stone-500">
                  只存在這台瀏覽器的 localStorage，不會寫入 repo。
                </span>
              </label>

              <label>
                <span className="text-sm font-semibold text-stone-200">模型</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none focus:border-amber-200/70"
                >
                  {MODELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold text-stone-200">風格</span>
                <select
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none focus:border-amber-200/70"
                >
                  {GENRES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold text-stone-200">房間數</span>
                <input
                  type="number"
                  min="4"
                  max="8"
                  value={roomCount}
                  onChange={(event) => setRoomCount(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none focus:border-amber-200/70"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-stone-200">難度</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#101216] px-3 text-sm text-white outline-none focus:border-amber-200/70"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-stone-200">角色設定</span>
                <textarea
                  value={characterPrompt}
                  onChange={(event) => setCharacterPrompt(event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#101216] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-amber-200/70"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-stone-200">冒險 Prompt</span>
                <textarea
                  value={adventurePrompt}
                  onChange={(event) => setAdventurePrompt(event.target.value)}
                  rows={5}
                  className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#101216] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-amber-200/70"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "生成中" : "生成新冒險"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onStartDemo}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.08] disabled:cursor-wait disabled:opacity-60"
              >
                使用預設 Demo
              </button>
            </div>
          </form>

          <aside className="rounded-lg border border-teal-200/20 bg-teal-300/10 p-4 text-sm leading-7 text-teal-50/90">
            <p className="font-mono text-xs uppercase text-teal-200">Generated Adventure</p>
            <p className="mt-3">
              生成流程會建立 runtime gameData、初始化角色狀態，並直接進入遊戲畫面。
            </p>
            <p className="mt-3">
              若生成或驗證失敗，系統會保留預設 Demo，不會覆蓋 `data/gameData.js`。
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
