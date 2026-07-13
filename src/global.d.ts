import type { CodexPetApi } from "./shared/contracts";

declare global {
  interface Window {
    codexPet?: CodexPetApi;
  }
}

export {};
