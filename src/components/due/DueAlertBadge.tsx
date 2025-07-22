// src/components/due/DueAlertBadge.tsx

import React from 'react';

interface Props {
  deliveryDate: string;
}

const DueAlertBadge: React.FC<Props> = ({ deliveryDate }) => {
  const today = new Date();
  const dueDate = new Date(deliveryDate);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let color = 'bg-green-200 text-green-800';
  let label = 'Upcoming';

  if (diffDays < 0) {
    color = 'bg-red-200 text-red-800';
    label = 'Overdue';
  } else if (diffDays <= 3) {
    color = 'bg-yellow-200 text-yellow-800';
    label = 'Due Soon';
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
};

export default DueAlertBadge;