import React, { useRef, useState, useEffect } from "react";
import { useWindowManager, WindowState } from "./useWindowManager";
import { Button } from "~/components/ui/button";

export function Window({ window: win, children }: { window: WindowState; children: React.ReactNode }) {
  const { focusWindow, closeWindow, toggleMaximize, minimizeWindow, updateWindowPosition, updateWindowSize } = useWindowManager();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Bounds checking (prevent window from getting completely lost under topbar)
      newY = Math.max(28, newY);

      updateWindowPosition(win.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, win.id, updateWindowPosition]);

  useEffect(() => {
    if (!isResizing) return;

    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!windowRef.current) return;
      const rect = windowRef.current.getBoundingClientRect();
      const newWidth = Math.max(200, e.clientX - rect.left);
      const newHeight = Math.max(100, e.clientY - rect.top);

      updateWindowSize(win.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, win.id, updateWindowSize]);

  if (win.isMinimized) return null;

  const style: React.CSSProperties = win.isMaximized
    ? { top: 28, left: 0, width: "100%", height: "calc(100% - 72px)", zIndex: win.zIndex } // space for topbar (28px) and taskbar (44px)
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  const CHROME_ACTIONS = [
    { label: "Minimise", glyph: "—", fontSize: "10px", onClick: () => minimizeWindow(win.id) },
    {
      label: win.isMaximized ? "Restore" : "Maximise",
      glyph: win.isMaximized ? "❐" : "□",
      fontSize: "9px",
      onClick: () => toggleMaximize(win.id),
    },
    { label: "Close", glyph: "✕", fontSize: "9px", onClick: () => closeWindow(win.id) },
  ];

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col`}
      style={{
        ...style,
        backgroundColor: "var(--vapor-pink)",
        boxShadow: "var(--shadow-out), 2px 2px 10px rgba(0,0,0,0.5)",
        border: "1px solid var(--vapor-dark)",
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <header
        className="flex items-center justify-between px-1 gap-2 m-0.5"
        style={{
          height: "22px",
          backgroundColor: win.isFocused ? undefined : "var(--vapor-muted)", // unfocused background
          background: win.isFocused ? "linear-gradient(to right, var(--vapor-rose-dark), var(--vapor-rose))" : undefined,
          boxShadow: "var(--shadow-out)",
        }}
        onDoubleClick={() => toggleMaximize(win.id)}
        onMouseDown={(e) => {
          if (win.isMaximized) return; // Don't drag if maximized
          setIsDragging(true);
          const rect = windowRef.current!.getBoundingClientRect();
          setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 px-2 select-none">
          <span style={{ fontSize: "10px", lineHeight: 1, color: win.isFocused ? "#fff" : "var(--vapor-dark)" }} aria-hidden="true">♡</span>
          <span
            className="leading-none truncate"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: win.isFocused ? "#ffffff" : "var(--vapor-dark)"
            }}
          >
            {win.title}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {CHROME_ACTIONS.map(({ label, glyph, fontSize, onClick }) => (
            <Button
              key={label}
              aria-label={label}
              title={label}
              onClick={onClick}
              variant="vapor"
              className={`w-4 h-4 p-0 border border-vapor-dark bg-vapor-muted text-vapor-dark font-mono leading-none flex items-center justify-center shadow-win98-out active:shadow-win98-active cursor-pointer ${
                label === "Minimise" ? "text-[10px]" : "text-[9px]"
              }`}
            >
              {glyph}
            </Button>
          ))}
        </div>
      </header>
      <div
        id={`window-content-${win.id}`}
        className="flex-1 overflow-auto bg-vapor-cream border border-vapor-dark m-0.5 relative shadow-win98-in"
      >
        {children}
      </div>
      {!win.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize flex items-end justify-end p-0.5"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            focusWindow(win.id);
          }}
        >
          <div className="w-2 h-2" style={{
            background: `linear-gradient(135deg, transparent 50%, var(--vapor-rose-dark) 50%)`
          }} />
        </div>
      )}
    </div>
  );
}
