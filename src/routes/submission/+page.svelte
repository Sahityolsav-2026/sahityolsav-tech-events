<script lang="ts">
  import { formatIstDateTime } from '$lib/date';

  let { data, form } = $props();
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
  const value = (key: string) => formValues?.[key as keyof typeof formValues] ?? data.submission?.[key as keyof typeof data.submission] ?? '';
  let applicationType = $state(String(value('application_type')));
  const fileSize = (bytes: number) => bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Final deliverable</p>
    <h1>Project submission</h1>
    <p class="page-description">Share your finished project and everything judges need to test it.</p>
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <span class="status {data.locked ? 'status-warning' : data.submission ? 'status-success' : 'status-neutral'}">
      {data.locked ? 'Locked' : data.submission ? 'Submitted' : 'Not submitted'}
    </span>
    <a class="btn btn-secondary" href="/dashboard">Back to overview</a>
  </div>
</div>

<div class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-surface-muted px-4 py-3 text-sm">
  <span class="font-medium text-ink">Final submission deadline</span>
  <span class="text-ink-soft">{formatIstDateTime(data.deadline)}</span>
</div>

{#if data.locked}<div class="alert alert-info mt-4">The deadline has passed. This official submission is read-only.</div>{/if}
{#if form?.message}<div class="alert alert-error mt-4" role="alert">{form.message}</div>{/if}
{#if form?.success}<div class="alert alert-success mt-4">Submission saved.</div>{/if}

{#if data.submission?.repository_verified_at}
  <div class="alert alert-success mt-4">
    <strong>Repository verified:</strong> {data.submission.repository_full_name}.
    {#if data.submission.fork_status === 'archived' && data.submission.fork_url}
      <a class="font-semibold text-brand" href={data.submission.fork_url} target="_blank" rel="noreferrer">View organization archive</a>
    {/if}
  </div>
{/if}

<form method="POST" enctype="multipart/form-data" class="panel mt-6">
    <section class="form-section">
      <div class="form-section-header">
        <p class="page-kicker">01</p>
        <h2>Project</h2>
        <p>Use a concise name and description that judges can scan quickly.</p>
      </div>
      <div class="form-stack">
        <div class="field">
          <label for="project_name">Final project name</label>
          <input id="project_name" name="project_name" required disabled={data.locked} value={value('project_name')} />
        </div>
        <div class="field">
          <label for="description">Short project description</label>
          <textarea id="description" name="description" required disabled={data.locked}>{value('description')}</textarea>
        </div>
      </div>
    </section>

    <section class="form-section">
      <div class="form-section-header">
        <p class="page-kicker">02</p>
        <h2>Repository</h2>
        <p>Paste the link to your public GitHub repository.</p>
      </div>
      <div class="field">
        <label for="repository_url">Public GitHub repository URL</label>
        <input id="repository_url" name="repository_url" type="url" placeholder="https://github.com/owner/repository" required disabled={data.locked} value={value('repository_url')} />
      </div>
    </section>

    <section class="form-section">
      <div class="form-section-header">
        <p class="page-kicker">03</p>
        <h2>Build and testing</h2>
        <p>Give judges a reliable way to open and evaluate the project.</p>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="application_type">Application type</label>
          <select id="application_type" name="application_type" required disabled={data.locked} bind:value={applicationType}>
            <option value="">Select application type</option>
            <option value="Web">Web</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>
        {#if applicationType === 'Web'}
          <div class="field">
            <label for="application_url">Live application URL <span class="font-normal text-ink-soft">(optional)</span></label>
            <input id="application_url" name="application_url" type="url" disabled={data.locked} value={value('application_url')} />
            <p class="field-help">Leave this blank if the project is not deployed.</p>
          </div>
        {:else if applicationType === 'Mobile'}
          <div class="field">
            <label for="apk">APK file <span class="font-normal text-ink-soft">(optional)</span></label>
            {#if data.submission?.apk_object_key}
              <div class="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <a class="font-semibold text-brand" href="/submission/apk">{data.submission.apk_filename}</a>
                {#if data.submission.apk_size}<span class="text-ink-soft">{fileSize(data.submission.apk_size)}</span>{/if}
              </div>
            {/if}
            {#if !data.locked}
              <input id="apk" name="apk" type="file" accept=".apk,application/vnd.android.package-archive" />
              <p class="field-help">{data.submission?.apk_object_key ? 'Choose a file only to replace the current APK.' : 'Leave this blank if a build is not ready. APK only, maximum 90 MB.'}</p>
            {/if}
          </div>
        {/if}
        <div class="field md:col-span-2">
          <label for="test_instructions">Test credentials or testing instructions</label>
          <textarea id="test_instructions" name="test_instructions" required disabled={data.locked}>{value('test_instructions')}</textarea>
        </div>
      </div>
    </section>

    <section class="form-section">
      <div class="form-section-header">
        <p class="page-kicker">04</p>
        <h2>Build disclosure</h2>
        <p>Be specific about AI assistance, reused work, individual contributions, and known limitations.</p>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="ai_tools">AI tools used</label>
          <textarea id="ai_tools" name="ai_tools" required disabled={data.locked}>{value('ai_tools')}</textarea>
        </div>
        <div class="field">
          <label for="preexisting_assets">Pre-existing libraries, templates, or assets</label>
          <textarea id="preexisting_assets" name="preexisting_assets" required disabled={data.locked}>{value('preexisting_assets')}</textarea>
        </div>
        <div class="field">
          <label for="member_contributions">Contribution of each team member</label>
          <textarea id="member_contributions" name="member_contributions" required disabled={data.locked}>{value('member_contributions')}</textarea>
        </div>
        <div class="field">
          <label for="limitations">Known limitations</label>
          <textarea id="limitations" name="limitations" required disabled={data.locked}>{value('limitations')}</textarea>
        </div>
      </div>
    </section>

    {#if !data.locked}
      <section class="form-section">
        <label class="checkbox-row">
          <input type="checkbox" name="confirmed" value="yes" required />
          <span>
            <strong class="block text-ink">Submission confirmation</strong>
            I confirm that the submitted information above is accurate.
          </span>
        </label>
      </section>
    {/if}

    <div class="form-actions">
      {#if !data.locked}<button class="btn btn-primary">Save final submission</button>{/if}
      {#if data.submission}
        <span class="text-xs text-ink-soft">
          Official time: {formatIstDateTime(data.submission.submitted_at)} ·
          {data.onTime ? 'On time' : 'After deadline'} ·
          Updated {formatIstDateTime(data.submission.updated_at)}
        </span>
      {/if}
    </div>
</form>
