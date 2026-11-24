interface CrazyGamesSDKLike {
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDKLike;
    };
  }
}

export const crazyGames = {
  gameplayStart(): void {
    try {
      window.CrazyGames?.SDK?.game?.gameplayStart?.();
    } catch {
      // Safe no-op outside CrazyGames container
    }
  },
  gameplayStop(): void {
    try {
      window.CrazyGames?.SDK?.game?.gameplayStop?.();
    } catch {
      // Safe no-op
    }
  },
  happytime(): void {
    try {
      window.CrazyGames?.SDK?.game?.happytime?.();
    } catch {
      // Safe no-op
    }
  },
};
