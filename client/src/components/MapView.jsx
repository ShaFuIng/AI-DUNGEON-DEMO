import { useRef, useState } from "react";
import MissionLogOverlay from "./MissionLogOverlay.jsx";

const DIRECTIONS = [
  { id: "north", label: "北", className: "col-start-2 row-start-1" },
  { id: "west", label: "西", className: "col-start-1 row-start-2" },
  { id: "east", label: "東", className: "col-start-3 row-start-2" },
  { id: "south", label: "南", className: "col-start-2 row-start-3" },
];

function RoomNameWithTooltip({ name, description, align = "center", className = "" }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  function handleMouseEnter() {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, 700);
  }

  function handleMouseLeave() {
    window.clearTimeout(timerRef.current);
    setVisible(false);
  }

  const alignClass =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span
      className={`relative inline-flex max-w-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="max-w-full cursor-pointer truncate border-b border-dashed border-white/25 pb-0.5">
        {name || "未知房間"}
      </span>

      {visible ? (
        <span
          className={`pointer-events-none absolute top-full z-50 mt-3 w-72 max-w-[min(18rem,70vw)] rounded-lg border border-amber-200/30 bg-[#11100e] p-3 text-left text-sm font-normal leading-6 text-stone-100 shadow-2xl shadow-black/50 ${alignClass}`}
        >
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-amber-200">
            Room Description
          </span>
          {description || "沒有描述。"}
        </span>
      ) : null}
    </span>
  );
}

function ExitButton({ direction, exitRoomId, exitRoom, loading, onMove }) {
  if (!exitRoomId) {
    return (
      <div
        className={`${direction.className} flex min-h-0 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-center text-stone-500`}
      >
        <span className="text-sm font-semibold">{direction.label}</span>
        <span className="mt-1 text-xs">封閉</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onMove(`move ${direction.id}`)}
      className={`${direction.className} group flex min-h-0 flex-col items-center justify-center rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 text-center transition hover:border-amber-200 hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-60`}
    >
      <span className="text-sm font-semibold text-amber-200">{direction.label}</span>
      <span className="mt-2 max-w-full text-base font-semibold text-white">
        <RoomNameWithTooltip
          name={exitRoom?.name || exitRoomId}
          description={exitRoom?.description}
        />
      </span>
      <span className="mt-1 font-mono text-[11px] uppercase text-amber-100/65">
        move {direction.id}
      </span>
    </button>
  );
}

export default function MapView({ currentRoom, player, roomsById, logs = [], loading, onMove }) {
  const exits = currentRoom?.exits || {};
  const exitDirections = Object.keys(exits);

  return (
    <section className="relative overflow-visible rounded-lg border border-white/10 bg-[#191714]/90 p-4 shadow-panel backdrop-blur">
      <MissionLogOverlay logs={logs} />

      <div className="pointer-events-auto absolute left-4 top-4 z-10">
        <h2 className="max-w-full text-2xl font-semibold text-white">
          <RoomNameWithTooltip
            name={currentRoom?.name || "載入中"}
            description={currentRoom?.description}
            align="left"
          />
        </h2>
      </div>

      <div className="mx-auto grid h-[360px] w-full max-w-[480px] grid-cols-3 grid-rows-3 gap-3">
        {DIRECTIONS.map((direction) => {
          const exitRoomId = exits[direction.id];
          return (
            <ExitButton
              key={direction.id}
              direction={direction}
              exitRoomId={exitRoomId}
              exitRoom={roomsById[exitRoomId]}
              loading={loading}
              onMove={onMove}
            />
          );
        })}

        <div className="col-start-2 row-start-2 flex min-h-0 flex-col items-center justify-center rounded-lg border border-teal-200/30 bg-teal-300/10 p-4 text-center shadow-ember">
          <span className="text-xs font-semibold uppercase text-teal-100">
            Current Room
          </span>
          <span className="mt-3 max-w-full text-xl font-semibold text-white">
            <RoomNameWithTooltip
              name={currentRoom?.name || "未知房間"}
              description={currentRoom?.description}
            />
          </span>
          <span className="mt-3 font-mono text-xs uppercase text-teal-100/60">
            {player?.currentRoomId || currentRoom?.id || "unknown"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end text-xs text-stone-400">
        可移動方向：{exitDirections.length ? exitDirections.join("、") : "無"}
      </div>
    </section>
  );
}
