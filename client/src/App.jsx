import { useCallback, useEffect, useMemo, useState } from "react";
import BattleView from "./components/BattleView.jsx";
import AdventureSetup from "./components/AdventureSetup.jsx";
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

const COMMAND_API = "/api/game/command";
const GENERATE_API = "/api/adventure/generate";

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
    intent: monster.intent || "逼近",
    description: monster.description || "敵人正在逼近。",
  };
}

function isBossEncounter(enemy, currentRoom) {
  return enemy?.id === "ruin_guardian" || currentRoom?.id === "boss_room" || currentRoom?.kind === "boss";
}

function getEncounterType(enemy, currentRoom) {
  return isBossEncounter(enemy, currentRoom) ? "boss" : "normal";
}

function getInventoryItemIds(player) {
  const inventoryItems = player?.inventoryItems || [];

  if (inventoryItems.length > 0 && typeof inventoryItems[0] === "object") {
    return inventoryItems.map((item) => item.id).filter(Boolean);
  }

  return (player?.inventory || []).filter((item) => typeof item === "string");
}

function getVisibleRoomItemIds(gameState) {
  const visibleItems = gameState?.currentRoom?.items || [];
  const itemDetails = gameState?.itemDetails || {};

  return visibleItems
    .map((item) => {
      if (typeof item !== "string") return null;
      if (itemDetails[item]) return item;

      const matched = Object.values(itemDetails).find((detail) => detail?.name === item);
      return matched?.id || null;
    })
    .filter(Boolean);
}

function buildAvailableCommands(gameState) {
  if (!gameState) {
    return ["look", "status", "help", "/help", "reset"];
  }

  if (gameState.mode === "gameOver" || gameState.gameOver || gameState.flags?.gameWon) {
    return ["reset", "status", "help", "/help"];
  }

  if (gameState.mode === "battle") {
    const skillCommands = (gameState.player?.skills || gameState.player?.skillIds || [])
      .map((skill) => {
        const skillId = typeof skill === "string" ? skill : skill?.id;
        return skillId ? `skill ${skillId}` : null;
      })
      .filter(Boolean);
    const commands = [
      "attack",
      ...skillCommands,
      "escape",
      "status",
      "help",
      "/help",
    ];

    const consumableItemIds = getInventoryItemIds(gameState.player).filter(
      (itemId) => gameState.itemDetails?.[itemId]?.type === "consumable"
    );

    for (const itemId of consumableItemIds) {
      commands.splice(Math.max(1, commands.length - 4), 0, `use ${itemId}`);
    }

    return commands;
  }

  const commands = ["look", "status", "help", "/help", "reset"];
  const exits = gameState.currentRoom?.exits || {};

  for (const direction of Object.keys(exits)) {
    commands.push(`move ${direction}`);
  }

  for (const itemId of getVisibleRoomItemIds(gameState)) {
    commands.push(`take ${itemId}`);
  }

  for (const itemId of getInventoryItemIds(gameState.player)) {
    commands.push(`use ${itemId}`);
  }

  if (gameState.currentRoom?.monster) {
    commands.push("battle start");
  }

  if (
    gameState.currentRoom?.id === "boss_room" &&
    gameState.currentRoom?.monster?.id === "ruin_guardian"
  ) {
    commands.push("retreat");
  }

  return [...new Set(commands)];
}

function isUtilityCommand(command) {
  return command === "status" || command === "help" || command === "/help";
}

function isEditableTarget(target) {
  if (!target) return false;

  const tagName = target.tagName?.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable
  );
}

function blurActiveElement() {
  if (isEditableTarget(document.activeElement)) {
    document.activeElement.blur();
  }
}

function VictoryModal({ open, player, flags, onReset, onStay }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg overflow-hidden rounded-lg border border-amber-200/30 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.16),transparent_34%),linear-gradient(145deg,rgba(28,24,18,0.98),rgba(13,18,16,0.98))] shadow-[0_0_0_1px_rgba(255,255,255,0.045),0_24px_70px_rgba(0,0,0,0.68)]">
        <header className="border-b border-white/10 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-wide text-amber-200">
            Victory
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">探索完成</h2>
        </header>

        <div className="space-y-4 px-5 py-5 text-sm leading-7 text-stone-200">
          <p>
            你完成了這次冒險的勝利條件，帶著關鍵收穫回到目標地點。周遭的危險逐漸平息，這段探索宣告完成。
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-amber-100/15 bg-amber-300/10 p-3 text-amber-50">
            <span>等級：Lv. {player?.level ?? 1}</span>
            <span>
              HP / MP：{player?.hp ?? 0}/{player?.maxHp ?? 0} · {player?.mp ?? 0}/
              {player?.maxMp ?? 0}
            </span>
            <span>已擊敗 Boss：{flags?.bossDefeated ? "是" : "否"}</span>
            <span>已取得古代核心：{flags?.hasAncientCore ? "是" : "否"}</span>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/10 bg-black/15 px-5 py-4">
          <button
            type="button"
            onClick={onStay}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.08]"
          >
            停留查看
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-amber-200/35 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25"
          >
            重新開始
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function App() {
  const [setupComplete, setSetupComplete] = useState(false);
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
  const [pendingEncounterType, setPendingEncounterType] = useState("normal");
  const [lastEncounterMonsterId, setLastEncounterMonsterId] = useState(null);
  const [dismissedBossEncounterId, setDismissedBossEncounterId] = useState(null);
  const [victoryModalDismissed, setVictoryModalDismissed] = useState(false);
  const [commandFocusToken, setCommandFocusToken] = useState(0);

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
  const isVictory = Boolean(gameState?.flags?.gameWon);
  const showBattleView = isBattle || (isGameOver && gameState?.battle?.status === "defeat");
  const availableCommands = useMemo(
    () => buildAvailableCommands(gameState),
    [gameState],
  );

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
        createStoryLine("story", state.currentRoom?.description || "你醒來，四周一片寂靜。"),
      ]);
    } catch (loadError) {
      setError("無法載入遊戲狀態，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }, []);

  async function startDefaultDemo() {
    setLoading(true);
    setError("");

    try {
      const resetResponse = await fetch("/api/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "default" }),
      });
      const dataResponse = await fetch("/api/game-data");

      if (!resetResponse.ok || !dataResponse.ok) {
        throw new Error("demo_start_failed");
      }

      const [state, data] = await Promise.all([
        resetResponse.json(),
        dataResponse.json(),
      ]);

      setGameState(state);
      setGameData(data);
      setSetupComplete(true);
      setStoryLines([
        createStoryLine("system", "已載入預設 Demo。"),
        createStoryLine("story", state.currentRoom?.description || "你醒來，四周一片寂靜。"),
      ]);
    } catch (startError) {
      setError("無法啟動預設 Demo，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  async function generateAdventure(payload) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(GENERATE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "generation_failed");
      }

      setGameState(data.state);
      setGameData(data.gameData);
      setSetupComplete(true);
      setStoryLines([
        createStoryLine("system", data.generationSummary || "新冒險已生成。"),
        createStoryLine("story", data.state?.currentRoom?.description || "新的冒險開始了。"),
      ]);
    } catch (generateError) {
      setError("冒險生成失敗，請調整 prompt 或使用預設 Demo。");
    } finally {
      setLoading(false);
    }
  }

  function openEncounterForEnemy(enemy, state = gameState, { force = false } = {}) {
    if (!enemy) {
      return false;
    }

    const encounterType = getEncounterType(enemy, state?.currentRoom);

    if (
      encounterType === "boss" &&
      !force &&
      dismissedBossEncounterId === enemy.id
    ) {
      return false;
    }

    setPendingEncounterEnemy(enemy);
    setPendingEncounterType(encounterType);
    setEncounterOpen(true);
    return true;
  }

  async function sendCommand(command) {
    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
      return;
    }

    if (normalizedCommand === "encounter") {
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("command", normalizedCommand),
        createStoryLine(
          "system",
          currentRoomEnemy
            ? "你感受到敵意逼近。"
            : "此處沒有未擊敗的敵人，無法進入戰鬥。",
        ),
      ]);

      if (currentRoomEnemy) {
        openEncounterForEnemy(currentRoomEnemy, gameState, { force: true });
      }

      return;
    }

    setLoading(true);
    setError("");
    if (!isUtilityCommand(normalizedCommand)) {
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("command", normalizedCommand),
      ]);
    }

    try {
      const response = await fetch(COMMAND_API, {
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
        data.narration || data.eventResult?.message || "指令已處理。";

      setGameState(data.state);
      setStoryLines((lines) => [
        ...lines,
        createStoryLine(
          isUtilityCommand(normalizedCommand) ? "system" : "story",
          nextStoryText
        ),
      ]);

      if (data.eventResult?.type === "reset") {
        setEncounterOpen(false);
        setPendingEncounterEnemy(null);
        setPendingEncounterType("normal");
        setLastEncounterMonsterId(null);
        setDismissedBossEncounterId(null);
        setVictoryModalDismissed(false);
        return;
      }

      const encounteredEnemy = normalizeEnemy(data.state?.currentRoom?.monster);

      if (data.state?.mode === "battle") {
        setEncounterOpen(false);
        setPendingEncounterEnemy(null);
        setPendingEncounterType("normal");
        setDismissedBossEncounterId(null);
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
        const opened = openEncounterForEnemy(encounteredEnemy, data.state);
        if (opened) {
          setLastEncounterMonsterId(encounteredEnemy.id);
        }
      }
    } catch (commandError) {
      setError("指令送出失敗，請稍後再試。");
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("system", "指令送出失敗，請稍後再試。"),
      ]);
    } finally {
      setLoading(false);
      setCommandFocusToken((token) => token + 1);
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
      setPendingEncounterType("normal");
      return;
    }

    setEncounterOpen(false);
    setPendingEncounterEnemy(null);
    setPendingEncounterType("normal");
    sendCommand("battle start");
  }

  async function handleBossRetreatFromModal() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(COMMAND_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: "retreat" }),
      });

      if (!response.ok) {
        throw new Error("retreat_failed");
      }

      const data = await response.json();
      const retreatText =
        data.narration || data.eventResult?.message || "你暫時撤離了核心密室。";

      setGameState(data.state);
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("story", retreatText),
      ]);
    } catch (retreatError) {
      setError("撤退失敗，請稍後再試。");
      setStoryLines((lines) => [
        ...lines,
        createStoryLine("system", "撤退失敗，請稍後再試。"),
      ]);
    } finally {
      setLoading(false);
    }
  }

  function cancelEncounter() {
    if (pendingEncounterType === "boss" && pendingEncounterEnemy?.id) {
      setDismissedBossEncounterId(pendingEncounterEnemy.id);
      setEncounterOpen(false);
      setPendingEncounterEnemy(null);
      setPendingEncounterType("normal");
      handleBossRetreatFromModal();
      return;
    }

    setEncounterOpen(false);
    setPendingEncounterEnemy(null);
    setPendingEncounterType("normal");
  }

  async function handleBattleAction(command) {
    if (loading || isGameOver) return;
    sendCommand(command);
  }

  useEffect(() => {
    if (setupComplete && !gameState) {
      loadGameState();
    }
  }, [gameState, loadGameState, setupComplete]);

  useEffect(() => {
    if (!isVictory) {
      setVictoryModalDismissed(false);
    }
  }, [isVictory]);

  useEffect(() => {
    if (gameState?.currentRoom?.kind !== "boss" && gameState?.currentRoom?.id !== "boss_room") {
      setDismissedBossEncounterId(null);
      setLastEncounterMonsterId((monsterId) =>
        monsterId === "ruin_guardian" ? null : monsterId
      );
    }
  }, [gameState?.currentRoom?.id, gameState?.currentRoom?.kind]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        const openWindowKey = Object.keys(openWindows).find(
          (key) => openWindows[key]
        );

        if (openWindowKey) {
          closeWindow(openWindowKey);
          return;
        }

        setQuickActionsOpen((open) => !open);
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const hotkeys = {
        e: "equipment",
        b: "inventory",
        s: "skills",
      };
      const windowType = hotkeys[key];

      if (windowType) {
        event.preventDefault();
        setOpenWindows((windows) => ({
          ...windows,
          [windowType]: !windows[windowType],
        }));
        blurActiveElement();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openWindows]);

  if (!setupComplete) {
    return (
      <AdventureSetup
        loading={loading}
        error={error}
        onStartDemo={startDefaultDemo}
        onGenerate={generateAdventure}
      />
    );
  }

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
              {loading ? "處理中" : "待命"}
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
                skills={gameState?.player?.skills || []}
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
              disabled={false}
              availableCommands={availableCommands}
              focusToken={commandFocusToken}
              placeholder={
                isBattle
                  ? "/help / attack / escape"
                  : isGameOver
                    ? "reset"
                    : "/help / look / status / Tab 補全"
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
          <EquipmentWindowContent equipmentItems={gameState?.player?.equipmentItems || []} />
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
          <SkillsWindowContent
            skills={gameState?.player?.skills || []}
            loading={loading}
            onAction={sendCommand}
          />
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
        variant={pendingEncounterType}
        canCancel={pendingEncounterType === "boss"}
        onConfirm={confirmEncounter}
        onCancel={cancelEncounter}
      />
      <VictoryModal
        open={isVictory && !victoryModalDismissed}
        player={gameState?.player}
        flags={gameState?.flags}
        onReset={() => {
          setVictoryModalDismissed(true);
          sendCommand("reset");
        }}
        onStay={() => setVictoryModalDismissed(true)}
      />
    </main>
  );
}
