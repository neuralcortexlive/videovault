import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DownloadAnimationProps {
  progress: number;
  isComplete: boolean;
  className?: string;
}

export function DownloadAnimation({ progress, isComplete, className }: DownloadAnimationProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cubeRef.current || !liquidRef.current || !reflectionRef.current) return;

    if (isComplete) {
      // Animação de conclusão
      cubeRef.current.style.transform = 'rotateY(180deg) scale(1.2)';
      setTimeout(() => {
        cubeRef.current!.style.transform = 'rotateY(0deg) scale(1)';
      }, 500);
    } else {
      // Atualizar altura do líquido baseado no progresso
      const height = `${progress}%`;
      liquidRef.current.style.height = height;
      reflectionRef.current.style.opacity = `${progress / 100}`;
    }
  }, [progress, isComplete]);

  return (
    <div className={cn("relative w-32 h-32", className)}>
      <div
        ref={cubeRef}
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        style={{ perspective: '1000px' }}
      >
        {/* Face frontal */}
        <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-lg overflow-hidden">
          <div
            ref={liquidRef}
            className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-300"
            style={{ height: '0%' }}
          />
          <div
            ref={reflectionRef}
            className="absolute inset-0 bg-white/20 transition-opacity duration-300"
            style={{ opacity: 0 }}
          />
        </div>

        {/* Face traseira (ícone de sucesso) */}
        <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-lg backface-hidden transform rotate-y-180 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
} 