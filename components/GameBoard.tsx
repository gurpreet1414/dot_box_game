"use client";

import { socket } from '../socket/client';
import type { GameState, Line, Player } from '../types/game';
import { getColorHex } from '../utils/colors';

interface GameBoardProps {
  game: GameState;
  player: Player;
}

function lineKey(line: Pick<Line, 'x' | 'y' | 'orientation'>) {
  return `${line.orientation}-${line.x}-${line.y}`;
}

export default function GameBoard({ game, player }: GameBoardProps) {
  const size = 560;
  const padding = 44;
  const gap = (size - padding * 2) / (game.boardSize - 1);
  const lineMap = new Map(game.lines.map((line) => [lineKey(line), line]));
  const currentPlayer = game.players.find((item) => item.id === game.currentTurn);
  const myTurn = game.currentTurn === player.id && !game.ended;

  const makeMove = (line: Omit<Line, 'drawnBy'>) => {
    if (!myTurn || lineMap.has(lineKey(line))) {
      return;
    }

    socket.emit('make-move', {
      roomCode: game.roomCode,
      playerId: player.id,
      line: { ...line, drawnBy: player.id },
    });
  };

  const restart = () => {
    socket.emit('restart-game', { roomCode: game.roomCode });
  };

  return (
    <div className="theme-bg min-h-screen p-4 text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-5">
        <header className="glass flex flex-col gap-3 rounded-lg p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-amber-200/80">Room {game.roomCode}</p>
            <h1 className="text-2xl font-bold">
              {game.ended
                ? game.winnerIds.includes(player.id)
                  ? 'You won'
                  : game.winnerIds.length > 1
                    ? 'Draw game'
                    : 'Game over'
                : myTurn
                  ? 'Your turn'
                  : `${currentPlayer?.name ?? 'Opponent'} is thinking`}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {game.players.map((gamePlayer) => (
              <div key={gamePlayer.id} className="theme-chip rounded-md px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: getColorHex(gamePlayer.color) }}
                  />
                  <span className="font-semibold">{gamePlayer.name}</span>
                </div>
                <p className="text-sm text-slate-300">{game.scores[gamePlayer.id] ?? 0} boxes</p>
              </div>
            ))}
          </div>
        </header>

        <section className="glass flex flex-col items-center gap-4 rounded-lg p-4">
          <svg
            className="h-auto w-full max-w-[min(92vw,640px)] select-none rounded-lg bg-slate-950/40"
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Dots and Boxes board"
          >
            {game.boxes.map((box) => {
              const owner = box.ownerId ? game.players.find((item) => item.id === box.ownerId) : null;

              return (
                <rect
                  key={`box-${box.x}-${box.y}`}
                  x={padding + box.x * gap + 6}
                  y={padding + box.y * gap + 6}
                  width={gap - 12}
                  height={gap - 12}
                  rx={6}
                  fill={owner ? getColorHex(owner.color) : 'transparent'}
                  opacity={owner ? 0.35 : 1}
                />
              );
            })}

            {Array.from({ length: game.boardSize }).map((_, y) =>
              Array.from({ length: game.boardSize - 1 }).map((__, x) => {
                const line = { x, y, orientation: 'horizontal' as const };
                const drawnLine = lineMap.get(lineKey(line));
                const owner = drawnLine ? game.players.find((item) => item.id === drawnLine.drawnBy) : null;

                return (
                  <g key={lineKey(line)}>
                    <line
                      x1={padding + x * gap}
                      y1={padding + y * gap}
                      x2={padding + (x + 1) * gap}
                      y2={padding + y * gap}
                      stroke={owner ? getColorHex(owner.color) : '#334155'}
                      strokeWidth={owner ? 7 : 3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={padding + x * gap}
                      y1={padding + y * gap}
                      x2={padding + (x + 1) * gap}
                      y2={padding + y * gap}
                      stroke="transparent"
                      strokeWidth={Math.max(16, gap * 0.55)}
                      strokeLinecap="round"
                      className={myTurn && !drawnLine ? 'cursor-pointer' : ''}
                      onClick={() => makeMove(line)}
                    />
                  </g>
                );
              })
            )}

            {Array.from({ length: game.boardSize - 1 }).map((_, y) =>
              Array.from({ length: game.boardSize }).map((__, x) => {
                const line = { x, y, orientation: 'vertical' as const };
                const drawnLine = lineMap.get(lineKey(line));
                const owner = drawnLine ? game.players.find((item) => item.id === drawnLine.drawnBy) : null;

                return (
                  <g key={lineKey(line)}>
                    <line
                      x1={padding + x * gap}
                      y1={padding + y * gap}
                      x2={padding + x * gap}
                      y2={padding + (y + 1) * gap}
                      stroke={owner ? getColorHex(owner.color) : '#334155'}
                      strokeWidth={owner ? 7 : 3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={padding + x * gap}
                      y1={padding + y * gap}
                      x2={padding + x * gap}
                      y2={padding + (y + 1) * gap}
                      stroke="transparent"
                      strokeWidth={Math.max(16, gap * 0.55)}
                      strokeLinecap="round"
                      className={myTurn && !drawnLine ? 'cursor-pointer' : ''}
                      onClick={() => makeMove(line)}
                    />
                  </g>
                );
              })
            )}

            {Array.from({ length: game.boardSize }).map((_, y) =>
              Array.from({ length: game.boardSize }).map((__, x) => (
                <circle
                  key={`dot-${x}-${y}`}
                  cx={padding + x * gap}
                  cy={padding + y * gap}
                  r={Math.max(4, Math.min(7, gap * 0.16))}
                  fill="#f8fafc"
                  stroke="#2dd4bf"
                  strokeWidth={1.5}
                />
              ))
            )}
          </svg>

          {game.ended && (
            <button
              type="button"
              className="theme-button rounded-lg px-5 py-2 font-bold transition-transform hover:scale-[1.02]"
              onClick={restart}
            >
              Play Again
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
