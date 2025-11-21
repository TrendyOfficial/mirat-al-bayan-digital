import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Star } from 'lucide-react';

interface FloatingIcon {
  id: number;
  Icon: any;
  left: number;
  delay: number;
  duration: number;
}

export const BlackHole = () => {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const iconComponents = [Star, Sparkles, BookOpen];
    const generateIcons = () => {
      return Array.from({ length: 15 }, (_, i) => ({
        id: Date.now() + i,
        Icon: iconComponents[Math.floor(Math.random() * iconComponents.length)],
        left: 45 + Math.random() * 10, // Center around black hole (50% +/- 5%)
        delay: Math.random() * 20, // Random delay up to 20s
        duration: 15 + Math.random() * 10, // Duration between 15-25s
      }));
    };

    setIcons(generateIcons());

    // Regenerate icons periodically
    const interval = setInterval(() => {
      setIcons(generateIcons());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-x-0 top-16 h-80 overflow-hidden pointer-events-none z-10">
      {/* Black Hole with ambient glow */}
      <div 
        className={`absolute left-1/2 top-0 -translate-x-1/2 w-48 h-48 rounded-full transition-all duration-1000 ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, transparent 70%)',
        }}
      >
        {/* Ambient glow layers */}
        <div 
          className={`absolute inset-0 rounded-full animate-black-hole-pulse transition-opacity duration-1000 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'radial-gradient(circle, transparent 30%, rgba(139, 92, 246, 0.3) 50%, rgba(236, 72, 153, 0.2) 70%, transparent 90%)',
            filter: 'blur(20px)',
            transform: 'scale(1.5)',
          }}
        />
        <div 
          className={`absolute inset-0 rounded-full animate-black-hole-pulse transition-opacity duration-1000 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'radial-gradient(circle, transparent 40%, rgba(59, 130, 246, 0.2) 60%, rgba(167, 139, 250, 0.15) 80%, transparent 95%)',
            filter: 'blur(30px)',
            transform: 'scale(2)',
            animationDelay: '1.5s',
          }}
        />
        
        {/* Core black hole */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle, #000000 0%, #0a0a0a 50%, #1a1a1a 100%)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 50px rgba(139, 92, 246, 0.4)',
          }}
        />
      </div>

      {/* Floating icons */}
      {icons.map((icon) => (
        <div
          key={icon.id}
          className="absolute"
          style={{
            left: `${icon.left}%`,
            animation: `float-down ${icon.duration}s linear ${icon.delay}s infinite`,
          }}
        >
          <icon.Icon 
            className="text-white/30 dark:text-white/20" 
            size={16 + Math.random() * 8}
          />
        </div>
      ))}
    </div>
  );
};
