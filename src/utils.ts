import pino from "pino";
import fs from "fs-extra";
import os from "os";

const LOG_FILE = `${os.homedir()}/.fast-together/app.log`;

fs.ensureFileSync(LOG_FILE);

export const logger = pino({
  transport: {
    targets: [
      { target: "pino-pretty", options: { destination: 1 } }, // Console
      {
        target: "pino/file",
        options: { destination: LOG_FILE },
      }, // File
    ],
  },
});
