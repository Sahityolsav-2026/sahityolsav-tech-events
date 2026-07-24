<script lang="ts">
  import { formatIstDateTime } from '$lib/date';
  let { data, form } = $props();
  const values = $derived(form && 'values' in form ? form.values as { teamName?: string; leaderName?: string; members?: string; email?: string } : undefined);
</script>

<div class="w-full max-w-3xl">
  <div class="page-header">
    <div>
      <p class="page-kicker">Team registration</p>
      <h1>Create your team workspace</h1>
      <p class="page-description">{data.eventName}. Registration closes {formatIstDateTime(data.deadline)}.</p>
    </div>
    <a class="btn btn-secondary" href="/login">Back to sign in</a>
  </div>

  {#if !data.open}
    <div class="panel mt-6">
      <div class="empty-state">
        <span class="status status-danger">Registration closed</span>
        <h2 class="mt-4">New registrations are no longer accepted</h2>
        <p class="mt-1 max-w-md text-sm text-ink-soft">Contact the event administrator if your team needs assistance.</p>
      </div>
    </div>
  {:else}
    {#if form?.message}<div class="alert alert-error mt-6" role="alert">{form.message}</div>{/if}
    <form method="POST" class="panel mt-6">
      <section class="form-section">
        <div class="form-section-header">
          <h2>Team information</h2>
          <p>Use the name that should appear to organizers and judges.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="teamName">Team name</label>
            <input id="teamName" name="teamName" required value={values?.teamName ?? ''} />
          </div>
          <div class="field">
            <label for="leaderName">Team leader</label>
            <input id="leaderName" name="leaderName" required value={values?.leaderName ?? ''} />
          </div>
          <div class="field md:col-span-2">
            <label for="members">Team members</label>
            <textarea id="members" name="members" required placeholder="Enter one member per line">{values?.members ?? ''}</textarea>
            <p class="field-help">One member per line. Include the team leader if they are participating.</p>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section-header">
          <h2>Account access</h2>
          <p>One account is shared by the team. Use an email your team can access during the event.</p>
        </div>
        <div class="form-grid">
          <div class="field md:col-span-2">
            <label for="email">Email address</label>
            <input id="email" name="email" type="email" autocomplete="email" required value={values?.email ?? ''} />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="new-password" minlength="10" required />
            <p class="field-help">At least 10 characters.</p>
          </div>
          <div class="field">
            <label for="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" minlength="10" required />
          </div>
        </div>
      </section>

      <div class="form-actions">
        <button class="btn btn-primary">Register and continue</button>
        <span class="text-xs text-ink-soft">You will be signed in automatically.</span>
      </div>
    </form>
  {/if}
</div>
