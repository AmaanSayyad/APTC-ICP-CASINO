"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaChartPie, FaPercent, FaInfoCircle } from 'react-icons/fa';

const WheelProbability = () => {
  const [selectedRisk, setSelectedRisk] = useState('medium');
  
  const riskData = {
    low: {
      segments: [
        { multiplier: '0x', count: 2, color: '#e74c3c', probability: '20%' },
        { multiplier: '1.2x', count: 4, color: '#27ae60', probability: '40%' },
        { multiplier: '1.5x', count: 2, color: '#2980b9', probability: '20%' },
        { multiplier: '2x', count: 1, color: '#f39c12', probability: '10%' },
        { multiplier: '3x', count: 1, color: '#9b59b6', probability: '10%' }
      ],
      houseEdge: '2.7%',
      maxMultiplier: '3x',
      description: 'Low risk offers more frequent but smaller wins. It\'s ideal for beginners or those who prefer consistent results over big wins.'
    },
    medium: {
      segments: [
        { multiplier: '0x', count: 4, color: '#e74c3c', probability: '40%' },
        { multiplier: '1.5x', count: 2, color: '#27ae60', probability: '20%' },
        { multiplier: '2x', count: 2, color: '#2980b9', probability: '20%' },
        { multiplier: '5x', count: 1, color: '#f39c12', probability: '10%' },
        { multiplier: '10x', count: 1, color: '#9b59b6', probability: '10%' }
      ],
      houseEdge: '3.5%',
      maxMultiplier: '10x',
      description: 'Medium risk balances win frequency with payout potential. It\'s suitable for players who have some experience and want a chance at bigger wins.'
    },
    high: {
      segments: [
        { multiplier: '0x', count: 7, color: '#e74c3c', probability: '70%' },
        { multiplier: '3x', count: 1, color: '#27ae60', probability: '10%' },
        { multiplier: '5x', count: 1, color: '#2980b9', probability: '10%' },
        { multiplier: '20x', count: 0.5, color: '#f39c12', probability: '5%' },
        { multiplier: '50x', count: 0.5, color: '#9b59b6', probability: '5%' }
      ],
      houseEdge: '4.5%',
      maxMultiplier: '50x',
      description: 'High risk has less frequent wins but offers the biggest potential payouts. It\'s for experienced players who are comfortable with volatility.'
    }
  };

  return (
    <div id="probability" className="my-16 px-4 md:px-8 lg:px-20 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-6 bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          Win Probabilities
        </h2>
        
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/5 rounded-xl border border-blue-800/20 shadow-lg shadow-blue-900/10 overflow-hidden">
          <div className="flex border-b border-blue-800/20">
            <button 
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${selectedRisk === 'low' ? 'bg-blue-900/30 text-white' : 'text-white/70 hover:bg-blue-900/20'}`}
              onClick={() => setSelectedRisk('low')}
            >
              Low Risk
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${selectedRisk === 'medium' ? 'bg-blue-900/30 text-white' : 'text-white/70 hover:bg-blue-900/20'}`}
              onClick={() => setSelectedRisk('medium')}
            >
              Medium Risk
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${selectedRisk === 'high' ? 'bg-blue-900/30 text-white' : 'text-white/70 hover:bg-blue-900/20'}`}
              onClick={() => setSelectedRisk('high')}
            >
              High Risk
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3">
                    <FaChartPie className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedRisk.charAt(0).toUpperCase() + selectedRisk.slice(1)} Risk Wheel</h3>
                </div>
                
                <p className="text-white/70 mb-6">{riskData[selectedRisk].description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/20 rounded-lg p-3 border border-blue-800/10">
                    <div className="text-xs text-white/50 mb-1">House Edge</div>
                    <div className="text-xl font-bold text-white flex items-center">
                      {riskData[selectedRisk].houseEdge}
                      <FaPercent className="ml-1 text-blue-400 text-sm" />
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-3 border border-blue-800/10">
                    <div className="text-xs text-white/50 mb-1">Max Multiplier</div>
                    <div className="text-xl font-bold text-white">{riskData[selectedRisk].maxMultiplier}</div>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4 border border-blue-800/10">
                  <div className="flex items-center mb-3">
                    <FaInfoCircle className="text-blue-400 mr-2" />
                    <h4 className="font-medium text-white">Understanding Win Probability</h4>
                  </div>
                  <p className="text-white/70 text-sm">
                    The wheel is divided into segments, each with a specific multiplier. The probability of landing on any segment depends on its size relative to the whole wheel. Higher multipliers have smaller segments, making them less likely to hit.
                  </p>
                </div>
              </div>
              
              <div>
                <div className="bg-black/30 rounded-xl p-4 border border-blue-800/10 h-full">
                  <h4 className="font-medium text-white mb-3 flex items-center">
                    <FaChartBar className="text-blue-400 mr-2" />
                    Segment Distribution
                  </h4>
                  
                  <div className="space-y-4">
                    {riskData[selectedRisk].segments.map((segment, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white">{segment.multiplier}</span>
                          <span className="text-white/70">{segment.probability}</span>
                        </div>
                        <div className="w-full h-6 bg-black/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: segment.probability,
                              backgroundColor: segment.color,
                              transition: 'width 0.5s ease-out'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-800/10">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Win Chance: {100 - parseInt(riskData[selectedRisk].segments[0].probability)}%</span>
                      <span>Loss Chance: {riskData[selectedRisk].segments[0].probability}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-blue-900/20 rounded-lg border border-blue-800/10 text-sm text-white/70">
              <p>
                <span className="font-medium text-blue-300">Note:</span> All results are generated using a provably fair algorithm. Each spin is completely random and independent of previous spins.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WheelProbability; 