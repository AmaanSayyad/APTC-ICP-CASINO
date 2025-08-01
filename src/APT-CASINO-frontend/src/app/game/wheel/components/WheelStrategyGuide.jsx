"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChevronDown, FaLightbulb, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

const WheelStrategyGuide = () => {
  const [activeTab, setActiveTab] = useState('beginners');
  
  const strategies = {
    beginners: [
      {
        title: "Start Small, Learn the Game",
        description: "Begin with small bets on the low-risk wheel to understand how the game works without risking too much of your bankroll.",
        icon: <FaLightbulb className="text-yellow-400" />
      },
      {
        title: "Set a Budget",
        description: "Decide how much you're willing to spend before you start playing and stick to it. Never chase losses.",
        icon: <FaChartLine className="text-green-400" />
      },
      {
        title: "Understand the Odds",
        description: "Take time to understand the probability of winning with each risk level. Low risk offers more frequent but smaller wins.",
        icon: <FaChartLine className="text-blue-400" />
      }
    ],
    intermediate: [
      {
        title: "Risk Level Switching",
        description: "After a series of wins on low risk, consider switching to medium risk for a few spins to potentially increase your profits.",
        icon: <FaLightbulb className="text-yellow-400" />
      },
      {
        title: "Profit Banking",
        description: "When you're on a winning streak, set aside a portion of your winnings (e.g., 50%) and continue playing with the rest.",
        icon: <FaChartLine className="text-green-400" />
      },
      {
        title: "Session Time Limits",
        description: "Set a time limit for your gaming sessions to prevent fatigue-based decision making. Take breaks regularly.",
        icon: <FaExclamationTriangle className="text-orange-400" />
      }
    ],
    advanced: [
      {
        title: "The Martingale Strategy",
        description: "Double your bet after each loss, so when you eventually win, you recover all previous losses plus a profit equal to your original bet. Use with caution and only with a large bankroll.",
        icon: <FaExclamationTriangle className="text-red-400" />
      },
      {
        title: "The D'Alembert Strategy",
        description: "Increase your bet by one unit after a loss and decrease it by one unit after a win. This is a more conservative approach than Martingale.",
        icon: <FaChartLine className="text-blue-400" />
      },
      {
        title: "The Fibonacci Strategy",
        description: "Follow the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...) for your bet sizes after losses, moving one step forward after a loss and two steps back after a win.",
        icon: <FaLightbulb className="text-yellow-400" />
      }
    ]
  };
  
  return (
    <div id="strategy-guide" className="my-16 px-4 md:px-8 lg:px-20 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-6 bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          Spin the Wheel Strategy Guide
        </h2>
        
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl border border-red-800/20 shadow-lg shadow-red-900/10 overflow-hidden">
          <div className="flex border-b border-red-800/20">
            <button 
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${activeTab === 'beginners' ? 'bg-red-900/30 text-white' : 'text-white/70 hover:bg-red-900/20'}`}
              onClick={() => setActiveTab('beginners')}
            >
              Beginner Strategies
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${activeTab === 'intermediate' ? 'bg-red-900/30 text-white' : 'text-white/70 hover:bg-red-900/20'}`}
              onClick={() => setActiveTab('intermediate')}
            >
              Intermediate Strategies
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${activeTab === 'advanced' ? 'bg-red-900/30 text-white' : 'text-white/70 hover:bg-red-900/20'}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced Strategies
            </button>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {strategies[activeTab].map((strategy, index) => (
                <div key={index} className="bg-black/20 rounded-lg p-4 border border-red-800/10">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center mr-3">
                      {strategy.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">{strategy.title}</h3>
                  </div>
                  <p className="text-white/70 pl-11">{strategy.description}</p>
                </div>
              ))}
            </div>
            
            {activeTab === 'advanced' && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-white/70 text-sm">
                    <span className="font-bold text-yellow-400 block mb-1">Risk Warning:</span>
                    Advanced strategies involve higher risk and are not guaranteed to work. Always gamble responsibly and be prepared to lose what you bet. These strategies can deplete your bankroll quickly if you encounter a long losing streak.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 bg-gradient-to-br from-blue-900/20 to-blue-800/5 rounded-xl p-6 border border-blue-800/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <FaLightbulb className="text-yellow-400 mr-2" />
            General Tips for Success
          </h3>
          
          <ul className="space-y-3 text-white/70">
            <li className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs">1</span>
              </div>
              <span>Never bet more than you can afford to lose. Gambling should be entertaining, not a financial burden.</span>
            </li>
            <li className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs">2</span>
              </div>
              <span>Take regular breaks to maintain clear decision-making.</span>
            </li>
            <li className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs">3</span>
              </div>
              <span>Keep track of your wins and losses to understand your playing patterns.</span>
            </li>
            <li className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs">4</span>
              </div>
              <span>Remember that each spin is independent of previous spins. Past results do not influence future outcomes.</span>
            </li>
            <li className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs">5</span>
              </div>
              <span>Consider using the auto-betting feature with stop-loss and take-profit limits to manage your risk.</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default WheelStrategyGuide; 