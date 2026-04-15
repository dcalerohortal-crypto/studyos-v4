import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RightPanelTab = "herramientas" | "fuentes" | "ajustes";

interface LayoutState {
  leftPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  toggleLeftPanel: () => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({
      leftPanelOpen: true,
      rightPanelTab: "herramientas",
      setLeftPanelOpen: open => set({ leftPanelOpen: open }),
      setRightPanelTab: tab => set({ rightPanelTab: tab }),
      toggleLeftPanel: () =>
        set(state => ({ leftPanelOpen: !state.leftPanelOpen })),
      resetLayout: () =>
        set({ leftPanelOpen: true, rightPanelTab: "herramientas" }),
    }),
    {
      name: "studyos-layout",
      partialize: state => ({
        leftPanelOpen: state.leftPanelOpen,
        rightPanelTab: state.rightPanelTab,
      }),
    }
  )
);
