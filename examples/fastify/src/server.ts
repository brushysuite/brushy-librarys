import { createApp } from "./app.js";

const PORT = 3002;

const app = createApp();

const address = await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Fastify example ${address}`);
