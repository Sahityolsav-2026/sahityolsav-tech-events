<script lang="ts">
  let { form } = $props();
</script>

<div class="grid w-full max-w-4xl overflow-hidden rounded-lg border bg-surface shadow-panel md:grid-cols-[0.9fr_1.1fr]">
  <section class="hidden bg-sidebar px-10 py-12 text-paper md:flex md:flex-col md:justify-between">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sahityolsav 2026</p>
      <h1 class="mt-4 max-w-sm text-3xl leading-tight text-paper">Your team’s event workspace.</h1>
      <p class="mt-4 max-w-sm text-sm leading-6 text-paper/60">Track the current phase, declare your idea, and complete the final submission before the deadline.</p>
    </div>
    <p class="text-xs text-paper/45">All event times are shown in Indian Standard Time.</p>
  </section>

  <section class="px-5 py-8 sm:px-10 sm:py-12">
    <div class="mb-8">
      <p class="page-kicker">Team access</p>
      <h1>Sign in</h1>
      <p class="page-description">Use the account registered for your team.</p>
    </div>

    {#if form?.message}<div class="alert alert-error mb-5" role="alert">{form.message}</div>{/if}

    <form method="POST" class="form-stack">
      <div class="field">
        <label for="email">Email address</label>
        <input id="email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
      </div>
      <button class="btn btn-primary w-full">Sign in to workspace</button>
    </form>

    <div class="mt-6 border-t pt-5 text-sm text-ink-soft">
      Registering a new team?
      <a class="font-semibold text-brand" href="/register">Create a team account</a>
    </div>
  </section>
</div>
