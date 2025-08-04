// components/dashboard/ModuleCard.tsx

import React from 'react';

interface ModuleCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export default function ModuleCard({ title, icon, onClick }: ModuleCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer text-center flex flex-col items-center justify-center border border-gray-200"
    >
      <div className="text-4xl text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
  );
}