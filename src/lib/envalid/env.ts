import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  NEXTAUTH_SECRET: str(),
  NEXT_PUBLIC_GITHUBURL: str({ default: "https://github.com/DrEdwardPCB/agam-form" }),
  NEXT_PUBLIC_FRONTENDURL:str({ default: "http://localhost:3000" })
});
