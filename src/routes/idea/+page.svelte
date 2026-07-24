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
    <p class="page-description">Share your current direction. It can change while you explore.</p>
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
      <h2>Your starting point</h2>
      <p>A rough idea is enough. Save what you know now and revise it before the deadline.</p>
    </div>
    <div class="form-stack">
      <div class="field">
        <label for="title">Idea title</label>
        <input id="title" name="title" placeholder="A working title is fine" required disabled={data.locked} value={value('title')} />
      </div>
      <div class="field">
        <label for="problem">What problem are you exploring?</label>
        <textarea id="problem" name="problem" placeholder="Describe the situation or need you want to investigate" required disabled={data.locked}>{value('problem')}</textarea>
      </div>
      <div class="field">
        <label for="solution">What might you build?</label>
        <textarea id="solution" name="solution" placeholder="Describe your current direction, even if it is not final" required disabled={data.locked}>{value('solution')}</textarea>
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
