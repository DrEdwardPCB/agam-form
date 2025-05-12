import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
  NEXTAUTH_SECRET: str({ default: 'some-secret' }),
  NEXT_PUBLIC_GITHUBURL: str({ default: 'https://github.com/DrEdwardPCB/agam-form' }),
});
