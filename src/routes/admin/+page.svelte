<script lang="ts">
  import { formatIstDateTime } from '$lib/date';

  let { data, form } = $props();
  const forkLabel = (status: string | null) => status === 'archived'
    ? 'Archived'
    : status === 'pending'
      ? 'Pending'
      : status === 'failed'
        ? 'Failed'
        : 'Not started';
  const archiveStatusClass = (status: string | null) => status === 'archived'
    ? 'status-success'
    : status === 'failed'
      ? 'status-danger'
      : status === 'pending'
        ? 'status-warning'
        : 'status-neutral';
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Event operations</p>
    <h1>Admin overview</h1>
    <p class="page-description">{data.settings.event_name}. Monitor team readiness and manage the event from one workspace.</p>
  </div>
  <div class="action-row">
    <a class="btn btn-primary" href="/admin/settings">Edit deadlines</a>
    <a class="btn btn-secondary" href="/admin/ai">AI settings</a>
  </div>
</div>

<section class="panel mt-6 overflow-hidden">
  <div class="grid grid-cols-2 lg:grid-cols-4">
    <div class="border-b border-r px-5 py-4 lg:border-b-0">
      <p class="text-xs font-medium text-ink-soft">Registered teams</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight">{data.counts.total}</p>
    </div>
    <div class="border-b px-5 py-4 lg:border-b-0 lg:border-r">
      <p class="text-xs font-medium text-ink-soft">Ideas received</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight">{data.counts.with_idea}<span class="ml-1 text-sm font-normal text-ink-soft">/ {data.counts.total}</span></p>
    </div>
    <div class="border-r px-5 py-4">
      <p class="text-xs font-medium text-ink-soft">Final submissions</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight">{data.counts.with_submission}<span class="ml-1 text-sm font-normal text-ink-soft">/ {data.counts.total}</span></p>
    </div>
    <div class="px-5 py-4">
      <p class="text-xs font-medium text-ink-soft">Need attention</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight text-warning">{data.counts.without_submission}</p>
    </div>
  </div>
</section>

<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
  <section class="panel">
    <div class="panel-header">
      <h2>Event status</h2>
    </div>
    <div class="panel-body">
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Final deadline</p>
          <p class="mt-1 font-semibold">{formatIstDateTime(data.settings.submission_deadline)}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Submission readiness</p>
          <p class="mt-1 font-semibold">{data.counts.with_submission} of {data.counts.total} teams submitted</p>
        </div>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="panel-header"><h2>Repository archive</h2></div>
    <div class="panel-body">
      {#if form?.archiveMessage}<div class="alert alert-info mb-4">{form.archiveMessage}</div>{/if}
      {#if data.archiveAllowed}
        <form method="POST" action="?/archive">
          <p class="mb-4 text-sm text-ink-soft">Create read-only organization copies of verified team repositories.</p>
          <button class="btn btn-secondary w-full">Archive repositories</button>
        </form>
      {:else}
        <p class="text-sm text-ink-soft">Available after the final submission deadline.</p>
      {/if}
    </div>
  </section>
</div>

<section class="mt-6">
  <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2>Teams</h2>
      <p class="text-sm text-ink-soft">Inspect declarations, submissions, and archive status.</p>
    </div>
    <a class="btn btn-secondary btn-sm" href="/admin/export">Export CSV</a>
  </div>

  <div class="table-shell">
    <div class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <span class="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Filter</span>
      <a class="btn btn-sm {data.filter === 'all' ? 'btn-primary' : 'btn-ghost'}" href="/admin?filter=all">All</a>
      <a class="btn btn-sm {data.filter === 'idea-missing' ? 'btn-primary' : 'btn-ghost'}" href="/admin?filter=idea-missing">Idea missing</a>
      <a class="btn btn-sm {data.filter === 'submission-missing' ? 'btn-primary' : 'btn-ghost'}" href="/admin?filter=submission-missing">Submission missing</a>
      <a class="btn btn-sm {data.filter === 'submitted' ? 'btn-primary' : 'btn-ghost'}" href="/admin?filter=submitted">Submitted</a>
    </div>

    {#if data.teams.length}
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Team</th><th>Idea</th><th>Submission</th><th>Archive</th><th>Submitted</th><th><span class="sr-only">Action</span></th></tr>
          </thead>
          <tbody>
            {#each data.teams as team}
              <tr>
                <td>
                  <a class="font-semibold text-ink no-underline hover:text-brand" href="/admin/teams/{team.id}">{team.name}</a>
                  <span class="block text-xs text-ink-soft">{team.leader_name} · {team.email}</span>
                </td>
                <td><span class="status {team.idea_id ? 'status-success' : 'status-neutral'}">{team.idea_id ? 'Received' : 'Missing'}</span></td>
                <td><span class="status {team.submission_id ? 'status-success' : 'status-neutral'}">{team.submission_id ? 'Received' : 'Missing'}</span></td>
                <td>
                  {#if team.fork_url}
                    <a class="status {archiveStatusClass(team.fork_status)} no-underline" href={team.fork_url} target="_blank" rel="noreferrer">{forkLabel(team.fork_status)}</a>
                  {:else}
                    <span class="status {archiveStatusClass(team.fork_status)}">{forkLabel(team.fork_status)}</span>
                  {/if}
                </td>
                <td class="whitespace-nowrap text-xs text-ink-soft">{team.submitted_at ? formatIstDateTime(team.submitted_at) : 'Not submitted'}</td>
                <td><a class="btn btn-secondary btn-sm" href="/admin/teams/{team.id}">Inspect</a></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="empty-state">
        <h3>No teams match this filter</h3>
        <p class="mt-1 text-sm text-ink-soft">{data.counts.total ? 'Choose another filter to continue.' : 'Registered teams will appear here.'}</p>
      </div>
    {/if}
  </div>
</section>
