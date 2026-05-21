import type { PlayerColor } from '../types/game';

export const PLAYER_COLORS: Array<{ name: string; value: PlayerColor; hex: string }> = [
    { name: 'Red', value: 'red', hex: '#ef4444' },
    { name: 'Blue', value: 'blue', hex: '#3b82f6' },
    { name: 'Green', value: 'green', hex: '#22c55e' },
    { name: 'Yellow', value: 'yellow', hex: '#eab308' },
    { name: 'Purple', value: 'purple', hex: '#a21caf' },
];

export function getColorHex(color: string) {
    return PLAYER_COLORS.find((c) => c.value === color)?.hex || '#fff';
}
