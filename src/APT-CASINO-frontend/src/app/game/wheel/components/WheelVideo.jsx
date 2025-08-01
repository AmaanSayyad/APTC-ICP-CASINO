"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaExpand } from 'react-icons/fa';

const WheelVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div id="wheel-video" className="my-16 px-4 md:px-8 lg:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="relative"
      >
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-4 bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          Fortune Wheel in Action
        </h2>
        
        <div className="relative aspect-video rounded-xl overflow-hidden border border-red-800/20 shadow-lg shadow-red-900/10">
          {!isPlaying ? (
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-red-700/10 flex flex-col items-center justify-center cursor-pointer" onClick={handlePlay}>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600/80 rounded-full flex items-center justify-center animate-pulse">
                <FaPlay className="text-white text-xl ml-1" />
              </div>
              <p className="text-white font-medium mt-4">Watch Gameplay Video</p>
            </div>
          ) : null}
          
          {isPlaying ? (
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/M3EWcKHuzi8?autoplay=1"
              title="Fortune Wheel Gameplay"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full bg-black/80">
              <img 
                src="https://img.youtube.com/vi/M3EWcKHuzi8/maxresdefault.jpg" 
                alt="Fortune Wheel Gameplay Video Thumbnail" 
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          )}
          
          {!isPlaying && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-white/70">
              <FaExpand />
              <span>Click to play</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-white/70 text-sm">
          <p>Watch our Fortune Wheel game in action! This video demonstrates how to place bets, select risk levels, and maximize your winnings.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default WheelVideo; 