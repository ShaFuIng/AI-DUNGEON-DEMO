import { useState } from "react";
import { Rnd } from "react-rnd";

export default function FloatingGameWindow({
  title,
  children,
  onClose,
  defaultPosition = { x: 980, y: 120 },
  defaultSize = { width: 420, height: 520 },
}) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const scale = size.width / defaultSize.width;

  return (
    <Rnd
      position={position}
      size={size}
      minWidth={320}
      minHeight={280}
      bounds="window"
      lockAspectRatio={defaultSize.width / defaultSize.height}
      dragHandleClassName="floating-window-title"
      cancel=".floating-window-no-drag"
      enableUserSelectHack={false}
      className="z-[70]"
      onDragStop={(event, data) => {
        setPosition({ x: data.x, y: data.y });
      }}
      onResizeStop={(event, direction, ref, delta, nextPosition) => {
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
        setPosition(nextPosition);
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          style={{
            width: defaultSize.width,
            height: defaultSize.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/20 bg-[#171a1f]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur">
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
        </div>
      </div>
    </Rnd>
  );
}
