import { CTA_TYPES, VISUAL_STYLES, type CtaType, type VisualStyle } from "@/lib/content-factory/types";

export function pickCtaType(index: number): CtaType {
  return CTA_TYPES[index % CTA_TYPES.length];
}

export function pickVisualStyle(index: number, previous: VisualStyle[]): VisualStyle {
  const last = previous.slice(-2);
  for (let i = 0; i < VISUAL_STYLES.length; i++) {
    const style = VISUAL_STYLES[(index + i) % VISUAL_STYLES.length];
    const sameCount = last.filter((s) => s === style).length;
    if (sameCount < 2) return style;
  }
  return VISUAL_STYLES[index % VISUAL_STYLES.length];
}

export function verticalDuration(index: number): number {
  const slots = [25, 35, 45, 60, 75, 85];
  return slots[index % slots.length];
}
