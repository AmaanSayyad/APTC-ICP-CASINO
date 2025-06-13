import React, { useState, useEffect } from "react";
import HeaderText from "../components/HeaderText";
import StatsOverview from "../components/StatsOverview";
import UniswapWidget from "../components/UniswapWidget";
import LendingTable from "../components/LendingTable";
import { FaWallet, FaInfoCircle, FaExchangeAlt, FaCoins, FaLock, FaUnlock, FaHistory } from "react-icons/fa";

// Mock transaction history for demonstration
const MOCK_TRANSACTIONS = [
  {
    type: "deposit",
    token: "APTC",
    amount: "120.5",
    timestamp: "2024-01-15",
    status: "completed"
  },
  {
    type: "withdraw",
    token: "ICP",
    amount: "50.0",
    timestamp: "2024-01-14",
    status: "completed"
  }
];

const BankPage = () => {
  const [activeTab, setActiveTab] = useState("lend");
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeaderText 
          title="APT Bank" 
          subtitle="Lend, borrow, and manage your crypto assets"
        />
        
        <StatsOverview />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lending/Borrowing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-4 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("lend")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "lend"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <FaCoins className="inline mr-2" />
                Lend Assets
              </button>
              <button
                onClick={() => setActiveTab("borrow")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "borrow"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <FaWallet className="inline mr-2" />
                Borrow Assets
              </button>
            </div>

            {/* Lending Tab */}
            {activeTab === "lend" && (
              <div className="space-y-6">
                <LendingTable />
              </div>
            )}

            {/* Borrowing Tab */}
            {activeTab === "borrow" && (
              <div className="space-y-6">
                {/* Quick Borrow - ICP Integration Coming Soon */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <FaWallet className="mr-2 text-yellow-400" />
                    Quick Borrow
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <p className="text-gray-300 text-center">
                        🚧 ICP-based borrowing functionality coming soon!
                      </p>
                      <p className="text-sm text-gray-400 text-center mt-2">
                        Connect with NFID to access upcoming lending features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Widgets & Info */}
          <div className="space-y-6">
            {/* DEX Widget */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FaExchangeAlt className="mr-2 text-green-400" />
                Token Swap
              </h3>
              <UniswapWidget />
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-400" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Supplied</span>
                  <span className="text-green-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Borrowed</span>
                  <span className="text-red-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net APY</span>
                  <span className="text-blue-400">0.00%</span>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FaHistory className="mr-2 text-purple-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            tx.type === 'deposit' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <span className="text-sm capitalize">{tx.type} {tx.token}</span>
                        </div>
                        <span className="text-sm text-gray-400">{tx.amount}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{tx.timestamp}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center text-sm">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankPage;
