// TypeScript types for Dots and Boxes game

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export interface Player {
    id: string;
    name: string;
    color: PlayerColor;
    isReady: boolean;
    isHost: boolean;
    score: number;
    connected: boolean;
}

export interface Room {
    code: string;
    players: Player[];
    hostId: string;
    started: boolean;
    boardSize: number;
    spectators: Player[];
}

export type LineOrientation = 'horizontal' | 'vertical';

export interface Line {
    x: number;
    y: number;
    orientation: LineOrientation;
    drawnBy: string; // player id
}

export interface Box {
    x: number;
    y: number;
    ownerId: string | null;
}

export interface GameState {
    roomCode: string;
    boardSize: number;
    players: Player[];
    spectators: Player[];
    lines: Line[];
    boxes: Box[];
    currentTurn: string; // player id
    started: boolean;
    ended: boolean;
    winnerIds: string[];
    scores: Record<string, number>; // playerId -> score
}

// Socket Events
export interface ClientToServerEvents {
    'create-room': (payload: { name: string; color: PlayerColor; boardSize: number }, cb: (response: RoomResponse) => void) => void;
    'join-room': (payload: { code: string; name: string; color: PlayerColor }, cb: (response: RoomResponse) => void) => void;
    'ready-player': (payload: { roomCode: string; playerId: string; ready: boolean }) => void;
    'start-game': (payload: { roomCode: string; playerId: string }) => void;
    'make-move': (payload: { roomCode: string; playerId: string; line: Line }) => void;
    'restart-game': (payload: { roomCode: string }) => void;
}

export type RoomResponse =
    | { ok: true; room: Room; player: Player }
    | { ok: false; error: string };

export interface ServerToClientEvents {
    'room-updated': (room: Room) => void;
    'game-started': (game: GameState) => void;
    'move-made': (game: GameState) => void;
    'box-completed': (box: Box, playerId: string, game: GameState) => void;
    'turn-changed': (playerId: string, game: GameState) => void;
    'game-ended': (game: GameState) => void;
    'player-disconnected': (playerId: string, room: Room) => void;
}
