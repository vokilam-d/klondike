const STARTING_HOUR = 4;
const STARTING_MINUTE = 10;

let jobsCount = 0;

export function getCronExpressionEarlyMorning() {
  const minute = STARTING_MINUTE + (jobsCount * 3);
  const hour = STARTING_HOUR + Math.floor(minute / 60);

  jobsCount++;

  return `${minute} ${hour} * * *`;
}
