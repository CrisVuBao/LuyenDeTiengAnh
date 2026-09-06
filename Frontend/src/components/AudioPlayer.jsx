import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';

export default function AudioPlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds) => {
    audioRef.current.currentTime += seconds;
  };

  const handleTimeUpdate = () => {
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = (x / rect.width) * audioRef.current.duration;
    audioRef.current.currentTime = clickedValue;
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-xl shadow-md flex flex-col gap-3 w-full max-w-md">
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button onClick={() => skip(-5)} className="hover:text-blue-400 transition" title="Tua lại 5s">
          <RotateCcw size={24} />
        </button>
        
        <button 
          onClick={togglePlay} 
          className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        
        <button onClick={() => skip(5)} className="hover:text-blue-400 transition" title="Tua đi 5s">
          <RotateCw size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 text-xs">
        <span>{Math.floor(audioRef.current?.currentTime || 0)}s</span>
        <div 
          className="h-2 flex-grow bg-gray-600 rounded-full cursor-pointer relative"
          onClick={handleSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full pointer-events-none" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{Math.floor(duration || 0)}s</span>
      </div>
    </div>
  );
}
