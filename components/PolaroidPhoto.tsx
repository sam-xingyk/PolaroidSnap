import React, { useState, useRef, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, animate } from 'framer-motion';
import { PhotoProps } from '../types';

export const PolaroidPhoto: React.FC<PhotoProps> = ({ data, onUpdateCaption, onDelete, zIndex: initialZIndex, onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use MotionValues to handle coordinate state seamlessly between animation and drag
  const x = useMotionValue(data.x);
  const y = useMotionValue(data.y);
  const rotate = useMotionValue(0);

  const [zIndex, setZIndex] = useState(initialZIndex);

  useEffect(() => {
    // Ejection Animation:
    // Explicitly set initial values to match spawn point
    x.set(data.x);
    y.set(data.y);
    rotate.set(0);

    const ejectDistance = 250; // Distance to travel upwards
    
    // Imperatively animate the motion values
    // This updates the x/y values that the drag gesture also uses, preventing conflicts
    const controlsY = animate(y, data.y - ejectDistance, {
      duration: 0.5, 
      ease: [0.175, 0.885, 0.32, 1.1], // Custom backOut for mechanical feel
      delay: 0.2
    });

    const controlsRotate = animate(rotate, data.rotation, {
      duration: 0.5,
      delay: 0.2
    });

    return () => {
      controlsY.stop();
      controlsRotate.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Check if dropped in trash (bottom right)
    const pointerX = info.point.x;
    const pointerY = info.point.y;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Trash zone tolerance (bottom right 150x150 area)
    if (pointerX > winW - 150 && pointerY > winH - 150) {
      onDelete(data.id);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, rotate, zIndex }}
      
      onPointerDown={() => {
        setZIndex(100); // Pop to top of stack immediately
        onDragStart();
      }}
      onDragEnd={handleDragEnd}
      
      // Visual feedback state
      whileHover={{ scale: 1.02, cursor: 'grab' }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      // REMOVED: transition-all duration-300 which causes drag lag
      className="absolute top-0 left-0 w-[220px] bg-white p-[12px] pb-[40px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] pointer-events-auto transition-shadow duration-200 hover:shadow-xl ring-0 hover:ring-2 hover:ring-pink-200/50"
    >
      {/* The Image Area */}
      <div className="w-full aspect-[1/1] bg-[#1a1a1a] mb-3 relative overflow-hidden">
        <img 
          src={data.imageData} 
          alt="Polaroid snap" 
          className="w-full h-full object-cover pointer-events-none select-none filter contrast-[1.1] brightness-[1.1] saturate-[1.1]"
          draggable={false}
        />
        
        {/* Realistic Glossy/Texture Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%221%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Text Area */}
      <div className="flex flex-col items-center justify-center font-hand text-gray-800 transform rotate-[0.5deg]">
        
        {/* Editable Caption */}
        <div className="relative w-full text-center h-8 flex items-center justify-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={data.caption}
              onChange={(e) => onUpdateCaption(data.id, e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="w-full bg-transparent text-center outline-none border-b border-gray-400 font-bold text-lg text-[#2a2a2a]"
              maxLength={20}
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="cursor-text text-lg font-bold tracking-tight text-[#2a2a2a] hover:text-gray-600 transition-colors"
            >
              {data.caption}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-[10px] font-bold tracking-[0.15em] mt-1 text-gray-400 font-sans">
          {data.timestamp}
        </div>
      </div>
    </motion.div>
  );
};