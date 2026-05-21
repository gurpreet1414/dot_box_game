"use client";
import { useEffect, useState } from 'react';
import { socket } from '../socket/client';
import type { PlayerColor, RoomResponse } from '../types/game';
import { getColorHex, PLAYER_COLORS } from '../utils/colors';
import { useGameStore } from '../store/gameStore';
import GameBoard from './GameBoard';
import { BOARD_DOT_COUNT, DOT_COUNT_MULTIPLIER } from '../config/gameConfig';

export default function LandingScreen() {
  const { player, room, game, setPlayer, setRoom, setGame, reset } = useGameStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState<PlayerColor>('red');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleRoomUpdated = (updatedRoom: NonNullable<typeof room>) => {
      setRoom(updatedRoom);
    };

    const handleDisconnect = () => {
      setError('Disconnected from the room server. Please try again.');
    };

    socket.on('room-updated', handleRoomUpdated);
    socket.on('game-started', setGame);
    socket.on('move-made', setGame);
    socket.on('game-ended', setGame);
    socket.on('turn-changed', (_playerId, updatedGame) => setGame(updatedGame));
    socket.on('connect_error', handleDisconnect);

    return () => {
      socket.off('room-updated', handleRoomUpdated);
      socket.off('game-started', setGame);
      socket.off('move-made', setGame);
      socket.off('game-ended', setGame);
      socket.off('turn-changed');
      socket.off('connect_error', handleDisconnect);
    };
  }, [setGame, setRoom]);

  const connectSocket = () =>
    new Promise<void>((resolve, reject) => {
      if (socket.connected) {
        resolve();
        return;
      }

      const timeout = window.setTimeout(() => {
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleError);
        reject(new Error('Could not connect to the room server. Make sure you started the app with npm run dev.'));
      }, 5000);

      const handleConnect = () => {
        window.clearTimeout(timeout);
        socket.off('connect_error', handleError);
        resolve();
      };

      const handleError = () => {
        window.clearTimeout(timeout);
        socket.off('connect', handleConnect);
        reject(new Error('Could not connect to the room server. Make sure you started the app with npm run dev.'));
      };

      socket.once('connect', handleConnect);
      socket.once('connect_error', handleError);
      socket.connect();
    });

  const handleRoomResponse = (response: RoomResponse) => {
    if (!response.ok) {
      setError(response.error);
      return;
    }

    setRoom(response.room);
    setPlayer(response.player);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (mode === 'join' && !roomCode.trim()) {
      setError('Room code is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await connectSocket();

      if (mode === 'create') {
        socket.emit('create-room', { name, color, boardSize: BOARD_DOT_COUNT }, handleRoomResponse);
      } else {
        socket.emit('join-room', { code: roomCode, name, color }, handleRoomResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    if (!room || !player || room.players.length < 2 || player.id !== room.hostId) {
      return;
    }

    socket.emit('start-game', { roomCode: room.code, playerId: player.id });
  };

  if (game && player) {
    return <GameBoard game={game} player={player} />;
  }

  if (room && player) {
    return (
      <div className="theme-bg flex min-h-screen items-center justify-center p-4">
        <div className="glass w-full max-w-md rounded-2xl p-8 shadow-neon">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-wider text-teal-200/70">Room Code</p>
            <h1 className="mt-1 text-4xl font-bold text-teal-200">{room.code}</h1>
            <p className="mt-2 text-sm text-amber-200/80">{room.boardSize} x {room.boardSize} dots</p>
          </div>

          <div className="space-y-3">
            {room.players.map((roomPlayer) => (
              <div key={roomPlayer.id} className="theme-chip flex items-center justify-between rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: getColorHex(roomPlayer.color) }}
                  />
                  <span className="font-semibold">{roomPlayer.name}</span>
                </div>
                <span className="text-sm text-slate-300">
                  {roomPlayer.isHost ? 'Host' : 'Joined'}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-300">
            {room.players.length < 2
              ? 'Share this code with a friend to start.'
              : player.id === room.hostId
                ? 'Both players are in the room. Start when ready.'
                : 'Both players are in the room. Waiting for the host.'}
          </p>

          {player.id === room.hostId && (
            <button
              type="button"
              className="theme-button mt-6 w-full rounded-lg py-2 font-bold transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={room.players.length < 2}
              onClick={startGame}
            >
              Start Game
            </button>
          )}

          <button
            type="button"
            className="theme-button-secondary mt-3 w-full rounded-lg py-2 font-semibold transition-colors"
            onClick={() => {
              socket.disconnect();
              reset();
            }}
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-bg flex min-h-screen flex-col items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-neon">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-wider text-amber-200/80">Arcade table</p>
          <h1 className="mt-1 text-4xl font-bold text-white">Dots and Boxes</h1>
          <p className="mt-2 text-sm text-slate-300">Board scale {DOT_COUNT_MULTIPLIER}x, {BOARD_DOT_COUNT} dots per side</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Name</label>
            <input
              className="theme-input w-full rounded-lg px-4 py-2 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Color</label>
            <div className="flex gap-2">
              {PLAYER_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  className={`h-8 w-8 rounded-full border-2 ${color === c.value ? 'scale-110 border-amber-200' : 'border-slate-600'} transition-transform`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c.value)}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 ${mode === 'create' ? 'theme-button' : 'theme-button-secondary'} font-semibold transition-colors`}
              onClick={() => setMode('create')}
            >
              Create Room
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 ${mode === 'join' ? 'theme-button' : 'theme-button-secondary'} font-semibold transition-colors`}
              onClick={() => setMode('join')}
            >
              Join Room
            </button>
          </div>
          {mode === 'join' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Room Code</label>
              <input
                className="theme-input w-full rounded-lg px-4 py-2 outline-none"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                required={mode === 'join'}
              />
            </div>
          )}
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="theme-button mt-2 w-full rounded-lg py-2 text-lg font-bold transition-transform hover:scale-[1.02] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Loading...' : mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
