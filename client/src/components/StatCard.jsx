import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  prefix = '',
  suffix = '',
}) => {
  let isPositive = false;
  let trendText = '';

  if (trend !== undefined && trend !== null) {
    if (typeof trend === 'object') {
      isPositive = trend.isPositive ?? (trend.value >= 0);
      trendText = `${Math.abs(trend.value)}%`;
    } else if (typeof trend === 'number') {
      isPositive = trend >= 0;
      trendText = `${Math.abs(trend)}%`;
    } else {
      trendText = String(trend);
      isPositive = !trendText.startsWith('-');
    }
  }

  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <div className="stat-value">
          {prefix}{value !== undefined && value !== null ? value.toLocaleString ? value.toLocaleString('en-IN') : value : 0}{suffix}
        </div>
        {trendText && (
          <div className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trendText} vs yesterday</span>
          </div>
        )}
      </div>

      {Icon && (
        <div className={`stat-icon-wrapper ${color}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
