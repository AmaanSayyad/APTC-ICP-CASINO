import React from "react";
import BalanceTest from "../../../components/BalanceTest";

const BalanceTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Balance Test Page
        </h1>
        <BalanceTest />
      </div>
    </div>
  );
};

export default BalanceTestPage;
