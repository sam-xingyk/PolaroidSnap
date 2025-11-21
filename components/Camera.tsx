import React, { useEffect, useRef, useState } from 'react';
import { CameraProps } from '../types';

export const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', aspectRatio: 1 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStreamReady(true);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();
  }, []);

  const playShutterSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // Generate white noise buffer for mechanical sound
    const bufferSize = ctx.sampleRate * 0.1; // 0.1 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Part 1: The "Click"
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    
    // Filter to make it sound more mechanical (lowpass)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    // Part 2: The "Clack" (slightly delayed shutter close)
    const noise2 = ctx.createBufferSource();
    noise2.buffer = buffer;
    const noiseGain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 1500;

    noiseGain2.gain.setValueAtTime(0.3, t + 0.06);
    noiseGain2.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    
    noise2.connect(filter2);
    filter2.connect(noiseGain2);
    noiseGain2.connect(ctx.destination);
    noise2.start(t + 0.06);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Play sound
    playShutterSound();

    // Local bulb flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(imageData);
    }
  };

  return (
    <div className="relative pointer-events-auto select-none">
       <canvas ref={canvasRef} className="hidden" />

      {/* --- Camera Body Shape --- */}
      {/* Added a higher z-index context for the body so photos slide from behind */}
      <div className="relative w-[380px] h-[360px] bg-[#FDFBF7] rounded-[3.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5),inset_0_-4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.8)] flex flex-col items-center justify-start pt-8 z-10">
        
        {/* Subtle texture */}
        <div className="absolute inset-0 rounded-[3.5rem] opacity-[0.03] bg-repeat bg-[length:4px_4px] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)' }} 
        />

        {/* Ejection Slot (Top) - Made visually distinct */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-52 h-5 bg-[#1a1a1a] rounded-t-lg shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] z-0">
            {/* The lip of the slot */}
            <div className="absolute bottom-0 w-full h-1 bg-[#333]"></div>
        </div>

        {/* --- Top Section: Flash & Viewfinder --- */}
        <div className="w-full px-10 flex justify-between items-start mt-4 z-10">
          
          {/* Flash (Left) */}
          <div className="relative w-24 h-14 bg-[#e5e5e5] rounded-2xl border border-[#d1d1d1] shadow-[inset_0_2px_6px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center">
             {/* Fresnel Lens Texture */}
             <div className="absolute inset-1 border border-[#ccc] bg-[#f0f0f0] grid grid-cols-6 gap-[1px] opacity-80 overflow-hidden rounded-lg">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="bg-gradient-to-b from-transparent to-[#ddd] w-full h-full"></div>
               ))}
             </div>
             {/* Bulb tint */}
             <div className="absolute inset-0 bg-yellow-100 opacity-20 mix-blend-overlay"></div>
             
             {/* Flash Animation Overlay */}
             {isFlashing && (
                <div className="absolute inset-0 bg-white shadow-[0_0_60px_30px_rgba(255,255,255,0.9)] z-50 animate-ping"></div>
             )}
          </div>

          {/* Branding / Sensor Holes (Center) */}
          <div className="flex gap-3 mt-4 opacity-40">
            <div className="w-3 h-3 bg-black rounded-full shadow-inner"></div>
            <div className="w-3 h-3 bg-black rounded-full shadow-inner"></div>
          </div>

          {/* Viewfinder (Right) */}
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-2xl border-[3px] border-[#dcdcdc] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-[#333] to-[#000]"></div>
             <div className="absolute top-2 left-2 w-4 h-4 bg-blue-900 rounded-full opacity-40 blur-[2px]"></div>
             <div className="absolute bottom-2 right-2 w-2 h-2 bg-white opacity-20 rounded-full blur-[1px]"></div>
          </div>
        </div>

        {/* --- Main Lens Assembly (Center) --- */}
        <div className="relative mt-2 z-20">
           {/* 1. Outer Body Bulge */}
           <div className="w-[260px] h-[260px] rounded-full bg-[#FDFBF7] shadow-[8px_14px_20px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.8),inset_0_0_20px_rgba(0,0,0,0.05)] flex items-center justify-center border border-[#f0efe9]">
              
              {/* 2. Silver Ring */}
              <div className="w-[220px] h-[220px] rounded-full bg-gradient-to-br from-[#e2e2e2] via-[#f5f5f5] to-[#bababa] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center justify-center border border-[#bfbfbf]">
                 
                 {/* 3. Black Lens Housing (Retractable part) */}
                 <div className="w-[190px] h-[190px] rounded-full bg-[#111] shadow-[inset_0_4px_12px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center relative border-[4px] border-[#222]">
                    
                    {/* Text on lens */}
                    <div className="absolute top-3 text-[8px] text-gray-500 tracking-[0.2em] font-sans uppercase font-bold">
                       Instant Lens 60mm
                    </div>

                    {/* 4. The Actual Lens (Video) */}
                    <div className="w-[140px] h-[140px] rounded-full overflow-hidden relative bg-black shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-700 ${streamReady ? 'opacity-100' : 'opacity-0'}`}
                      />
                      
                      {/* Lens Glass Reflections */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-blue-300/10 pointer-events-none"></div>
                      <div className="absolute top-8 right-10 w-12 h-6 bg-white opacity-20 rounded-full blur-md rotate-[-45deg] pointer-events-none"></div>
                      <div className="absolute bottom-6 left-8 w-4 h-2 bg-white opacity-30 rounded-full blur-sm pointer-events-none"></div>
                    </div>

                 </div>
              </div>
           </div>

           {/* Focus Sensor / Extra Detail on Lens Ring */}
           <div className="absolute bottom-8 left-6 w-4 h-4 bg-[#333] rounded-full border border-gray-600 shadow-sm"></div>
        </div>

        {/* --- Shutter Button --- */}
        <button 
          onClick={takePhoto}
          className="absolute bottom-[50px] left-[20px] w-16 h-16 rounded-full bg-[#FDFBF7] shadow-[-4px_-4px_10px_rgba(255,255,255,1),4px_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center group active:scale-95 transition-all cursor-pointer z-30"
        >
           <div className="w-12 h-12 rounded-full bg-[#E88F88] border-2 border-[#dcaaaa] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] group-hover:bg-[#ef9a93] transition-colors"></div>
        </button>

         {/* Power Switch / Mode Dial (Decorative) on Right */}
        <div className="absolute bottom-[60px] right-[30px] w-8 h-8 rounded-full bg-[#dcdcdc] border border-[#bbb] flex items-center justify-center shadow-inner">
           <div className="w-1 h-4 bg-[#999] rounded-full transform rotate-45"></div>
        </div>

        {/* Strap Lugs */}
        <div className="absolute left-[-8px] top-1/2 w-3 h-10 bg-[#d1d1d1] rounded-r-md shadow-md border-l border-[#aaa]"></div>
        <div className="absolute right-[-8px] top-1/2 w-3 h-10 bg-[#d1d1d1] rounded-l-md shadow-md border-r border-[#aaa]"></div>

      </div>
    </div>
  );
};