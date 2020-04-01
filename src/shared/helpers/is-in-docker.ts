import * as fs from 'fs';

let isDocker;

function hasDockerEnv() {
  try {
    fs.statSync('/.dockerenv');
    return true;
  } catch (_) {
    return false;
  }
}

function hasDockerCGroup() {
  try {
    return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
  } catch (_) {
    return false;
  }
}

export function isInDocker() {
  if (isDocker === undefined) {
    isDocker = hasDockerEnv() || hasDockerCGroup();
  }

  return isDocker;
}
