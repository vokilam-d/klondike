const STARTING_HOUR = 4;
const STARTING_MINUTE = 10;
const MINUTES_IN_HOUR = 60;

let jobsCount = 0;

export function getCronExpressionEarlyMorning() {
  const minute = (STARTING_MINUTE + (jobsCount * 3)) % MINUTES_IN_HOUR;
  const hour = STARTING_HOUR + Math.floor(minute / MINUTES_IN_HOUR);

  jobsCount++;

  return `${minute} ${hour} * * *`;
}
