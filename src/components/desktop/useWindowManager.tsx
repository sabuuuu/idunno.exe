import * as React from "react";
import { useState, useCallback, useEffect } from "react";

export interface WindowState {
  id: string;
  title: string;
  componentType: "ask" | "result" | "aesthetic" | "generic" | "display" | "login" | "logout" | "folder" | "music" | "share" | "convince" | "result-detail";
  props?: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
}

export type WindowManagerAPI = {
  windows: WindowState[];
  openWindow: (windowConfig: Omit<WindowState, "id" | "zIndex" | "isFocused" | "isMinimized" | "isMaximized"> & { id?: string }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  wallpaperSrc: string | null;
  setWallpaperSrc: (src: string | null) => void;
  theme: string;
  setTheme: (theme: string) => void;
  cursor: string;
  setCursor: (cursor: string) => void;
  bgAudioUrl: string | null;
  setBgAudioUrl: (url: string | null) => void;
  bgAudioVolume: number;
  setBgAudioVolume: (volume: number) => void;
};

const WindowManagerContext = React.createContext<WindowManagerAPI | null>(null);

export function useWindowManager() {
  const context = React.useContext(WindowManagerContext);
  if (!context) {
    throw new Error("useWindowManager must be used within a WindowManagerProvider");
  }
  return context;
}

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [, setTopZIndex] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [wallpaperSrc, setWallpaperSrc] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>("default");
  const [cursor, setCursor] = useState<string>("default");
  const [bgAudioUrl, setBgAudioUrl] = useState<string | null>("music/1.mp3");
  const [bgAudioVolume, setBgAudioVolume] = useState<number>(0.5);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("desktop_windows");
      if (saved) {
        const parsed = JSON.parse(saved);
        const validWindows = parsed.filter((w: WindowState) => ["aesthetic", "display", "login", "folder", "music"].includes(w.componentType));
        const unfocused = validWindows.map((w: WindowState) => ({
          ...w,
          y: Math.max(28, w.y ?? 28),
          isFocused: false,
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWindows(unfocused);

        // Find highest zIndex to resume
        let maxZ = 10;
        for (const w of parsed) {
          if (w.zIndex > maxZ) maxZ = w.zIndex;
        }
        setTopZIndex(maxZ);
      }
      const savedWallpaper = localStorage.getItem("desktop_wallpaper");
      if (savedWallpaper) setWallpaperSrc(savedWallpaper);

      const savedTheme = localStorage.getItem("desktop_theme");
      if (savedTheme) setTheme(savedTheme);

      const savedCursor = localStorage.getItem("desktop_cursor");
      if (savedCursor) setCursor(savedCursor);

      const savedAudio = localStorage.getItem("desktop_audio");
      if (savedAudio !== null) {
        setBgAudioUrl(savedAudio === "none" ? null : savedAudio);
      }

      const savedVolume = localStorage.getItem("desktop_audio_volume");
      if (savedVolume) setBgAudioVolume(parseFloat(savedVolume));

    } catch (e) {
      console.error("Failed to load window state", e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("desktop_windows", JSON.stringify(windows));
      if (wallpaperSrc) localStorage.setItem("desktop_wallpaper", wallpaperSrc);
      else localStorage.removeItem("desktop_wallpaper");

      localStorage.setItem("desktop_theme", theme);

      if (bgAudioUrl) localStorage.setItem("desktop_audio", bgAudioUrl);
      else localStorage.setItem("desktop_audio", "none");

      localStorage.setItem("desktop_audio_volume", bgAudioVolume.toString());

      // Apply theme and cursor to body
      document.body.className = `theme-${theme} cursor-${cursor}`;
    }
  }, [windows, wallpaperSrc, theme, cursor, bgAudioUrl, bgAudioVolume, isInitialized]);

  const openWindow = useCallback(
    (
      windowConfig: Omit<WindowState, "id" | "zIndex" | "isFocused" | "isMinimized" | "isMaximized"> & {
        id?: string;
      }
    ) => {
      setTopZIndex((prevTop) => {
        const newZIndex = prevTop + 1;
        setWindows((prev) => {
          const existingIndex = prev.findIndex((w) => w.id === windowConfig.id);
          if (existingIndex >= 0) {
            // Restore and focus existing
            const next = [...prev];
            next[existingIndex] = { ...next[existingIndex], isMinimized: false, isFocused: true, zIndex: newZIndex };
            return next.map((w, i) => (i === existingIndex ? w : { ...w, isFocused: false }));
          }

          // Create new
          const newId = windowConfig.id || `win-${Date.now()}`;
          const newWin: WindowState = {
            ...windowConfig,
            id: newId,
            zIndex: newZIndex,
            isMinimized: false,
            isMaximized: false,
            isFocused: true,
          };
          const next = prev.map((w) => ({ ...w, isFocused: false }));
          return [...next, newWin];
        });
        return newZIndex;
      });
    },
    []
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setTopZIndex((prevTop) => {
      const newZIndex = prevTop + 1;
      setWindows((prev) => {
        return prev.map((w) => {
          if (w.id === id) {
            return { ...w, isFocused: true, zIndex: newZIndex, isMinimized: false };
          }
          return { ...w, isFocused: false };
        });
      });
      return newZIndex;
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w)));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)));
  }, []);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }, []);

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        focusWindow,
        minimizeWindow,
        toggleMaximize,
        updateWindowPosition,
        updateWindowSize,
        wallpaperSrc,
        setWallpaperSrc,
        theme,
        setTheme,
        cursor,
        setCursor,
        bgAudioUrl,
        setBgAudioUrl,
        bgAudioVolume,
        setBgAudioVolume,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}
