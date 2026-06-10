import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function normalizeEnemyFromState(state) {
  const monster = state?.currentRoom?.monster;

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
  const [battleMode, setBattleMode] = useState(false);
  const [encounterOpen, setEncounterOpen] = useState(false);
  const [activeEnemy, setActiveEnemy] = useState(null);
  const [pendingEncounterEnemy, setPendingEncounterEnemy] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [battleTurn, setBattleTurn] = useState(1);
  const [battleEnding, setBattleEnding] = useState(false);
  const [lastEncounterMonsterId, setLastEncounterMonsterId] = useState(null);
  const battleEndTimerRef = useRef(null);

  const roomsById = useMemo(() => gameData?.rooms || {}, [gameData]);
  const currentEnemy = useMemo(() => normalizeEnemyFromState(gameState), [gameState]);

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
      const roomEnemy = normalizeEnemyFromState(gameState);

      setStoryLines((lines) => [
        ...lines,
        createStoryLine("command", normalizedCommand),
        createStoryLine(
          "system",
          roomEnemy
            ? "你感受到某種敵意正在逼近。"
            : "此處沒有未擊敗的敵人，無法進入戰鬥。",
        ),
      ]);

      if (roomEnemy) {
        setPendingEncounterEnemy(roomEnemy);
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
        exitBattle();
        setLastEncounterMonsterId(null);
        return;
      }

      const encounteredEnemy = normalizeEnemyFromState(data.state);

      if (!encounteredEnemy && !battleMode) {
        setLastEncounterMonsterId(null);
      }

      if (
        encounteredEnemy &&
        !battleMode &&
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
    const enemy = pendingEncounterEnemy || normalizeEnemyFromState(gameState);

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
    setActiveEnemy(enemy);
    setPendingEncounterEnemy(null);
    setBattleTurn(1);
    setBattleEnding(false);
    setBattleLog([
      `${enemy.name} 擋住了你的去路。`,
      "戰鬥開始，請選擇你的行動。",
    ]);
    setBattleMode(true);
  }

  function cancelEncounter() {
    setEncounterOpen(false);
    setPendingEncounterEnemy(null);
  }

  function exitBattle() {
    setBattleMode(false);
    setActiveEnemy(null);
    setPendingEncounterEnemy(null);
    setBattleLog([]);
    setBattleTurn(1);
    setBattleEnding(false);
    if (battleEndTimerRef.current) {
      window.clearTimeout(battleEndTimerRef.current);
      battleEndTimerRef.current = null;
    }
  }

  function finishBattleWithEscape(nextStoryText) {
    setBattleMode(false);
    setActiveEnemy(null);
    setPendingEncounterEnemy(null);
    setBattleLog([]);
    setBattleTurn(1);
    setBattleEnding(false);

    setStoryLines((lines) => [
      ...lines,
      createStoryLine("story", nextStoryText),
      createStoryLine("system", "你暫時脫離戰鬥，回到探索狀態。"),
    ]);
  }

  function finishBattleWithVictory(nextStoryText) {
    setBattleEnding(true);

    if (battleEndTimerRef.current) {
      window.clearTimeout(battleEndTimerRef.current);
    }

    battleEndTimerRef.current = window.setTimeout(() => {
      setBattleMode(false);
      setActiveEnemy(null);
      setPendingEncounterEnemy(null);
      setBattleLog([]);
      setBattleEnding(false);
      setBattleTurn(1);
      setLastEncounterMonsterId(null);
      battleEndTimerRef.current = null;

      setStoryLines((lines) => [
        ...lines,
        createStoryLine("story", nextStoryText),
        createStoryLine("system", "戰鬥勝利，你回到探索狀態。"),
      ]);
    }, 1200);
  }

  async function handleBattleAction(command) {
    if (loading || battleEnding) return;

    setLoading(true);
    setError("");
    setBattleLog((logs) => [...logs, `> ${command}`].slice(-6));

    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        throw new Error("battle_command_failed");
      }

      const data = await response.json();
      const nextStoryText =
        data.narration || data.eventResult?.message || "指令已執行。";
      const messageLines = data.eventResult?.message
        ? String(data.eventResult.message).split("\n")
        : [nextStoryText];

      setGameState(data.state);
      setBattleLog((logs) => [...logs, ...messageLines].slice(-6));

      if (data.eventResult?.type === "escape_success") {
        finishBattleWithEscape(nextStoryText);
        return;
      }

      const nextEnemy = normalizeEnemyFromState(data.state);

      if (nextEnemy) {
        setActiveEnemy(nextEnemy);
        setBattleTurn((turn) => turn + 1);
        return;
      }

      const defeated =
        data.eventResult?.type === "monster_defeated" ||
        (data.eventResult?.type !== "no_monster" && !nextEnemy);

      if (defeated) {
        setBattleLog((logs) =>
          [...logs, "戰鬥結束，你回到探索狀態。"].slice(-6),
        );
        finishBattleWithVictory(nextStoryText);
      }
    } catch (battleError) {
      setError("戰鬥指令送出失敗，請稍後再試。");
      setBattleLog((logs) => [...logs, "戰鬥指令送出失敗。"].slice(-6));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  useEffect(() => {
    return () => {
      if (battleEndTimerRef.current) {
        window.clearTimeout(battleEndTimerRef.current);
      }
    };
  }, []);

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
            {battleMode ? (
              <BattleView
                player={gameState?.player}
                enemy={activeEnemy || currentEnemy}
                battleLog={battleLog}
                loading={loading || battleEnding}
                turn={battleTurn}
                battleEnding={battleEnding}
                gameOver={gameState?.flags?.gameOver}
                onAction={handleBattleAction}
                onExitBattle={exitBattle}
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
              disabled={battleMode}
              placeholder={
                battleMode
                  ? "戰鬥中請使用上方戰鬥按鈕"
                  : "look / status / attack / skill fireball / reset"
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
            inventory={gameState?.player?.inventory || []}
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
        enemy={pendingEncounterEnemy || activeEnemy || currentEnemy}
        onConfirm={confirmEncounter}
        onCancel={cancelEncounter}
      />
    </main>
  );
}
