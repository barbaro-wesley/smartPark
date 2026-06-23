import { createContext, useContext, type ReactNode } from "react";
import { useParkingStore, type ParkingState } from "@/hooks/useParkingStore";

const ParkingContext = createContext<ParkingState | null>(null);

export function ParkingProvider({ children }: { children: ReactNode }) {
  const state = useParkingStore();
  return (
    <ParkingContext.Provider value={state}>{children}</ParkingContext.Provider>
  );
}

export function useParkingContext(): ParkingState {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error("useParkingContext must be used inside ParkingProvider");
  return ctx;
}
