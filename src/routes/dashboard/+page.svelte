<script lang="ts">
  import Countdown from '$lib/Countdown.svelte';
  let { data } = $props();
  const badgeClass = (status: string) => status === 'Submitted' ? 'good' : status === 'Locked' ? 'warn' : '';
  const ideaAction = (status: string, exists: boolean) => status === 'Locked' ? 'View idea' : exists ? 'Edit idea' : 'Declare idea';
  const submissionAction = (locked: boolean, exists: boolean) => locked ? 'View submission' : exists ? 'Edit submission' : 'Submit project';
</script>

<h1>{data.eventName}</h1>
<section class="card">
  <span class="badge">{data.phase.phase}</span>
  <Countdown serverTime={data.serverTime} deadline={data.phase.deadline} />
  <p class="muted">Time remaining in the current phase. The server is the authoritative clock.</p>
</section>
<div class="grid">
  <section class="card">
    <h2>{data.team.name}</h2>
    <p><strong>Leader:</strong> {data.team.leader_name}</p>
    <p><strong>Members:</strong></p>
    <ul>{#each data.team.members as member}<li>{member}</li>{/each}</ul>
  </section>
  <section class="card">
    <h2>Idea declaration</h2>
    <span class="badge {badgeClass(data.ideaStatus)}">{data.ideaStatus}</span>
    {#if data.idea}<h3>{data.idea.title}</h3><p>{data.idea.problem}</p>{:else}<p class="muted">No idea has been declared yet.</p>{/if}
    <div class="actions"><a class="button" href="/idea">{ideaAction(data.ideaStatus, Boolean(data.idea))}</a></div>
  </section>
  <section class="card">
    <h2>Final submission</h2>
    <span class="badge {badgeClass(data.submissionStatus)}">{data.submissionStatus}</span>
    {#if data.submission}<h3>{data.submission.project_name}</h3><p class="muted">First submitted {new Date(data.submission.submitted_at).toLocaleString()}</p>
    {:else}<p class="muted">No final project has been submitted.</p>{/if}
    {#if data.submissionAvailable}
      <div class="actions"><a class="button" href="/submission">{submissionAction(data.submissionLocked, Boolean(data.submission))}</a></div>
    {:else}<p class="notice">The final form opens after development ends.</p>{/if}
  </section>
</div>
