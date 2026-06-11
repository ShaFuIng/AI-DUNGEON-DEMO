import { useCallback, useEffect, useMemo, useState } from "react";
import BattleView from "./components/BattleView.jsx";
import CharacterPanel from "./components/CharacterPanel.jsx";
import CharacterSideTabs from "./components/CharacterSideTabs.jsx";
import EncounterModal from "./components/EncounterModal.jsx";
import FloatingGameWindow from "./components/FloatingGameWindow.jsx";
import MapView from "./components/MapView.jsx";
import QuickActionsModal from "./components/QuickActionsModal.jsx";
import StoryCommandPanel from "./components/StoryCommandPanel.jsx";
import EquipmentWindowContent from "./components/windowContents/EquipmentWindowContent.jsx";
import InventoryWindowContent from "./components/windowContents/InventoryWindowContent.jsx";
import SkillsWindowContent from "./components/windowContents/SkillsWindowContent.jsx";

function createStoryLine(type, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    text,
  };
}

function normalizeEnemy(monster) {
  if (!monster) {
    return null;
  }

  return {
    id: monster.id,
    name: monster.name || monster.id || "未知敵人",
    level: monster.level ?? 1,
    hp: monster.hp ?? monster.maxHp ?? 1,
    maxHp: monster.maxHp ?? monster.hp ?? 1,
    attack: monster.attack ?? 0,
    intent: monster.intent || "準備攻擊",
    description: monster.description || "敵人擋住了你的去路。",
  };
}

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [storyLines, setStoryLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openWindows, setOpenWindows] = useState({
    equipment: false,
    inventory: false,
    skills: false,
  });
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [encounterOpen, setEncounterOpen] = useState(false);
  const [pendingEncounterEnemy, setPendingEncounterEnemy] = useState(null);
  const [lastEncounterMonsterId, setLastEncounterMonsterId] = useState(null);

  const roomsById = useMemo(() => gameData?.rooms || {}, [gameData]);
  const currentRoomEnemy = useMemo(
    () => normalizeEnemy(gameState?.currentRoom?.monster),
    [gameState],
  );
  const battleEnemy = useMemo(
    () => normalizeEnemy(gameState?.activeMonster || gameState?.currentRoom?.monster),
    [gameState],
  );
  const isBattle = gameState?.mode === "battle";
  const isGameOver = gameState?.mode === "gameOver" || gameState?.gameOver;
  const showBattleView = isBattle || (isGameOver && gameState?.battle?.status === "defeat");

  const loadGameState = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [stateResponse, dataResponse] = await Promise.all([
        fetch("/api/state"),
        fetch("/api/game-data"),
      ]);

      if (!stateResponse.ok || !dataResponse.ok) {
        throw new Error("load_failed");
      }

      const [state, data] = await Promise.all([
        stateResponse.json(),
        dataResponse.json(),
      ]);

      setGameState(state);
      setGameData(data);
      setStoryLines([
        createStoryLine("system", "遊戲狀態已載入。"),
        createStoryLine("story", state.currentRoom?.description || "冒險開始。"),
      ]);
    } catch (loadError) {
      setError("無法載入遊戲狀態，請確認後端伺服器已啟動。");
    } finally {
      setLoading(false);
    }
  }, []);

  async function sendCommand(command) {
    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("system", "請輸入指令。"),
      ]);
      return;
    }

    if (normalizedCommand === "encounter") {
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("command", normalizedCommand),
        createStoryLine(
          "system",
          currentRoomEnemy
            ? "你感受到某種敵意正在逼近。"
            : "此處沒有未擊敗的敵人，無法進入戰鬥。",
        ),
      ]);

      if (currentRoomEnemy) {
        setPendingEncounterEnemy(currentRoomEnemy);
        setEncounterOpen(true);
      }

      return;
    }

    setLoading(true);
    setError("");
    setStoryLines((lines) => [
      ...lines,
      createStoryLine("command", normalizedCommand),
    ]);

    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: normalizedCommand }),
      });

      if (!response.ok) {
        throw new Error("command_failed");
      }

      const data = await response.json();
      const nextStoryText =
        data.narration || data.eventResult?.message || "指令已執行。";

      setGameState(data.state);
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("story", nextStoryText),
      ]);

      if (data.eventResult?.type === "reset") {
        setEncounterOpen(false);
        setPendingEncounterEnemy(null);
        setLastEncounterMonsterId(null);
        return;
      }

      const encounteredEnemy = normalizeEnemy(data.state?.currentRoom?.monster);

      if (data.state?.mode === "battle") {
        setEncounterOpen(false);
        setPendingEncounterEnemy(null);
        setLastEncounterMonsterId(data.state.activeMonsterId || encounteredEnemy?.id || null);
        return;
      }

      if (data.eventResult?.type === "escape_success" && encounteredEnemy) {
        setLastEncounterMonsterId(encounteredEnemy.id);
        return;
      }

      if (!encounteredEnemy) {
        setLastEncounterMonsterId(null);
      }

      if (
        encounteredEnemy &&
        data.state?.mode === "explore" &&
        !encounterOpen &&
        encounteredEnemy.id !== lastEncounterMonsterId
      ) {
        setPendingEncounterEnemy(encounteredEnemy);
        setLastEncounterMonsterId(encounteredEnemy.id);
        setEncounterOpen(true);
      }
    } catch (commandError) {
      setError("指令送出失敗，請稍後再試。");
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("system", "指令送出失敗。"),
      ]);
    } finally {
      setLoading(false);
    }
  }

  function openWindow(windowType) {
    setOpenWindows((windows) => ({
      ...windows,
      [windowType]: true,
    }));
  }

  function closeWindow(windowType) {
    setOpenWindows((windows) => ({
      ...windows,
      [windowType]: false,
    }));
  }

  function confirmEncounter() {
    const enemy = pendingEncounterEnemy || currentRoomEnemy;

    if (!enemy) {
      setEncounterOpen(false);
      setPendingEncounterEnemy(null);
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("system", "此處沒有未擊敗的敵人，無法進入戰鬥。"),
      ]);
      return;
    }

    setEncounterOpen(false);
    setPendingEncounterEnemy(null);
    sendCommand("battle start");
  }

  function cancelEncounter() {
    setEncounterOpen(false);
    setPendingEncounterEnemy(null);
  }

  async function handleBattleAction(command) {
    if (loading || isGameOver) return;
    sendCommand(command);
  }

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuickActionsOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-[#15120f] text-stone-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.22),transparent_32%),radial-gradient(circle_at_84%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#18130f_0%,#202129_46%,#0e1512_100%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1450px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase text-amber-300">
              Ancient Ruins
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              AI Dungeon Demo
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-300">
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1">
              {gameState?.flags?.gameWon ? "探索完成" : "探索中"}
            </span>
            <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1">
              {loading ? "同步中" : "即時狀態"}
            </span>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-300/40 bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-h-0 flex-col gap-4">
            {showBattleView ? (
              <BattleView
                player={gameState?.player}
                enemy={battleEnemy}
                battle={gameState?.battle}
                mode={gameState?.mode}
                loading={loading}
                gameOver={isGameOver}
                onAction={handleBattleAction}
              />
            ) : (
              <MapView
                currentRoom={gameState?.currentRoom}
                player={gameState?.player}
                roomsById={roomsById}
                logs={gameState?.log || []}
                loading={loading}
                onMove={sendCommand}
              />
            )}
            <StoryCommandPanel
              storyLines={storyLines}
              loading={loading}
              disabled={isBattle}
              placeholder={
                isBattle
                  ? "戰鬥中請使用上方戰鬥按鈕"
                  : isGameOver
                    ? "reset"
                    : "look / status / battle start / reset"
              }
              onSubmit={sendCommand}
              className="h-[420px]"
            />
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <div className="relative flex min-h-[760px] overflow-visible">
              <CharacterPanel
                player={gameState?.player}
                flags={gameState?.flags}
                className="w-full"
              />
              <CharacterSideTabs
                openWindows={openWindows}
                onOpenWindow={openWindow}
              />
            </div>
          </div>
        </section>
      </div>

      {openWindows.equipment ? (
        <FloatingGameWindow
          title="裝備"
          onClose={() => closeWindow("equipment")}
          defaultPosition={{ x: 980, y: 120 }}
          defaultSize={{ width: 420, height: 420 }}
        >
          <EquipmentWindowContent />
        </FloatingGameWindow>
      ) : null}

      {openWindows.inventory ? (
        <FloatingGameWindow
          title="背包"
          onClose={() => closeWindow("inventory")}
          defaultPosition={{ x: 960, y: 140 }}
          defaultSize={{ width: 460, height: 560 }}
        >
          <InventoryWindowContent
            inventory={gameState?.player?.inventoryItems || gameState?.player?.inventory || []}
            itemDetails={gameState?.itemDetails || {}}
            loading={loading}
            onAction={sendCommand}
          />
        </FloatingGameWindow>
      ) : null}

      {openWindows.skills ? (
        <FloatingGameWindow
          title="技能"
          onClose={() => closeWindow("skills")}
          defaultPosition={{ x: 940, y: 160 }}
          defaultSize={{ width: 480, height: 560 }}
        >
          <SkillsWindowContent loading={loading} onAction={sendCommand} />
        </FloatingGameWindow>
      ) : null}

      <QuickActionsModal
        open={quickActionsOpen}
        loading={loading}
        onAction={sendCommand}
        onClose={() => setQuickActionsOpen(false)}
      />
      <EncounterModal
        open={encounterOpen}
        enemy={pendingEncounterEnemy || currentRoomEnemy}
        onConfirm={confirmEncounter}
        onCancel={cancelEncounter}
      />
    </main>
  );
}
