import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import type { ClientToServerEvents, ServerToClientEvents, Player, Room, GameState, Line, Box } from '../types/game';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const rooms: Record<string, Room> = {};
const gameStates: Record<string, GameState> = {};

const httpServer = createServer((req, res) => {
    handle(req, res);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
});

function createRoomCode() {
    let code = '';

    do {
        code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (rooms[code]);

    return code;
}

function createPlayer(socketId: string, name: string, color: Player['color'], isHost = false): Player {
    return {
        id: socketId,
        name: name.trim(),
        color,
        isReady: isHost,
        isHost,
        score: 0,
        connected: true,
    };
}

function getSocketRoomCode(socketId: string) {
    return Object.values(rooms).find((room) =>
        room.players.some((player) => player.id === socketId) ||
        room.spectators.some((player) => player.id === socketId)
    )?.code;
}

function createGameState(room: Room): GameState {
    const boxes: Box[] = [];

    for (let y = 0; y < room.boardSize - 1; y += 1) {
        for (let x = 0; x < room.boardSize - 1; x += 1) {
            boxes.push({ x, y, ownerId: null });
        }
    }

    return {
        roomCode: room.code,
        boardSize: room.boardSize,
        players: room.players.map((player) => ({ ...player, score: 0 })),
        spectators: room.spectators,
        lines: [],
        boxes,
        currentTurn: room.players[0].id,
        started: true,
        ended: false,
        winnerIds: [],
        scores: Object.fromEntries(room.players.map((player) => [player.id, 0])),
    };
}

function isSameLine(a: Line, b: Line) {
    return a.x === b.x && a.y === b.y && a.orientation === b.orientation;
}

function isValidLine(line: Line, boardSize: number) {
    if (line.orientation === 'horizontal') {
        return line.x >= 0 && line.x < boardSize - 1 && line.y >= 0 && line.y < boardSize;
    }

    return line.x >= 0 && line.x < boardSize && line.y >= 0 && line.y < boardSize - 1;
}

function hasLine(lines: Line[], x: number, y: number, orientation: Line['orientation']) {
    return lines.some((line) => line.x === x && line.y === y && line.orientation === orientation);
}

function updateCompletedBoxes(game: GameState, playerId: string) {
    const completedBoxes: Box[] = [];

    for (const box of game.boxes) {
        if (box.ownerId) {
            continue;
        }

        const completed =
            hasLine(game.lines, box.x, box.y, 'horizontal') &&
            hasLine(game.lines, box.x, box.y + 1, 'horizontal') &&
            hasLine(game.lines, box.x, box.y, 'vertical') &&
            hasLine(game.lines, box.x + 1, box.y, 'vertical');

        if (completed) {
            box.ownerId = playerId;
            completedBoxes.push(box);
        }
    }

    if (completedBoxes.length > 0) {
        game.scores[playerId] = (game.scores[playerId] || 0) + completedBoxes.length;
        game.players = game.players.map((player) =>
            player.id === playerId ? { ...player, score: game.scores[playerId] } : player
        );
    }

    return completedBoxes;
}

function finishGameIfNeeded(game: GameState) {
    if (game.boxes.some((box) => !box.ownerId)) {
        return;
    }

    const highScore = Math.max(...Object.values(game.scores));
    game.ended = true;
    game.winnerIds = Object.entries(game.scores)
        .filter(([, score]) => score === highScore)
        .map(([playerId]) => playerId);
}

io.on('connection', (socket) => {
    socket.on('create-room', ({ name, color, boardSize }, cb) => {
        if (!name.trim()) {
            cb({ ok: false, error: 'Name is required.' });
            return;
        }

        const code = createRoomCode();
        const player = createPlayer(socket.id, name, color, true);
        const room: Room = {
            code,
            players: [player],
            hostId: player.id,
            started: false,
            boardSize,
            spectators: [],
        };

        rooms[code] = room;
        socket.join(code);
        cb({ ok: true, room, player });
        io.to(code).emit('room-updated', room);
    });

    socket.on('join-room', ({ code, name, color }, cb) => {
        const room = rooms[code.trim().toUpperCase()];

        if (!name.trim()) {
            cb({ ok: false, error: 'Name is required.' });
            return;
        }

        if (!room) {
            cb({ ok: false, error: 'Room not found.' });
            return;
        }

        if (room.started) {
            cb({ ok: false, error: 'This game has already started.' });
            return;
        }

        if (room.players.length >= 5) {
            cb({ ok: false, error: 'This room is already full.' });
            return;
        }

        const player = createPlayer(socket.id, name, color);
        room.players.push(player);
        socket.join(room.code);
        cb({ ok: true, room, player });
        io.to(room.code).emit('room-updated', room);
    });

    socket.on('ready-player', ({ roomCode, playerId, ready }) => {
        const room = rooms[roomCode];
        const player = room?.players.find((item) => item.id === playerId);

        if (!room || !player) {
            return;
        }

        player.isReady = ready;
        io.to(room.code).emit('room-updated', room);
    });

    socket.on('start-game', ({ roomCode, playerId }) => {
        const room = rooms[roomCode];

        if (!room || room.hostId !== playerId || room.players.length < 2) {
            return;
        }

        room.started = true;
        const game = createGameState(room);
        gameStates[room.code] = game;
        io.to(room.code).emit('room-updated', room);
        io.to(room.code).emit('game-started', game);
    });

    socket.on('make-move', ({ roomCode, playerId, line }) => {
        const game = gameStates[roomCode];
        const room = rooms[roomCode];

        if (!game || !room || game.ended || game.currentTurn !== playerId) {
            return;
        }

        const move = { ...line, drawnBy: playerId };

        if (!isValidLine(move, game.boardSize) || game.lines.some((existingLine) => isSameLine(existingLine, move))) {
            return;
        }

        game.lines.push(move);
        const completedBoxes = updateCompletedBoxes(game, playerId);

        if (completedBoxes.length === 0) {
            const currentIndex = game.players.findIndex((player) => player.id === playerId);
            game.currentTurn = game.players[(currentIndex + 1) % game.players.length].id;
        }

        finishGameIfNeeded(game);

        io.to(room.code).emit('move-made', game);

        for (const box of completedBoxes) {
            io.to(room.code).emit('box-completed', box, playerId, game);
        }

        if (game.ended) {
            io.to(room.code).emit('game-ended', game);
        } else {
            io.to(room.code).emit('turn-changed', game.currentTurn, game);
        }
    });

    socket.on('restart-game', ({ roomCode }) => {
        const room = rooms[roomCode];

        if (!room) {
            return;
        }

        const game = createGameState(room);
        gameStates[room.code] = game;
        io.to(room.code).emit('game-started', game);
    });

    socket.on('disconnect', () => {
        const roomCode = getSocketRoomCode(socket.id);
        const room = roomCode ? rooms[roomCode] : null;

        if (!room) {
            return;
        }

        const player = room.players.find((item) => item.id === socket.id);

        if (player) {
            player.connected = false;
            io.to(room.code).emit('player-disconnected', player.id, room);
            io.to(room.code).emit('room-updated', room);
        }

        if (room.players.every((item) => !item.connected)) {
            delete rooms[room.code];
            delete gameStates[room.code];
        }
    });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
