import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Image as ImageIcon, Music2, X } from 'lucide-react';
import { Mp3Track } from '../types';

interface AudioPreviewPlayerProps {
  track: Mp3Track | null;
  onClose: () => void;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({ track, onClose }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (track && track.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.audioUrl);
      } else {
        audioRef.current.src = track.audioUrl;
      }

      audioRef.current.volume = isMuted ? 0 : volume;

      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration || 0);
        }
      };

      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);

      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('Autoplay prevented:', err));

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [track]);

  if (!track) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0) setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md shadow-2xl px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
        
        {/* Track info */}
        <div className="flex items-center space-x-3 w-1/4 min-w-[200px] truncate">
          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
            {track.coverArt?.dataUrl ? (
              <img src={track.coverArt.dataUrl} className="w-full h-full object-cover" />
            ) : (
              <Music2 className="w-5 h-5 text-indigo-400" />
            )}
          </div>

          <div className="truncate">
            <div className="font-bold text-white truncate">{track.title || track.originalFileName}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {track.artist || 'Unknown Artist'} {track.album ? `• ${track.album}` : ''}
            </div>
          </div>
        </div>

        {/* Playback Controls & Progress Slider */}
        <div className="flex flex-col items-center justify-center space-y-1 w-2/4 max-w-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full text-[11px] text-slate-400">
            <span className="w-8 text-right font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="w-8 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Close */}
        <div className="flex items-center justify-end space-x-3 w-1/4">
          <div className="flex items-center space-x-1.5 hidden sm:flex">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
