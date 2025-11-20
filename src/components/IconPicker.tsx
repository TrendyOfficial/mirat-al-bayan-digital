import { User, Star, Heart, Coffee, Music, Camera, Zap, Flame, Cloud, Umbrella, Sun, Moon, Sparkles, Crown, Headphones, Film, Award, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_ICONS = [
  { name: 'user', Icon: User },
  { name: 'star', Icon: Star },
  { name: 'heart', Icon: Heart },
  { name: 'coffee', Icon: Coffee },
  { name: 'music', Icon: Music },
  { name: 'camera', Icon: Camera },
  { name: 'zap', Icon: Zap },
  { name: 'flame', Icon: Flame },
  { name: 'cloud', Icon: Cloud },
  { name: 'umbrella', Icon: Umbrella },
  { name: 'sun', Icon: Sun },
  { name: 'moon', Icon: Moon },
  { name: 'sparkles', Icon: Sparkles },
  { name: 'crown', Icon: Crown },
  { name: 'headphones', Icon: Headphones },
  { name: 'film', Icon: Film },
  { name: 'award', Icon: Award },
  { name: 'palette', Icon: Palette },
];

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

export function IconPicker({ selectedIcon, onSelectIcon }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVAILABLE_ICONS.map(({ name, Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelectIcon(name)}
          className={cn(
            "p-2 rounded-lg border-2 transition-all hover:scale-105",
            selectedIcon === name
              ? "border-primary bg-primary/10"
              : "border-border bg-background hover:border-primary/50"
          )}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}

export function getIconComponent(iconName: string) {
  const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
  return icon ? icon.Icon : User;
}
