import { CSSProperties, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  shimmerWidth?: number;
  speed?: number;
  disabled?: boolean;
}

const GlitchText: FC<GlitchTextProps> = ({
  text,
  className,
  shimmerWidth = 120,
  speed = 4,
  disabled = false,
}) => {
  return (
    <div
      style={
        {
          "--shimmer-width": `${shimmerWidth}px`,
          animationDuration: `${speed}s`,
          "--shine-start": "rgba(192, 192, 192, 0.8)",
          "--shine-middle": "rgba(255, 255, 255, 1)",
          "--shine-end": "rgba(192, 192, 192, 0.8)",
          backgroundImage: `linear-gradient(120deg, 
            var(--shine-start) 40%, 
            var(--shine-middle) 50%, 
            var(--shine-end) 60%
          )`,
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
        } as CSSProperties
      }
      className={cn(
        "inline-block bg-clip-text text-transparent font-bold text-4xl tracking-tight",
        !disabled && "animate-shine",
        className
      )}
    >
      {text}
    </div>
  );
};

export { GlitchText }; 