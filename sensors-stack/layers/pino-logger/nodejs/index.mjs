import pino from "pino";

const logger = pino({
  level: process.env.LOGGER_LEVEL || "info",
  base: undefined,
  timestamp: false,
  pid: false,
  hostname: false,
});

export default logger;
