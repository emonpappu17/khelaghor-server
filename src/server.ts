import app from "./app.js";
import { env } from "./app/config/env.js";
import { seedSuperAdmin } from "./app/utils/seedAdmin.js";

const PORT = env.PORT;

app.listen(PORT, async () => {
  await seedSuperAdmin()
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});