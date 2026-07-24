<script lang="ts">
  let { data, form } = $props();
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
  const value = (key: string) => formValues?.[key as keyof typeof formValues] ?? data.submission?.[key as keyof typeof data.submission] ?? '';
</script>
<div class="card narrow">
  <h1>Final project submission</h1>
  <p><span class="badge {data.locked ? 'warn' : data.submission ? 'good' : ''}">{data.locked ? 'Locked' : data.submission ? 'Submitted' : 'Not submitted'}</span></p>
  {#if !data.available}<div class="notice">The form opens after development ends on {new Date(data.developmentDeadline).toLocaleString()}.</div>
  {:else}
    <p class="muted">Submission deadline: {new Date(data.deadline).toLocaleString()}</p>
    {#if data.locked}<div class="notice">The deadline has passed. This submission is read-only.</div>{/if}
    {#if form?.message}<div class="error">{form.message}</div>{/if}
    {#if form?.success}<div class="notice">Final submission saved. Public repository and commit verified: {form.verifiedRepository}</div>{/if}
    {#if data.submission?.repository_verified_at}
      <div class="notice">
        <strong>GitHub verified:</strong> {data.submission.repository_full_name} at
        {new Date(data.submission.repository_verified_at).toLocaleString()}.
        {#if data.submission.fork_status === 'archived' && data.submission.fork_url}
          <a href={data.submission.fork_url} target="_blank" rel="noreferrer">View archived organization fork</a>
        {/if}
      </div>
    {/if}
    <form method="POST">
      <label for="project_name">Final project name</label><input id="project_name" name="project_name" required disabled={data.locked} value={value('project_name')} />
      <label for="description">Short project description</label><textarea id="description" name="description" required disabled={data.locked}>{value('description')}</textarea>
      <label for="repository_url">Public GitHub repository URL</label><input id="repository_url" name="repository_url" type="url" placeholder="https://github.com/owner/repository" required disabled={data.locked} value={value('repository_url')} />
      <label for="commit_sha">Exact Git commit SHA</label><input id="commit_sha" name="commit_sha" minlength="40" maxlength="40" pattern="[0-9a-fA-F]{40}" required disabled={data.locked} value={value('commit_sha')} />
      <label for="application_type">Application type</label><select id="application_type" name="application_type" required disabled={data.locked}><option value="">Select</option><option value="Web" selected={value('application_type') === 'Web'}>Web</option><option value="Mobile" selected={value('application_type') === 'Mobile'}>Mobile</option></select>
      <label for="application_url">Live application URL or APK download URL</label><input id="application_url" name="application_url" type="url" required disabled={data.locked} value={value('application_url')} />
      <label for="test_instructions">Test credentials or testing instructions</label><textarea id="test_instructions" name="test_instructions" required disabled={data.locked}>{value('test_instructions')}</textarea>
      <label for="ai_tools">AI tools used</label><textarea id="ai_tools" name="ai_tools" required disabled={data.locked}>{value('ai_tools')}</textarea>
      <label for="preexisting_assets">Significant pre-existing libraries, templates, or assets used</label><textarea id="preexisting_assets" name="preexisting_assets" required disabled={data.locked}>{value('preexisting_assets')}</textarea>
      <label for="member_contributions">Contribution of each team member</label><textarea id="member_contributions" name="member_contributions" required disabled={data.locked}>{value('member_contributions')}</textarea>
      <label for="limitations">Known limitations</label><textarea id="limitations" name="limitations" required disabled={data.locked}>{value('limitations')}</textarea>
      {#if !data.locked}<label class="checkbox"><input type="checkbox" name="confirmed" value="yes" required /> I confirm that the submitted information is accurate.</label>{/if}
      <div class="actions">{#if !data.locked}<button>Save final submission</button>{/if}<a class="button secondary" href="/dashboard">Back to dashboard</a></div>
    </form>
    {#if data.submission}<p class="muted">Official submission time: {new Date(data.submission.submitted_at).toLocaleString()} · {data.onTime ? 'Submitted before the deadline' : 'Submitted after the deadline'} · Last updated {new Date(data.submission.updated_at).toLocaleString()}</p>{/if}
  {/if}
</div>
