import React from 'react';

interface ControlCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const ControlCard: React.FC<ControlCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-5 border-l-4 ${color} shadow-md`}>
      <div className="flex justify-between items-start">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
        <div className={`text-${color.replace('border-', '')} mt-1`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <span className="text-4xl font-semibold text-gray-900 dark:text-white">{value}</span>
      </div>
    </div>
  );
};

export default ControlCard; 