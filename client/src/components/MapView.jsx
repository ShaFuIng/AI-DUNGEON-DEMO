const DIRECTIONS = [
  { id: "north", label: "北", className: "col-start-2 row-start-1" },
  { id: "west", label: "西", className: "col-start-1 row-start-2" },
  { id: "east", label: "東", className: "col-start-3 row-start-2" },
  { id: "south", label: "南", className: "col-start-2 row-start-3" },
];

function ExitButton({ direction, exitRoomId, exitRoom, loading, onMove }) {
  if (!exitRoomId) {
    return (
      <div
        className={`${direction.className} flex min-h-28 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-center text-stone-500`}
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
      className={`${direction.className} group flex min-h-28 flex-col items-center justify-center rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 text-center transition hover:border-amber-200 hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-60`}
    >
      <span className="text-sm font-semibold text-amber-200">{direction.label}</span>
      <span className="mt-2 text-base font-semibold text-white">
        {exitRoom?.name || exitRoomId}
      </span>
      <span className="mt-1 font-mono text-[11px] uppercase text-amber-100/65">
        move {direction.id}
      </span>
    </button>
  );
}

export default function MapView({ currentRoom, player, roomsById, loading, onMove }) {
  const exits = currentRoom?.exits || {};

  return (
    <section className="flex flex-1 flex-col rounded-lg border border-white/10 bg-[#191714]/90 p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase text-teal-200">
            Map
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {currentRoom?.name || "載入中"}
          </h2>
          <p className="mt-1 font-mono text-xs text-stone-400">
            {player?.currentRoomId || currentRoom?.id || "..."}
          </p>
        </div>
        {currentRoom?.monster ? (
          <div className="rounded-lg border border-red-300/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <div className="font-semibold">{currentRoom.monster.name}</div>
            <div className="mt-1 font-mono text-xs">
              HP {currentRoom.monster.hp}/{currentRoom.monster.maxHp}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid min-h-[360px] flex-1 grid-cols-3 grid-rows-3 gap-3">
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

        <div className="col-start-2 row-start-2 flex min-h-36 flex-col items-center justify-center rounded-lg border border-teal-200/30 bg-teal-300/10 p-4 text-center shadow-ember">
          <span className="text-xs font-semibold uppercase text-teal-100">
            Current Room
          </span>
          <span className="mt-3 text-xl font-semibold text-white">
            {currentRoom?.name || "未知房間"}
          </span>
          <span className="mt-3 line-clamp-3 text-sm leading-6 text-stone-300">
            {currentRoom?.description || "正在讀取場景資訊。"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase text-stone-400">
            Items
          </p>
          <p className="mt-2 text-sm text-stone-200">
            {currentRoom?.items?.length ? currentRoom.items.join("、") : "無可拾取道具"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase text-stone-400">
            Exits
          </p>
          <p className="mt-2 text-sm text-stone-200">
            {Object.keys(exits).length ? Object.keys(exits).join("、") : "無出口"}
          </p>
        </div>
      </div>
    </section>
  );
}
