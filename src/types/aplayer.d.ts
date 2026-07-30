/**
 * Project-local declarations for the APlayer 1.10.1 APIs used by this site.
 * Recheck this contract when upgrading the runtime dependency.
 */
declare module "aplayer" {
  export interface APlayerAudio {
    name: string;
    artist: string;
    url: string;
    cover?: string;
    lrc?: string;
  }

  export interface APlayerOptions {
    container: HTMLElement;
    audio: APlayerAudio[];
    preload?: "none" | "metadata" | "auto";
    mutex?: boolean;
    volume?: number;
  }

  export type APlayerEvent = "play" | "pause" | "listswitch" | "timeupdate";

  export default class APlayer {
    constructor(options: APlayerOptions);

    audio: HTMLAudioElement;
    list: {
      index: number;
      switch(index: number): void;
    };

    on(event: APlayerEvent, handler: () => void): void;
    pause(): void;
    play(): void;
  }
}
