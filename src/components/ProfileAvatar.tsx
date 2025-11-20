import { getIconComponent } from "./IconPicker";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  icon: string;
  colorOne: string;
  colorTwo: string;
  useGradient: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

const iconSizeMap = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

export function ProfileAvatar({ 
  icon, 
  colorOne, 
  colorTwo, 
  useGradient, 
  size = 'md',
  className 
}: ProfileAvatarProps) {
  const IconComponent = getIconComponent(icon);
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white shadow-lg",
        sizeMap[size],
        className
      )}
      style={{
        background: useGradient
          ? `linear-gradient(135deg, ${colorOne}, ${colorTwo})`
          : colorOne,
      }}
    >
      <IconComponent className={iconSizeMap[size]} />
    </div>
  );
}
