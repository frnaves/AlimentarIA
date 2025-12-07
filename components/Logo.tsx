import React from 'react';
import { Brain, Leaf, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'lg', showTagline = false }) => {
  const iconSize = size === 'lg' ? 48 : size === 'md' ? 32 : 24;
  const textSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-lg';
  const leafSize = size === 'lg' ? 24 : size === 'md' ? 16 : 12;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center mb-2">
        {/* Brain representing AI/Intelligence */}
        <Brain 
            size={iconSize} 
            className="text-violet-600 relative z-10" 
            strokeWidth={1.5} 
        />
        
        {/* Leaf representing Food/Nature intertwined */}
        <div className="absolute -bottom-1 -right-2 z-20 bg-white rounded-full p-0.5 border border-white">
            <Leaf 
                size={leafSize} 
                className="text-emerald-500 fill-emerald-100" 
            />
        </div>

        {/* Sparkle representing the magic of AI */}
        <Sparkles 
            size={leafSize}
            className="text-amber-400 absolute -top-1 -left-2 animate-pulse"
        />
      </div>

      <div className="flex items-baseline tracking-tight">
        {/* Nature Font Style */}
        <span className={`font-sans font-bold text-emerald-700 ${textSize}`}>
          Alimentar
        </span>
        
        {/* Tech Font Style */}
        <span className={`font-tech font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent ml-0.5 ${textSize}`}>
          IA
        </span>
      </div>
      
      {showTagline && (
        <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">
          Nutrição Inteligente
        </p>
      )}
    </div>
  );
};