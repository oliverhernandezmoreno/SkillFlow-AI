import 'dotenv/config';

import { createApp } from './app.js';
import { loadEnvironment } from './config/environment.js';

const environment = loadEnvironment();
const app = createApp();

app.listen(environment.PORT, () => {
  console.log(`SkillFlow AI API listening on port ${String(environment.PORT)}`);
});
