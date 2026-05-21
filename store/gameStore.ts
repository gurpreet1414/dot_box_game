import { create } from 'zustand';
import type { GameState, Room, Player } from '../types/game';

interface GameStore {
    room: Room | null;
    game: GameState | null;
    player: Player | null;
    setRoom: (room: Room | null) => void;
    setGame: (game: GameState | null) => void;
    setPlayer: (player: Player | null) => void;
    reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    room: null,
    game: null,
    player: null,
    setRoom: (room) => set({ room }),
    setGame: (game) => set({ game }),
    setPlayer: (player) => set({ player }),
    reset: () => set({ room: null, game: null, player: null }),
}));
