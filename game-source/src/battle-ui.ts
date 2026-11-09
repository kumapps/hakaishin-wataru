// Logical pixels only. Positions are chosen once from the actors' home positions.
type Rect = { left: number; top: number; width: number; height: number };
const overlaps = (a: Rect, b: Rect) =>
  a.left < b.left + b.width + 12 &&
  a.left + a.width + 12 > b.left &&
  a.top < b.top + b.height + 12 &&
  a.top + a.height + 12 > b.top;
export function placeBattleHuds(
  actors: { enemy: boolean; bounds: Rect }[],
  width: number,
  height: number,
) {
  const w = 264,
    h = 100,
    placed: Rect[] = [];
  const clamp = (r: Rect) => ({
    ...r,
    left: Math.max(16, Math.min(width - w - 16, r.left)),
    top: Math.max(56, Math.min(height - h - 16, r.top)),
  });
  const candidate = (r: Rect, direction: number) =>
    clamp({
      left:
        direction === 2
          ? r.left - w - 20
          : direction === 3
            ? r.left + r.width + 20
            : r.left + (r.width - w) / 2,
      top:
        direction === 0
          ? r.top + r.height + 20
          : direction === 1
            ? r.top - h - 20
            : r.top + (r.height - h) / 2,
      width: w,
      height: h,
    });
  // Allies share a direction. Prefer feet, then overhead, then either side.
  const allies = actors.filter((a) => !a.enemy);
  let allyRects: Rect[] = [];
  for (const direction of [0, 1, 2, 3]) {
    const rs = allies.map((a) => candidate(a.bounds, direction));
    if (
      rs.every(
        (r, i) =>
          !actors.some((a) => overlaps(r, a.bounds)) &&
          !rs.slice(0, i).some((p) => overlaps(r, p)),
      )
    ) {
      allyRects = rs;
      break;
    }
  }
  const result: Rect[] = [];
  let allyIndex = 0;
  actors.forEach((a) => {
    const preferred = a.enemy
      ? [1, 2, 3, 0].map((d) => candidate(a.bounds, d))
      : allyRects.length
        ? [allyRects[allyIndex++]]
        : [];
    // Dense formations may use a shared edge area, without reducing text size.
    const edges: Rect[] = [];
    for (let y = 56; y <= height - h - 16; y += h + 20)
      for (const x of [16, width - w - 16, (width - w) / 2])
        edges.push({ left: x, top: y, width: w, height: h });
    edges.sort(
      (first, second) =>
        (a.enemy ? first.top - second.top : second.top - first.top) ||
        first.left - second.left,
    );
    const r =
      [...preferred, ...edges].find(
        (r) =>
          !actors.some((a) => overlaps(r, a.bounds)) &&
          !placed.some((p) => overlaps(r, p)) &&
          (!a.enemy || !allyRects.some((p) => overlaps(r, p))),
      ) ?? edges.find((r) => !placed.some((p) => overlaps(r, p)))!;
    placed.push(r);
    result.push(r);
  });
  return result;
}

export function battleEnemyName(name: string) {
  const chars = Array.from(name);
  if (chars.length <= 6) return name;
  const middle = Math.ceil(chars.length / 2);
  const breaks = chars
    .map((c, i) => (c === "の" && i > 0 && i < chars.length - 2 ? i + 1 : 0))
    .filter(Boolean);
  const at =
    breaks.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle))[0] ??
    middle;
  return chars.slice(0, at).join("") + "\n" + chars.slice(at).join("");
}
