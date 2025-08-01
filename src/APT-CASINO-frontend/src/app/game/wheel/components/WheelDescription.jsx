"use client";

import { motion } from 'framer-motion';
import { FaCheckCircle, FaInfoCircle, FaCoins, FaRandom } from 'react-icons/fa';
import { GiWheelbarrow, GiTrophyCup } from 'react-icons/gi';

const WheelDescription = () => {
  return (
    <div id="description" className="my-16 px-4 md:px-8 lg:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-4 bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          About Fortune Wheel
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-white/70">
            <p className="mb-4">
              Fortune Wheel is an exciting casino game that combines simplicity with the thrill of unpredictable outcomes. 
              Players place bets on where they think the wheel will land, with different risk levels offering various potential rewards.
            </p>
            
            <p className="mb-4">
              The game features a spinning wheel divided into segments, each representing a different multiplier. 
              The higher the risk level you choose, the greater the potential rewards – but also the higher chance of losing your bet.
            </p>
            
            <p>
              With our provably fair system, you can verify that each spin result is completely random and not manipulated. 
              Fortune Wheel offers an adrenaline-pumping experience with the chance to win up to 50x your initial bet!
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span>Provably fair</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span>Multiple risk levels</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span>Win up to 50x</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span>Instant results</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-6 border border-red-800/20 shadow-lg shadow-red-900/10">
            <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
            
            <ol className="list-decimal list-inside space-y-3 text-white/70">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/50 text-white mr-2 flex-shrink-0 mt-0.5">1</span>
                <span>Choose your risk level (Low, Medium, or High). Higher risk means higher potential rewards but lower chances of winning.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/50 text-white mr-2 flex-shrink-0 mt-0.5">2</span>
                <span>Enter your bet amount. Make sure it\'s within your available balance.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/50 text-white mr-2 flex-shrink-0 mt-0.5">3</span>
                <span>Click the "Spin" button to start the wheel.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/50 text-white mr-2 flex-shrink-0 mt-0.5">4</span>
                <span>Wait for the wheel to stop spinning to see if you've won.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/50 text-white mr-2 flex-shrink-0 mt-0.5">5</span>
                <span>If the wheel lands on a winning segment, your bet will be multiplied by the corresponding value.</span>
              </li>
            </ol>
            
            <div className="mt-6 p-3 bg-black/30 rounded-lg border border-red-800/10">
              <div className="flex items-center text-amber-400">
                <FaInfoCircle className="mr-2" />
                <h4 className="font-medium">Pro Tip</h4>
              </div>
              <p className="text-white/70 text-sm mt-1">
                Start with the low risk level to get familiar with the game mechanics. Once comfortable, you can experiment with higher risk levels for bigger potential rewards.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-red-900/10 to-red-800/5 rounded-xl p-4 border border-red-800/10">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center mr-2">
                <GiWheelbarrow className="text-red-300" />
              </div>
              <h3 className="font-bold text-white">Risk Levels</h3>
            </div>
            <p className="text-white/70 text-sm">
              Choose from Low, Medium, or High risk levels. Each affects the wheel's segment distribution and potential multipliers.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/10 to-blue-800/5 rounded-xl p-4 border border-blue-800/10">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                <FaCoins className="text-yellow-300" />
              </div>
              <h3 className="font-bold text-white">Multipliers</h3>
            </div>
            <p className="text-white/70 text-sm">
              Win up to 50x your bet with the right spin! Different wheel segments offer various multiplier values.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/10 to-green-800/5 rounded-xl p-4 border border-green-800/10">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center mr-2">
                <GiTrophyCup className="text-green-300" />
              </div>
              <h3 className="font-bold text-white">Auto-Betting</h3>
            </div>
            <p className="text-white/70 text-sm">
              Use our auto-betting feature to place multiple bets automatically with customizable settings.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WheelDescription; 