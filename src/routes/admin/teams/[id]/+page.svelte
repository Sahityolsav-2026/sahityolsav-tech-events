<script lang="ts">
  import { formatIstDateTime } from '$lib/date';

  let { data, form } = $props();
  const ideaFields: [string, string][] = [
    ['title', 'Idea title'],
    ['problem', 'Problem'],
    ['target_users', 'Target users'],
    ['importance', 'Why it matters'],
    ['solution', 'Proposed solution'],
    ['user_journey', 'Core user journey'],
    ['mvp_features', 'MVP features'],
    ['tech_stack', 'Technology stack']
  ];
  const submissionFields: [string, string][] = [
    ['project_name', 'Project name'],
    ['description', 'Description'],
    ['repository_url', 'Repository URL'],
    ['repository_full_name', 'Verified GitHub repository'],
    ['commit_sha', 'Commit SHA'],
    ['application_type', 'Application type'],
    ['application_url', 'Application or APK URL'],
    ['test_instructions', 'Testing instructions'],
    ['ai_tools', 'AI tools'],
    ['preexisting_assets', 'Pre-existing assets'],
    ['member_contributions', 'Member contributions'],
    ['limitations', 'Known limitations'],
    ['fork_status', 'Archive status'],
    ['fork_url', 'Organization archive']
  ];
  const value = (entry: unknown) => entry === null || entry === undefined || entry === '' ? 'Not provided' : String(entry);
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Team record</p>
    <h1>{data.team.name}</h1>
    <p class="page-description">{data.team.leader_name} · {data.team.email}</p>
  </div>
  <div class="action-row">
    <span class="status {data.submission ? 'status-success' : 'status-neutral'}">{data.submission ? 'Submitted' : 'Awaiting submission'}</span>
    <a class="btn btn-secondary" href="/admin">Back to teams</a>
  </div>
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
  <section class="panel">
    <div class="panel-header"><h2>Registration</h2></div>
    <div class="panel-body">
      <dl class="definition-grid">
        <div><dt>Team leader</dt><dd>{data.team.leader_name}</dd></div>
        <div><dt>Account email</dt><dd>{data.team.email}</dd></div>
        <div><dt>Registered</dt><dd>{formatIstDateTime(String(data.team.created_at))}</dd></div>
        <div>
          <dt>Team members</dt>
          <dd>
            <ul class="space-y-1">
              {#each data.team.members as member}<li>{member}</li>{/each}
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  </section>

  <section class="panel self-start">
    <div class="panel-header">
      <div>
        <h2>Account recovery</h2>
        <p class="text-sm text-ink-soft">Setting a password signs the team out everywhere.</p>
      </div>
    </div>
    <div class="panel-body">
      {#if form?.passwordMessage}<div class="alert alert-error mb-4">{form.passwordMessage}</div>{/if}
      {#if form?.passwordSuccess}<div class="alert alert-success mb-4">Password changed and existing sessions deleted.</div>{/if}
      <form method="POST" action="?/password" class="form-stack">
        <div class="field">
          <label for="password">New password</label>
          <input id="password" name="password" type="password" minlength="10" autocomplete="new-password" required />
          <p class="field-help">At least 10 characters.</p>
        </div>
        <button class="btn btn-danger">Set new password</button>
      </form>
    </div>
  </section>
</div>

<section class="panel mt-6">
  <div class="panel-header">
    <div>
      <h2>Idea declaration</h2>
      <p class="text-sm text-ink-soft">
        {data.idea ? `Updated ${formatIstDateTime(String(data.idea.updated_at))}` : 'No declaration received'}
      </p>
    </div>
    <span class="status {data.idea ? 'status-success' : 'status-neutral'}">{data.idea ? 'Received' : 'Missing'}</span>
  </div>
  {#if data.idea}
    <div class="panel-body">
      <dl class="definition-grid">
        {#each ideaFields as field}
          <div class={field[0] === 'title' ? 'sm:col-span-2' : ''}>
            <dt>{field[1]}</dt>
            <dd>{value(data.idea[field[0]])}</dd>
          </div>
        {/each}
        <div><dt>Created</dt><dd>{formatIstDateTime(String(data.idea.created_at))}</dd></div>
        <div><dt>Updated</dt><dd>{formatIstDateTime(String(data.idea.updated_at))}</dd></div>
      </dl>
    </div>
  {:else}
    <div class="empty-state"><p class="text-sm text-ink-soft">The team has not declared an idea.</p></div>
  {/if}
</section>

<section class="panel mt-6">
  <div class="panel-header">
    <div>
      <h2>Final submission</h2>
      <p class="text-sm text-ink-soft">
        {data.submission ? `Official time ${formatIstDateTime(String(data.submission.submitted_at))}` : 'No submission received'}
      </p>
    </div>
    <span class="status {data.submission ? 'status-success' : 'status-neutral'}">{data.submission ? 'Received' : 'Missing'}</span>
  </div>
  {#if data.submission}
    <div class="panel-body">
      <dl class="definition-grid">
        {#each submissionFields as field}
          <div class={['description', 'test_instructions', 'member_contributions', 'limitations'].includes(field[0]) ? 'sm:col-span-2' : ''}>
            <dt>{field[1]}</dt>
            <dd class={field[0] === 'commit_sha' ? 'font-mono text-xs' : ''}>
              {#if ['repository_url', 'application_url', 'fork_url'].includes(field[0]) && data.submission[field[0]]}
                <a class="font-medium text-brand" href={String(data.submission[field[0]])} target="_blank" rel="noreferrer">{data.submission[field[0]]}</a>
              {:else}
                {value(data.submission[field[0]])}
              {/if}
            </dd>
          </div>
        {/each}
        <div><dt>Repository verified</dt><dd>{data.submission.repository_verified_at ? formatIstDateTime(String(data.submission.repository_verified_at)) : 'Not verified'}</dd></div>
        <div><dt>Last updated</dt><dd>{formatIstDateTime(String(data.submission.updated_at))}</dd></div>
      </dl>
    </div>
  {:else}
    <div class="empty-state"><p class="text-sm text-ink-soft">The team has not submitted a final project.</p></div>
  {/if}
</section>

<section class="panel mt-6">
  <div class="panel-header">
    <div>
      <h2>Initial AI review</h2>
      <p class="text-sm text-ink-soft">Read-only source analysis for judges. It never scores or approves a project.</p>
    </div>
    {#if data.review}
      <span class="status {data.review.status === 'completed' ? 'status-success' : data.review.status === 'failed' ? 'status-danger' : 'status-warning'}">{data.review.status}</span>
    {/if}
  </div>

  <div class="panel-body">
    {#if form?.reviewMessage}<div class="alert alert-error mb-5">{form.reviewMessage}</div>{/if}
    {#if form?.reviewSuccess}<div class="alert alert-success mb-5">AI review completed.</div>{/if}

    {#if data.review}
      <div class="mb-5 grid gap-4 rounded-md bg-surface-muted p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><p class="text-xs text-ink-soft">Model</p><p class="mt-1 text-sm font-semibold">{data.review.model}</p></div>
        <div><p class="text-xs text-ink-soft">Commit</p><p class="mt-1 font-mono text-xs">{String(data.review.commit_sha).slice(0, 12)}</p></div>
        <div><p class="text-xs text-ink-soft">Files inspected</p><p class="mt-1 text-sm font-semibold">{data.review.files_inspected.length}</p></div>
        <div><p class="text-xs text-ink-soft">Duration</p><p class="mt-1 text-sm font-semibold">{(data.review.duration_ms / 1000).toFixed(1)} seconds</p></div>
      </div>

      {#if data.review.repository_full_name}<p class="mb-5 text-sm text-ink-soft">Reviewed repository: <strong class="text-ink">{data.review.repository_full_name}</strong></p>{/if}

      {#if data.review.status === 'completed'}
        <div class="review-report">{data.review.report}</div>
        <details class="mt-6 rounded-md border">
          <summary class="cursor-pointer px-4 py-3 text-sm font-semibold">Files inspected ({data.review.files_inspected.length})</summary>
          <ul class="grid gap-1 border-t px-4 py-3">
            {#each data.review.files_inspected as path}<li><code>{path}</code></li>{/each}
          </ul>
        </details>
        <p class="mt-4 text-xs text-ink-soft">Completed {formatIstDateTime(String(data.review.completed_at))}</p>
      {:else if data.review.status === 'failed'}
        <div class="alert alert-error">{data.review.error}</div>
      {:else}
        <div class="alert alert-info">Review is running. Keep this page open and do not start another run.</div>
      {/if}
    {/if}

    <div class={data.review ? 'mt-6 border-t pt-5' : ''}>
      {#if !data.reviewAllowed}
        <div class="alert alert-info">Reviews become available after the final submission deadline.</div>
      {:else if !data.aiConfigured}
        <div class="alert alert-info">Configure and enable the review service in <a class="font-semibold text-brand" href="/admin/ai">AI review settings</a>.</div>
      {:else if !data.submission}
        <p class="text-sm text-ink-soft">A final submission is required before review.</p>
      {:else}
        <form method="POST" action="?/review" class="flex flex-wrap items-center gap-3">
          <button class="btn btn-primary">{data.review?.status === 'completed' ? 'Run review again' : 'Run AI review'}</button>
          <span class="text-xs text-ink-soft">This may take several minutes. Keep the page open.</span>
        </form>
      {/if}
    </div>
  </div>
</section>
