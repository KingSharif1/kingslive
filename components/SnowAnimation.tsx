"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  swing: number;
  swingDirection: number;
  swingSpeed: number;
}

export default function SnowAnimation() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [animationStyle, setAnimationStyle] = useState<"snow" | "particles">("snow");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isDarkMode) {
      setSnowflakes([]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Create fewer snowflakes for a more subtle effect like rasmic.xyz
    const initialSnowflakes = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across screen
      y: Math.random() * 100, // percentage down screen
      size: Math.random() * 3 + 1.5, // increased sizes between 1.5-4.5px
      speed: Math.random() * 0.3 + 0.1, // slower speeds between 0.2-0.7
      opacity: Math.random() * 0.5 + 0.3, // slightly increased opacity between 0.3-0.8
      swing: 0, // current swing position
      swingDirection: Math.random() > 0.5 ? 1 : -1, // direction of swing
      swingSpeed: Math.random() * 0.8 + 0.2, // speed of swing
    }));

    setSnowflakes(initialSnowflakes);
    lastTimeRef.current = performance.now();
    
    // Animation loop with time-based movement
    const animateSnowflakes = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      setSnowflakes((prevSnowflakes) =>
        prevSnowflakes.map((flake) => {
          // Calculate movement based on time passed
          const timeScale = deltaTime / 16; // normalize to ~60fps
          
          // Move snowflake down at its speed
          let newY = flake.y + flake.speed * timeScale;
          
          // Update swing position
          let newSwing = flake.swing + (flake.swingSpeed * flake.swingDirection * timeScale * 0.05);
          
          // Reverse swing direction at extremes
          let newSwingDirection = flake.swingDirection;
          if (Math.abs(newSwing) > 1) {
            newSwingDirection = -flake.swingDirection;
            newSwing = newSwing > 0 ? 1 : -1;
          }
          
          // Calculate horizontal position with gentle swinging
          let newX = flake.x + (Math.sin(newY * 0.01) * 0.2 * newSwing);
          
          // Reset if snowflake goes off screen
          if (newY > 100) {
            newY = -2;
            newX = Math.random() * 100;
            newSwing = 0;
          }
          
          // Keep snowflake within horizontal bounds
          if (newX < 0) newX = 0;
          if (newX > 100) newX = 100;

          return {
            ...flake,
            x: newX,
            y: newY,
            swing: newSwing,
            swingDirection: newSwingDirection,
          };
        })
      );

      if (isDarkMode) {
        animationRef.current = requestAnimationFrame(animateSnowflakes);
      }
    };

    animationRef.current = requestAnimationFrame(animateSnowflakes);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isDarkMode]);

  if (!mounted) return null;

  if (!isDarkMode) return null;

  // Toggle animation style
  const toggleAnimationStyle = () => {
    setAnimationStyle(prev => prev === "snow" ? "particles" : "snow");
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-10">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className={`absolute ${animationStyle === "particles" ? "rounded-sm" : "rounded-full"} ${animationStyle === "particles" ? "bg-blue-400" : "bg-white"}`}
            style={{
              left: `${flake.x}%`,
              top: `${flake.y}%`,
              width: `${flake.size * (animationStyle === "particles" ? 0.8 : .5)}px`,
              height: `${flake.size * (animationStyle === "particles" ? 0.8 : .5)}px`,
              opacity: flake.opacity,
              boxShadow: animationStyle === "snow" 
                ? `0 0 ${flake.size * 1.5}px rgba(255, 255, 255, 0.4)` 
                : `0 0 ${flake.size * 2}px rgba(66, 153, 225, 0.5)`,
              transform: animationStyle === "snow"
                ? `scale(${1 + Math.sin(flake.y * 0.1) * 0.1})` 
                : `rotate(${flake.y * 4}deg) scale(${1 + Math.sin(flake.y * 0.2) * 0.2})`,
            }}
          />
        ))}
      </div>
      
      {/* Animation style toggle button - only visible in dark mode */}
      {isDarkMode && (
        <button 
          onClick={toggleAnimationStyle}
          className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs px-3 py-1 rounded-full opacity-50 hover:opacity-100 transition-opacity z-20 pointer-events-auto"
        >
          {animationStyle === "snow" ? "Switch to Particles" : "Switch to Snow"}
        </button>
      )}
    </>
  );
}
