import { useState } from "react";
import { Check, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#fbbf24', // yellow
  '#a855f7', // purple
  '#10b981', // green
  '#6b7280', // gray
];

interface ColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ color, onColorChange, label }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    onColorChange(newColor);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => onColorChange(presetColor)}
              className={cn(
                "w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 relative",
                color === presetColor ? "border-foreground" : "border-border"
              )}
              style={{ backgroundColor: presetColor }}
            >
              {color === presetColor && (
                <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-all relative flex items-center justify-center"
              style={{ 
                backgroundColor: color,
                backgroundImage: !PRESET_COLORS.includes(color) 
                  ? `linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
                     linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)`
                  : 'none',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 5px 5px'
              }}
            >
              <Paintbrush className="w-4 h-4 text-white drop-shadow-lg" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <label className="text-sm font-medium">Custom Color</label>
              <Input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#000000"
                className="font-mono"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
