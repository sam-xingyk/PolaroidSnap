import React, { useState, useRef, useEffect } from 'react';
import { Camera } from './components/Camera';
import { PolaroidPhoto } from './components/PolaroidPhoto';
import { PhotoData } from './types';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [highestZ, setHighestZ] = useState(60); 
  const [flashActive, setFlashActive] = useState(false);
  const trashRef = useRef<HTMLDivElement>(null);

  const getBeijingDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}/${month}/${day}`;
  };

  const handleCapture = (imageData: string) => {
    // Trigger Global Flash
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const id = uuidv4();
    
    // Calculate spawn position (Top slot of camera)
    // Camera is centered on screen.
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    
    const photoW = 220;

    // Center X
    const startX = (viewportW / 2) - (photoW / 2);
    
    // Camera Top Edge Calculation:
    // Camera height is 360px. Center of camera is center of screen.
    // Camera Top Y = (viewportH / 2) - 180.
    const cameraTopY = (viewportH / 2) - 180;
    
    // Spawn Y:
    // We want the photo to start hidden behind the camera.
    // Camera Height: 360px. Photo Height: ~310px.
    // If we spawn too low (e.g. +80), the bottom of the photo (80+310=390) exceeds camera bottom (360) by 30px.
    // We reduce offset to 40px. 
    // Top = +40. Bottom = +350. Fits inside the 360px camera body.
    const spawnY = cameraTopY + 40; 
    
    const newPhoto: PhotoData = {
      id,
      imageData,
      timestamp: getBeijingDate(),
      rawTimestamp: Date.now(),
      caption: '@ANN_NNNG',
      x: startX, 
      y: spawnY, 
      rotation: (Math.random() - 0.5) * 4, // Reduced random tilt for cleaner stack
    };

    setPhotos((prev) => [...prev, newPhoto]);
  };

  const handleUpdateCaption = (id: string, newCaption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption: newCaption } : p))
    );
  };

  const bringToFront = (id: string) => {
    setHighestZ(prev => prev + 1);
  };

  const handleDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="relative w-full h-screen bg-[#eaeaea] bg-dots overflow-hidden flex items-center justify-center perspective-1000">
      
      {/* Global Flash Overlay */}
      <div 
        className={`fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-[400ms] ease-out ${flashActive ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Instructions */}
      <div className="absolute top-8 left-8 text-gray-400 font-hand text-sm pointer-events-none select-none z-0 opacity-60">
        <p className="mb-1">DRAG PHOTO TO MOVE</p>
        <p>DRAG TO TRASH TO DELETE</p>
      </div>

      {/* Trash Bin Area */}
      <div 
        ref={trashRef}
        className="absolute bottom-10 right-10 w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-full bg-black/5 z-0 transition-colors hover:bg-red-100/20 pointer-events-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </div>

      {/* Photos Layer */}
      {/* Photos start behind the camera (z-40) and move up. When dragged, they pop to front (z-100 via component state) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <AnimatePresence>
         {photos.map((photo, index) => (
           <PolaroidPhoto 
             key={photo.id} 
             data={photo} 
             onUpdateCaption={handleUpdateCaption}
             onDelete={handleDelete}
             // Base Z index ensures they are behind camera initially
             zIndex={40 + index} 
             onDragStart={() => bringToFront(photo.id)}
           />
         ))}
         </AnimatePresence>
      </div>

      {/* Camera Layer - Z-50 ensures it covers photos spawning from behind it */}
      <div className="z-50 pointer-events-none select-none flex flex-col items-center filter drop-shadow-2xl">
        <Camera onCapture={handleCapture} />
      </div>

    </div>
  );
};

export default App;