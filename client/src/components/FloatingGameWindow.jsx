import { Rnd } from "react-rnd";

export default function FloatingGameWindow({
  title,
  children,
  onClose,
  defaultPosition = { x: 980, y: 120 },
  defaultSize = { width: 420, height: 520 },
}) {
  return (
    <Rnd
      default={{
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultSize.width,
        height: defaultSize.height,
      }}
      minWidth={320}
      minHeight={280}
      bounds="window"
      dragHandleClassName="floating-window-title"
      cancel=".floating-window-no-drag"
      enableUserSelectHack={false}
      className="fixed z-[70]"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#171a1f]/95 shadow-2xl shadow-black/60 backdrop-blur">
        <div className="floating-window-title flex cursor-move items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="floating-window-no-drag rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-stone-400 transition hover:border-red-200/40 hover:bg-red-400/10 hover:text-red-100"
          >
            X
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </Rnd>
  );
}
