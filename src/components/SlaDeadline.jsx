const SLA_HOURS = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

const computeDeadline = (createdAt, priority) => {
  const hours = SLA_HOURS[priority] || SLA_HOURS.MEDIUM;
  return new Date(new Date(createdAt).getTime() + hours * 3600 * 1000);
};

const formatTimeLeft = (ms) => {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) return `${hours}h ${totalMinutes % 60}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
};

const SlaDeadline = ({ createdAt, priority, status, compact = false }) => {
  if (!createdAt || !priority) return null;
  if (status === 'RESOLVED' || status === 'CLOSED') return null;

  const deadline = computeDeadline(createdAt, priority);
  const now = Date.now();
  const msLeft = deadline.getTime() - now;
  const breached = msLeft <= 0;
  const warning = !breached && msLeft < 3 * 3600 * 1000; // < 3h left

  const timeLabel = breached ? 'SLA breached' : `SLA: ${formatTimeLeft(msLeft)} left`;

  const baseClass = compact
    ? 'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full'
    : 'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full';

  const colorClass = breached
    ? 'bg-red-100 text-red-700'
    : warning
    ? 'bg-orange-100 text-orange-700'
    : 'bg-green-100 text-green-700';

  const icon = breached ? '⚠' : '⏱';

  return (
    <span className={`${baseClass} ${colorClass}`} title={`Due: ${deadline.toLocaleString()}`}>
      {icon} {timeLabel}
    </span>
  );
};

export default SlaDeadline;
