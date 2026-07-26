console.log('2nd');

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { Server } from 'http';
import app from "./app";
import { env } from "./app/config/env";
import { startCronJobs } from './app/cron';
import { connectRedis } from './app/lib/redis';
import { seedUsers } from "./app/utils/seedAdmin";

let server: Server;

async function main() {
  try {
    // 1. Initial Logic (DB Seed, etc.)
    await connectRedis();
    await seedUsers();
    // await seedSuperAdmin();

    // 2. Start Listening
    server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      startCronJobs();
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }

  // 3. Handle Unhandled Rejections (e.g., failed DB connection during runtime)
  process.on('unhandledRejection', (error) => {
    console.log(`😈 unhandledRejection is detected , shutting down ...`, error);
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

// 4. Handle Uncaught Exceptions (e.g., console.log(undefinedVariable))
process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});

main();