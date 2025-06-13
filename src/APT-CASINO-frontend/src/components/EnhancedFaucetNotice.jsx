import React from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

/**
 * This is a notice to display at the top of the balance test page
 * to inform users about the enhanced token faucet implementation.
 */
const EnhancedFaucetNotice = () => {
  return (
    <motion.div
      className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 mb-6 text-white shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold mb-2">
        🚀 Enhanced Token Faucet Available
      </h2>
      <p className="mb-2">
        We've implemented an enhanced token faucet solution to fix the "Cannot
        find field hash" error that some users have experienced. This solution
        uses a direct approach to claim tokens and provides better error
        handling.
      </p>
      <div className="flex space-x-2 mt-3">
        <Link
          to="/test/balance-enhanced"
          className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
        >
          Try Enhanced Faucet
        </Link>
        <a
          href="https://github.com/aditya/APT-CASINO/blob/main/HASH_FIELD_ERROR_FIXES.md"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-700 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800 transition-colors"
        >
          View Documentation
        </a>
      </div>
    </motion.div>
  );
};

export default EnhancedFaucetNotice;
