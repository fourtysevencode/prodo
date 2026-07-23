import React, { useState, useRef, useEffect } from "react";
import { useFocus } from "../context/FocusContext";

/**
 * Draggable Tester Mode Control Panel Component.
 * Appears at bottom-right of screen for tester sessions.
 * Allows adding or removing 100 XP live.
 */
export const TesterWidget: React.FC = () => {
  const { adjustXp, xp, isTester } = useFocus();
  
  // Dragging position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isTester) return null;

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      className="fixed bottom-6 right-6 z-50 bg-[#121212] border-2 border-amber shadow-2xl p-4 w-64 select-none cursor-move flex flex-col gap-3"
      onMouseDown={handleMouseDown}
    >
      {/* Widget Header Handle */}
      <div className="flex items-center justify-between border-b border-surface-variant pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber animate-ping"></span>
          <span className="font-technical-prefix text-[10px] text-amber font-bold uppercase tracking-wider">
            TESTER MODE TOOLS
          </span>
        </div>
        <span className="material-symbols-outlined text-outline-variant text-[14px]">drag_indicator</span>
      </div>

      {/* Balance Indicator */}
      <div className="flex justify-between items-center bg-background px-3 py-1.5 border border-outline-variant">
        <span className="font-technical-prefix text-[9px] text-outline-variant uppercase">CURRENT XP</span>
        <span className="font-value-lg text-sm text-primary">{xp.toLocaleString()} XP</span>
      </div>

      {/* XP Controls */}
      <div className="grid grid-cols-2 gap-2" onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => adjustXp(100)}
          className="py-2 bg-emerald/20 border border-emerald text-emerald hover:bg-emerald/30 font-technical-prefix text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">add_circle</span>
          +100 XP
        </button>

        <button
          onClick={() => adjustXp(-100)}
          className="py-2 bg-crimson/20 border border-crimson text-crimson hover:bg-crimson/30 font-technical-prefix text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">remove_circle</span>
          -100 XP
        </button>
      </div>

      <div className="font-technical-prefix text-[7px] text-outline-variant text-center opacity-60">
        DRAG HEADER TO REPOSITION
      </div>
    </div>
  );
};
