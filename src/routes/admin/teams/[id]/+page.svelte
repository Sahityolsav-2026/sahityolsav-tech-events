<script lang="ts">
  let { data, form } = $props();
  const ideaFields: [string,string][] = [['title','Idea title'],['problem','Problem'],['target_users','Target users'],['importance','Why it matters'],['solution','Proposed solution'],['user_journey','Core user journey'],['mvp_features','MVP features'],['tech_stack','Technology stack']];
  const submissionFields: [string,string][] = [['project_name','Project name'],['description','Description'],['repository_url','Repository URL'],['repository_full_name','Verified GitHub repository'],['repository_verified_at','Repository verified at'],['commit_sha','Commit SHA'],['application_type','Application type'],['application_url','Application / APK URL'],['test_instructions','Testing instructions'],['ai_tools','AI tools'],['preexisting_assets','Pre-existing assets'],['member_contributions','Member contributions'],['limitations','Known limitations'],['fork_status','Archive status'],['fork_url','Organization fork'],['forked_at','Fork requested at'],['fork_error','Archive error']];
</script>
<div class="actions"><h1>{data.team.name}</h1><a class="button secondary" href="/admin">Back to admin</a></div>
<div class="grid">
  <section class="card"><h2>Registration</h2><dl><dt>Leader</dt><dd>{data.team.leader_name}</dd><dt>Email</dt><dd>{data.team.email}</dd><dt>Members</dt><dd>{data.team.members.join('\n')}</dd><dt>Registered</dt><dd>{new Date(String(data.team.created_at)).toLocaleString()}</dd></dl></section>
  <section class="card"><h2>Set new password</h2><p class="muted">This signs the account out everywhere.</p>{#if form?.passwordMessage}<div class="error">{form.passwordMessage}</div>{/if}{#if form?.passwordSuccess}<div class="notice">Password changed and existing sessions deleted.</div>{/if}<form method="POST" action="?/password"><label for="password">New password</label><input id="password" name="password" type="password" minlength="10" required /><div class="actions"><button class="danger">Set password</button></div></form></section>
</div>
<section class="card"><h2>Idea declaration</h2>{#if data.idea}<dl>{#each ideaFields as field}<dt>{field[1]}</dt><dd>{data.idea[field[0]]}</dd>{/each}<dt>Created</dt><dd>{new Date(String(data.idea.created_at)).toLocaleString()}</dd><dt>Updated</dt><dd>{new Date(String(data.idea.updated_at)).toLocaleString()}</dd></dl>{:else}<p class="muted">No idea submitted.</p>{/if}</section>
<section class="card"><h2>Final submission</h2>{#if data.submission}<dl>{#each submissionFields as field}<dt>{field[1]}</dt><dd>{data.submission[field[0]]}</dd>{/each}<dt>Official submission time</dt><dd>{new Date(String(data.submission.submitted_at)).toLocaleString()}</dd><dt>Updated</dt><dd>{new Date(String(data.submission.updated_at)).toLocaleString()}</dd></dl>{:else}<p class="muted">No final submission.</p>{/if}</section>
<section class="card">
  <h2>Initial AI review</h2>
  <p class="muted">A read-only source review for judges. It does not execute the project, score it, or replace manual judging.</p>
  {#if form?.reviewMessage}<div class="error">{form.reviewMessage}</div>{/if}
  {#if form?.reviewSuccess}<div class="notice">AI review completed.</div>{/if}

  {#if data.review}
    <div class="actions">
      <span class="badge {data.review.status === 'completed' ? 'good' : data.review.status === 'failed' ? 'warn' : ''}">{data.review.status}</span>
      <span class="muted">{data.review.model} · commit {String(data.review.commit_sha).slice(0, 12)}</span>
    </div>
    {#if data.review.repository_full_name}<p class="muted">Reviewed repository: {data.review.repository_full_name}</p>{/if}
    {#if data.review.status === 'completed'}
      <div class="review-report">{data.review.report}</div>
      <details>
        <summary>Files inspected ({data.review.files_inspected.length})</summary>
        <ul>{#each data.review.files_inspected as path}<li><code>{path}</code></li>{/each}</ul>
      </details>
      <p class="muted">{data.review.turns} model turns · {data.review.files_bytes.toLocaleString()} source bytes · {data.review.input_tokens.toLocaleString()} input tokens · {data.review.output_tokens.toLocaleString()} output tokens · {(data.review.duration_ms / 1000).toFixed(1)} seconds</p>
      <p class="muted">Completed {new Date(String(data.review.completed_at)).toLocaleString()}</p>
    {:else if data.review.status === 'failed'}
      <div class="error">{data.review.error}</div>
    {:else}
      <div class="notice">Review is running. Do not submit another review from a second tab.</div>
    {/if}
  {/if}

  {#if !data.reviewAllowed}
    <div class="notice">Reviews become available after the final submission deadline.</div>
  {:else if !data.aiConfigured}
    <div class="notice">Configure and enable the AI provider in <a href="/admin/ai">AI review settings</a>.</div>
  {:else if !data.submission}
    <p class="muted">A final submission is required.</p>
  {:else}
    <form method="POST" action="?/review">
      <button>{data.review?.status === 'completed' ? 'Run review again' : 'Run AI review'}</button>
      <p class="muted">This can take several minutes. Keep this page open until the request completes.</p>
    </form>
  {/if}
</section>
