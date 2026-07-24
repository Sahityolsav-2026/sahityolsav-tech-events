<script lang="ts">
  let { data, form } = $props();
  const forkLabel = (status: string | null) => status === 'archived' ? 'Archived' : status === 'pending' ? 'Pending' : status === 'failed' ? 'Failed' : 'Not started';
</script>
<div class="actions" style="justify-content:space-between"><h1>Admin dashboard</h1><div class="actions"><a class="button" href="/admin/settings">Event settings</a><a class="button secondary" href="/admin/ai">AI review settings</a><a class="button secondary" href="/admin/export">Export CSV</a></div></div>
<section class="grid stats">
  <div class="card stat"><span>Total teams</span><strong>{data.counts.total}</strong></div>
  <div class="card stat"><span>With idea</span><strong>{data.counts.with_idea}</strong></div>
  <div class="card stat"><span>Without idea</span><strong>{data.counts.without_idea}</strong></div>
  <div class="card stat"><span>Submitted</span><strong>{data.counts.with_submission}</strong></div>
  <div class="card stat"><span>Not submitted</span><strong>{data.counts.without_submission}</strong></div>
</section>
<section class="card">
  <h2>{data.settings.event_name}</h2>
  <p class="muted">Timezone: {data.settings.timezone} · final deadline {new Date(data.settings.submission_deadline).toLocaleString()}</p>
  {#if form?.archiveMessage}<div class="notice">{form.archiveMessage}</div>{/if}
  {#if data.archiveAllowed}
    <form method="POST" action="?/archive">
      <button>Archive verified repositories</button>
      <p class="muted">Creates organization forks in batches of eight, verifies the submitted commit, and makes completed forks read-only.</p>
    </form>
  {:else}
    <p class="notice">Repository archiving becomes available after the final submission deadline.</p>
  {/if}
</section>
<section class="card">
  <div class="actions">
    <strong>Filter:</strong>
    <a class="button {data.filter === 'all' ? '' : 'secondary'}" href="/admin?filter=all">All teams</a>
    <a class="button {data.filter === 'idea-missing' ? '' : 'secondary'}" href="/admin?filter=idea-missing">Idea missing</a>
    <a class="button {data.filter === 'submission-missing' ? '' : 'secondary'}" href="/admin?filter=submission-missing">Submission missing</a>
    <a class="button {data.filter === 'submitted' ? '' : 'secondary'}" href="/admin?filter=submitted">Submitted</a>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Team</th><th>Leader</th><th>Email</th><th>Idea</th><th>Submission</th><th>Archive</th><th>Submission time</th><th></th></tr></thead>
      <tbody>{#each data.teams as team}<tr>
        <td>{team.name}</td><td>{team.leader_name}</td><td>{team.email}</td>
        <td><span class="badge {team.idea_id ? 'good' : ''}">{team.idea_id ? 'Submitted' : 'Missing'}</span></td>
        <td><span class="badge {team.submission_id ? 'good' : ''}">{team.submission_id ? 'Submitted' : 'Missing'}</span></td>
        <td>{#if team.fork_url}<a href={team.fork_url} target="_blank" rel="noreferrer">{forkLabel(team.fork_status)}</a>{:else}<span class="badge">{forkLabel(team.fork_status)}</span>{/if}</td>
        <td>{team.submitted_at ? new Date(team.submitted_at).toLocaleString() : '—'}</td>
        <td><a class="button secondary" href="/admin/teams/{team.id}">View</a></td>
      </tr>{/each}</tbody>
    </table>
  </div>
</section>
