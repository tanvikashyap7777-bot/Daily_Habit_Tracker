import React from 'react';
import {
  Droplets,
  Flame,
  Sparkles,
  Target,
  BookOpen,
  Heart,
  Sun,
  Moon,
  Dumbbell,
  Smile,
  Coffee,
  Brain,
  Music,
  Code,
  Compass,
  Footprints,
  CheckCircle2,
  Activity,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets,
  Flame,
  Sparkles,
  Target,
  BookOpen,
  Heart,
  Sun,
  Moon,
  Dumbbell,
  Smile,
  Coffee,
  Brain,
  Music,
  Code,
  Compass,
  Footprints,
  CheckCircle2,
  Activity,
};

interface HabitIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = ICON_MAP[name] || Activity;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_ICONS = [
  'Droplets',
  'Flame',
  'Sparkles',
  'Target',
  'BookOpen',
  'Heart',
  'Sun',
  'Moon',
  'Dumbbell',
  'Smile',
  'Coffee',
  'Brain',
  'Music',
  'Code',
  'Compass',
  'Footprints',
  'CheckCircle2',
  'Activity',
];
