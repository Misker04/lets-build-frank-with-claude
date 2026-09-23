import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Frank is listening on port ${config.port}`);
});
