<script lang="ts">
  import Countdown from '$lib/Countdown.svelte';
  import { formatIstDateTime } from '$lib/date';

  let { data } = $props();

  const phases = ['Registration', 'Idea declaration', 'Development', 'Event closed'];
  const currentPhaseIndex = $derived(phases.indexOf(data.phase.phase));
  const statusClass = (status: string) => status === 'Submitted'
    ? 'status-success'
    : status === 'Locked'
      ? 'status-warning'
      : 'status-neutral';
  const ideaAction = (status: string, exists: boolean) => status === 'Locked' ? 'View declaration' : exists ? 'Edit declaration' : 'Declare idea';
  const submissionAction = (locked: boolean, exists: boolean) => locked ? 'View submission' : exists ? 'Edit submission' : 'Submit project';
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Team workspace</p>
    <h1>{data.eventName}</h1>
    <p class="page-description">{data.team.name}</p>
  </div>
  <span class="status status-neutral">{data.phase.phase}</span>
</div>

<section class="mt-6 overflow-hidden rounded-lg bg-sidebar text-paper shadow-panel">
  <div class="grid gap-8 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Current phase</p>
      <h2 class="mt-2 text-xl text-paper sm:text-2xl">{data.phase.phase}</h2>
      <p class="mt-1 text-sm text-paper/55">
        {data.phase.deadline ? `Ends ${formatIstDateTime(data.phase.deadline)}` : 'The event workflow is complete.'}
      </p>
    </div>
    <div class="lg:text-right">
      <p class="mb-3 text-xs font-medium text-paper/50">Time remaining</p>
      <Countdown serverTime={data.serverTime} deadline={data.phase.deadline} />
    </div>
  </div>

  <ol class="grid grid-cols-2 border-t border-paper/10 sm:grid-cols-4">
    {#each phases as phase, index}
      <li class="border-paper/10 px-4 py-3 text-xs {index < phases.length - 1 ? 'sm:border-r' : ''} {index <= currentPhaseIndex ? 'text-paper' : 'text-paper/35'}">
        <span class="mb-1 block font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</span>
        <span class="font-medium">{phase}</span>
      </li>
    {/each}
  </ol>
</section>

<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)]">
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2>Submission checklist</h2>
        <p class="text-sm text-ink-soft">Complete each event requirement before it locks.</p>
      </div>
    </div>

    <div class="divide-y">
      <article class="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <h3>Idea declaration</h3>
            <span class="status {statusClass(data.ideaStatus)}">{data.ideaStatus}</span>
          </div>
          {#if data.idea}
            <p class="mt-2 font-medium text-ink">{data.idea.title}</p>
            <p class="mt-1 line-clamp-2 text-sm text-ink-soft">{data.idea.problem}</p>
          {:else}
            <p class="mt-2 text-sm text-ink-soft">Share the problem you are exploring and what you might build.</p>
          {/if}
          <p class="mt-2 text-xs text-ink-soft">Deadline: {formatIstDateTime(data.deadlines.idea)}</p>
        </div>
        <a class="btn {data.ideaStatus === 'Not submitted' ? 'btn-primary' : 'btn-secondary'}" href="/idea">
          {ideaAction(data.ideaStatus, Boolean(data.idea))}
        </a>
      </article>

      <article class="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <h3>Final submission</h3>
            <span class="status {statusClass(data.submissionStatus)}">{data.submissionStatus}</span>
          </div>
          {#if data.submission}
            <p class="mt-2 font-medium text-ink">{data.submission.project_name}</p>
            <p class="mt-1 text-sm text-ink-soft">First submitted {formatIstDateTime(data.submission.submitted_at)}</p>
          {:else}
            <p class="mt-2 text-sm text-ink-soft">Provide the project links, source version, and testing details.</p>
          {/if}
          <p class="mt-2 text-xs text-ink-soft">Deadline: {formatIstDateTime(data.deadlines.submission)}</p>
        </div>
        <a class="btn {data.submissionStatus === 'Not submitted' ? 'btn-primary' : 'btn-secondary'}" href="/submission">
          {submissionAction(data.submissionLocked, Boolean(data.submission))}
        </a>
      </article>
    </div>
  </section>

  <aside class="panel self-start">
    <div class="panel-header"><h2>Team</h2></div>
    <div class="panel-body">
      <p class="text-lg font-semibold text-ink">{data.team.name}</p>
      <p class="mt-1 text-sm text-ink-soft">Led by {data.team.leader_name}</p>
      <div class="mt-5 border-t pt-4">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Members</p>
        <ul class="mt-3 space-y-2">
          {#each data.team.members as member}
            <li class="flex items-center gap-2 text-sm">
              <span class="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                {member.slice(0, 1).toUpperCase()}
              </span>
              {member}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </aside>
</div>
