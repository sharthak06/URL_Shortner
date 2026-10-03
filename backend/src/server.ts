import { app } from "./app.js";
import { env } from "./config/env.config.js";

const PORT = env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// On single-service hosts (e.g. Render free tier) we can't run a separate
// worker process, so optionally boot the BullMQ workers inside the API
// process. The redirect path still only enqueues jobs — this just consumes
// that same queue here instead of in a dedicated process.
if (env.RUN_WORKER_IN_PROCESS) {
  import("./starter-worker.js")
    .then(() => console.log("Background workers started in-process"))
    .catch((error) => {
      console.error("Failed to start in-process workers:", error);
    });
}
