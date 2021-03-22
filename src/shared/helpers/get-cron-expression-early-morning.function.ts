const STARTING_HOUR = 2;
const STARTING_MINUTE = 10;
const MINUTES_IN_HOUR = 60;
const DELAY_BETWEEN_JOBS_IN_MINS = 2;

let jobsCount = 0;

export function getCronExpressionEarlyMorning() {
  const minute = (STARTING_MINUTE + (jobsCount * DELAY_BETWEEN_JOBS_IN_MINS)) % MINUTES_IN_HOUR;
  const hour = STARTING_HOUR + Math.floor(minute / MINUTES_IN_HOUR);

  jobsCount++;

  return `${minute} ${hour} * * *`;
}
