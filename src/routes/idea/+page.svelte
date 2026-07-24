<script lang="ts">
  import { formatIstDateTime } from '$lib/date';

  let { data, form } = $props();
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
  const value = (key: string) => formValues?.[key as keyof typeof formValues] ?? data.idea?.[key as keyof typeof data.idea] ?? '';
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Team deliverable</p>
    <h1>Idea declaration</h1>
    <p class="page-description">Describe the problem and the smallest useful solution your team plans to build.</p>
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <span class="status {data.locked ? 'status-warning' : data.idea ? 'status-success' : 'status-neutral'}">
      {data.locked ? 'Locked' : data.idea ? 'Submitted' : 'Not submitted'}
    </span>
    <a class="btn btn-secondary" href="/dashboard">Back to overview</a>
  </div>
</div>

<div class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-surface-muted px-4 py-3 text-sm">
  <span class="font-medium text-ink">Idea deadline</span>
  <span class="text-ink-soft">{formatIstDateTime(data.deadline)}</span>
</div>

{#if data.locked}
  <div class="alert alert-info mt-4">The deadline has passed. Your declaration is preserved as read-only.</div>
{/if}
{#if form?.message}<div class="alert alert-error mt-4" role="alert">{form.message}</div>{/if}
{#if form?.success}<div class="alert alert-success mt-4">Idea declaration saved.</div>{/if}

<form method="POST" class="panel mt-6">
  <section class="form-section">
    <div class="form-section-header">
      <p class="page-kicker">01</p>
      <h2>The problem</h2>
      <p>Give judges enough context to understand who is affected and why this matters.</p>
    </div>
    <div class="form-stack">
      <div class="field">
        <label for="title">Idea title</label>
        <input id="title" name="title" required disabled={data.locked} value={value('title')} />
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="problem">Problem being addressed</label>
          <textarea id="problem" name="problem" required disabled={data.locked}>{value('problem')}</textarea>
        </div>
        <div class="field">
          <label for="target_users">Target users</label>
          <textarea id="target_users" name="target_users" required disabled={data.locked}>{value('target_users')}</textarea>
        </div>
      </div>
      <div class="field">
        <label for="importance">Why the problem matters</label>
        <textarea id="importance" name="importance" required disabled={data.locked}>{value('importance')}</textarea>
      </div>
    </div>
  </section>

  <section class="form-section">
    <div class="form-section-header">
      <p class="page-kicker">02</p>
      <h2>The proposed experience</h2>
      <p>Focus on the core outcome and the path a user takes to reach it.</p>
    </div>
    <div class="form-grid">
      <div class="field">
        <label for="solution">Proposed solution</label>
        <textarea id="solution" name="solution" required disabled={data.locked}>{value('solution')}</textarea>
      </div>
      <div class="field">
        <label for="user_journey">Core user journey</label>
        <textarea id="user_journey" name="user_journey" required disabled={data.locked}>{value('user_journey')}</textarea>
      </div>
    </div>
  </section>

  <section class="form-section">
    <div class="form-section-header">
      <p class="page-kicker">03</p>
      <h2>Build plan</h2>
      <p>Keep the MVP narrow enough to finish and demonstrate during the event.</p>
    </div>
    <div class="form-grid">
      <div class="field">
        <label for="mvp_features">Features planned for the MVP</label>
        <textarea id="mvp_features" name="mvp_features" required disabled={data.locked}>{value('mvp_features')}</textarea>
      </div>
      <div class="field">
        <label for="tech_stack">Technology stack</label>
        <textarea id="tech_stack" name="tech_stack" required disabled={data.locked}>{value('tech_stack')}</textarea>
      </div>
    </div>
  </section>

  <div class="form-actions">
    {#if !data.locked}<button class="btn btn-primary">Save idea declaration</button>{/if}
    {#if data.idea}
      <span class="text-xs text-ink-soft">Created {formatIstDateTime(data.idea.created_at)} · Updated {formatIstDateTime(data.idea.updated_at)}</span>
    {/if}
  </div>
</form>
