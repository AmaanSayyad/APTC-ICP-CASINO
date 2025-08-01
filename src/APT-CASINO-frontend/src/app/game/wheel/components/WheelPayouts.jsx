"use client";

import { motion } from 'framer-motion';
import { FaCoins, FaCalculator, FaExchangeAlt } from 'react-icons/fa';
import { GiTwoCoins, GiCoinsPile, GiPayMoney } from 'react-icons/gi';

const WheelPayouts = () => {
  const payoutExamples = [
    { 
      risk: 'Low Risk',
      examples: [
        { bet: 100, multiplier: '1.2x', payout: 120, profit: 20 },
        { bet: 100, multiplier: '1.5x', payout: 150, profit: 50 },
        { bet: 100, multiplier: '2x', payout: 200, profit: 100 },
        { bet: 100, multiplier: '3x', payout: 300, profit: 200 }
      ]
    },
    { 
      risk: 'Medium Risk',
      examples: [
        { bet: 100, multiplier: '1.5x', payout: 150, profit: 50 },
        { bet: 100, multiplier: '2x', payout: 200, profit: 100 },
        { bet: 100, multiplier: '5x', payout: 500, profit: 400 },
        { bet: 100, multiplier: '10x', payout: 1000, profit: 900 }
      ]
    },
    { 
      risk: 'High Risk',
      examples: [
        { bet: 100, multiplier: '3x', payout: 300, profit: 200 },
        { bet: 100, multiplier: '5x', payout: 500, profit: 400 },
        { bet: 100, multiplier: '20x', payout: 2000, profit: 1900 },
        { bet: 100, multiplier: '50x', payout: 5000, profit: 4900 }
      ]
    }
  ];

  return (
    <div id="payouts" className="my-16 px-4 md:px-8 lg:px-20 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-6 bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          Wheel Payouts
        </h2>
        
        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/5 rounded-xl border border-yellow-800/20 shadow-lg shadow-yellow-900/10 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center mr-3">
                <FaCalculator className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Payout Calculation</h3>
                <p className="text-white/70 text-sm">Your payout is calculated by multiplying your bet amount by the multiplier shown on the wheel segment.</p>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg border border-yellow-800/10 mb-6">
              <div className="flex items-center mb-3">
                <FaCoins className="text-yellow-400 mr-2" />
                <h4 className="font-medium text-white">Payout Formula</h4>
              </div>
              <div className="flex items-center justify-center p-3 bg-black/30 rounded-lg">
                <div className="text-center px-4 py-2 bg-yellow-900/30 rounded-lg border border-yellow-800/20">
                  <span className="text-white/70">Bet Amount</span>
                </div>
                <div className="mx-3 text-yellow-400">
                  <FaExchangeAlt />
                </div>
                <div className="text-center px-4 py-2 bg-yellow-900/30 rounded-lg border border-yellow-800/20">
                  <span className="text-white/70">Multiplier</span>
                </div>
                <div className="mx-3 text-yellow-400">
                  =
                </div>
                <div className="text-center px-4 py-2 bg-green-900/30 rounded-lg border border-green-800/20">
                  <span className="text-green-300">Payout</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {payoutExamples.map((riskLevel, index) => (
                <div key={index}>
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                    <GiTwoCoins className="text-yellow-400 mr-2" />
                    {riskLevel.risk} Payouts
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="bg-black/30 border-b border-yellow-800/20">
                          <th className="py-2 px-4 text-left">Bet Amount</th>
                          <th className="py-2 px-4 text-left">Multiplier</th>
                          <th className="py-2 px-4 text-left">Payout</th>
                          <th className="py-2 px-4 text-left">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskLevel.examples.map((example, exIndex) => (
                          <tr key={exIndex} className="border-b border-yellow-800/10 hover:bg-black/20">
                            <td className="py-2 px-4">
                              <div className="flex items-center">
                                <GiPayMoney className="text-yellow-400 mr-2" />
                                <span>{example.bet} APTC</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">{example.multiplier}</td>
                            <td className="py-2 px-4 font-medium text-yellow-300">{example.payout} APTC</td>
                            <td className="py-2 px-4 font-medium text-green-400">+{example.profit} APTC</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-black/20 rounded-lg border border-yellow-800/10">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-yellow-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <GiCoinsPile className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Maximum Payout</h4>
                  <p className="text-white/70 text-sm">
                    The maximum payout per spin is capped at 1,000,000 APTC. This means that regardless of your bet amount and the multiplier, you cannot win more than 1,000,000 APTC in a single spin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WheelPayouts; 