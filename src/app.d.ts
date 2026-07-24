/// <reference path="../worker-configuration.d.ts" />

declare global {
  interface Env {
    // Secrets set with `wrangler secret put` are not emitted by `wrangler types`.
    GITHUB_TOKEN: string;
  }

  namespace App {
    interface Locals {
      user: { id: number; email: string; role: 'team' | 'admin' } | null;
      team: { id: number; name: string } | null;
    }
    interface Platform {
      env: Env;
      context: ExecutionContext;
      caches: CacheStorage;
    }
  }
}

export {};
