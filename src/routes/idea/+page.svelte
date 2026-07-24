<script lang="ts">
  let { data, form } = $props();
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
  const value = (key: string) => formValues?.[key as keyof typeof formValues] ?? data.idea?.[key as keyof typeof data.idea] ?? '';
</script>
<div class="card narrow">
  <h1>Idea declaration</h1>
  <p><span class="badge {data.locked ? 'warn' : data.idea ? 'good' : ''}">{data.locked ? 'Locked' : data.idea ? 'Submitted' : 'Not submitted'}</span></p>
  <p class="muted">Deadline: {new Date(data.deadline).toLocaleString()}</p>
  {#if data.locked}<div class="notice">The deadline has passed. This declaration is read-only.</div>{/if}
  {#if form?.message}<div class="error">{form.message}</div>{/if}
  {#if form?.success}<div class="notice">Idea saved.</div>{/if}
  <form method="POST">
    <label for="title">Idea title</label><input id="title" name="title" required disabled={data.locked} value={value('title')} />
    <label for="problem">Problem being addressed</label><textarea id="problem" name="problem" required disabled={data.locked}>{value('problem')}</textarea>
    <label for="target_users">Target users</label><textarea id="target_users" name="target_users" required disabled={data.locked}>{value('target_users')}</textarea>
    <label for="importance">Why the problem matters</label><textarea id="importance" name="importance" required disabled={data.locked}>{value('importance')}</textarea>
    <label for="solution">Proposed solution</label><textarea id="solution" name="solution" required disabled={data.locked}>{value('solution')}</textarea>
    <label for="user_journey">Core user journey</label><textarea id="user_journey" name="user_journey" required disabled={data.locked}>{value('user_journey')}</textarea>
    <label for="mvp_features">Features planned for the MVP</label><textarea id="mvp_features" name="mvp_features" required disabled={data.locked}>{value('mvp_features')}</textarea>
    <label for="tech_stack">Technology stack</label><textarea id="tech_stack" name="tech_stack" required disabled={data.locked}>{value('tech_stack')}</textarea>
    <div class="actions">{#if !data.locked}<button>Save idea</button>{/if}<a class="button secondary" href="/dashboard">Back to dashboard</a></div>
  </form>
  {#if data.idea}<p class="muted">Created {new Date(data.idea.created_at).toLocaleString()} · Updated {new Date(data.idea.updated_at).toLocaleString()}</p>{/if}
</div>
