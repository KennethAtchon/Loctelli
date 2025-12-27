import log from "loglevel";
import { ENV_CONFIG } from "./utils/envUtils";

// Set default log level based on environment
if (ENV_CONFIG.IS_PRODUCTION) {
  log.setLevel("warn");
} else {
  log.setLevel("debug");
}

// Optionally allow runtime override
export function setLogLevel(level: log.LogLevelDesc) {
  log.setLevel(level);
}

export default log;
