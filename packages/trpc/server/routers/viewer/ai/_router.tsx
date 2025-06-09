import type { Prisma } from "@prisma/client";

import { importHandler, router } from "@calcom/trpc/server/createRouter";
import type { OOOFormValues } from "@calcom/trpc/server/routers/viewer";

const NAMESPACE = "ai";

const namespaced = (s: string) => `${NAMESPACE}.${s}`;

export const aiRouter = router({
  generateEventTypeSuggestion: importHandler(
    namespaced("generateEventTypeSuggestion"),
    () => import("./generateEventTypeSuggestion.handler")
  ),
  classifyOOOReason: importHandler(
    namespaced("classifyOOOReason"),
    () => import("./classifyOOOReason.handler")
  ),
});