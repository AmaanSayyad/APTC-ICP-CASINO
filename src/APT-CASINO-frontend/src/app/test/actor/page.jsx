import React from "react";
import ActorTest from "../../../components/ActorTest";

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Actor Test Page</h1>
        <ActorTest />
      </div>
    </div>
  );
};

export default TestPage;
