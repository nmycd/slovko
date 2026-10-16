// Every level's coverage requirements, by key (`npm run course:coverage -- a1`).

import { a1 } from "./a1";
import { a2 } from "./a2";
import type { Level } from "./types";

export const levels: Record<string, Level> = { a1, a2 };
