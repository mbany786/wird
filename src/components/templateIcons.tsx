import React from 'react';
import {
  Moon, Activity, Brain, BookOpen, Baby, HeartPulse, Sparkles, PlusCircle, Star, Sun, Heart, Dumbbell,
  Book, Coffee, Leaf, Target, Flame, Droplets, GraduationCap, Briefcase
} from 'lucide-react';

/** Icons a template can use (stored by name). */
export const TEMPLATE_ICONS = {
  Moon, Star, Sun, BookOpen, Book, Sparkles, Heart, HeartPulse, Activity, Dumbbell, Brain, Target,
  Flame, Leaf, Droplets, Coffee, GraduationCap, Briefcase, Baby, PlusCircle
} as const;
export type TemplateIconName = keyof typeof TEMPLATE_ICONS;

/** Accent colours (text + soft background), keyed by name. */
export const TEMPLATE_COLORS: Record<string, { text: string; bg: string; ring: string; swatch: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-950/70', ring: 'ring-emerald-500', swatch: 'bg-emerald-500' },
  teal: { text: 'text-teal-300', bg: 'bg-teal-950/70', ring: 'ring-teal-400', swatch: 'bg-teal-400' },
  sky: { text: 'text-sky-400', bg: 'bg-sky-950/70', ring: 'ring-sky-400', swatch: 'bg-sky-400' },
  violet: { text: 'text-violet-300', bg: 'bg-violet-950/70', ring: 'ring-violet-400', swatch: 'bg-violet-400' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-950/70', ring: 'ring-amber-400', swatch: 'bg-amber-400' },
  rose: { text: 'text-rose-300', bg: 'bg-rose-950/70', ring: 'ring-rose-400', swatch: 'bg-rose-400' }
};

/** Default colour for built-in templates that predate the colour setting. */
const LEGACY_COLOR: Record<string, string> = {
  Moon: 'emerald', Activity: 'sky', Brain: 'violet', BookOpen: 'amber', Baby: 'rose', HeartPulse: 'rose', Sparkles: 'amber'
};

export function templateColor(t: { color?: string; icon: string }) {
  return TEMPLATE_COLORS[t.color ?? LEGACY_COLOR[t.icon] ?? 'emerald'] ?? TEMPLATE_COLORS.emerald;
}

export const TemplateIcon: React.FC<{ template: { icon: string; color?: string }; className?: string }> = ({ template, className = 'w-5 h-5' }) => {
  const Icon = TEMPLATE_ICONS[template.icon as TemplateIconName] ?? Sparkles;
  return <Icon className={`${className} ${templateColor(template).text}`} />;
};
