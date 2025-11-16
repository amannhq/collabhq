// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/betterauth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
