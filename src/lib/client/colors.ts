/** Each player gets a fixed color by join order so the same person is the same color everywhere. */
export const PLAYER_COLORS = ["#6489f4", "#00ed95", "#ff3a5e", "#8d51cb"] as const;

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export function colorMap(players: { id: string }[]): Record<string, string> {
  return Object.fromEntries(players.map((p, i) => [p.id, playerColor(i)]));
}
