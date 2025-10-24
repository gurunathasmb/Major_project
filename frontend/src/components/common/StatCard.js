// filepath: C:\Users\mohit\Desktop\Major project\src\components\common\StatCard.js
import React from "react";

export default function StatCard({title, value, icon}) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
      <div className="text-blue-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}