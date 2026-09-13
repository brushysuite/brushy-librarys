import { createApp } from "./app.js";

const PORT = 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Express example http://localhost:${PORT}`);
});
