import { env } from "./config/env";
import { createApp } from "./app";
import { initApiMonitoring } from "./lib/monitoring";

async function start() {
  initApiMonitoring();
  const app = createApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();