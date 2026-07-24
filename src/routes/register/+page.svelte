<script lang="ts">
  let { data, form } = $props();
  const values = $derived(form && 'values' in form ? form.values as { teamName?: string; leaderName?: string; members?: string; email?: string } : undefined);
</script>
<div class="card narrow">
  <h1>Register your team</h1>
  <p class="muted">{data.eventName} · closes {new Date(data.deadline).toLocaleString()}</p>
  {#if !data.open}<div class="error"><strong>Registration closed.</strong> New teams can no longer register.</div>
  {:else}
    {#if form?.message}<div class="error">{form.message}</div>{/if}
    <form method="POST">
      <label for="teamName">Team name</label><input id="teamName" name="teamName" required value={values?.teamName ?? ''} />
      <label for="leaderName">Team leader name</label><input id="leaderName" name="leaderName" required value={values?.leaderName ?? ''} />
      <label for="members">Team members (one per line)</label><textarea id="members" name="members" required>{values?.members ?? ''}</textarea>
      <label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value={values?.email ?? ''} />
      <label for="password">Password (at least 10 characters)</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="10" required />
      <label for="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" minlength="10" required />
      <div class="actions"><button>Register and continue</button><a class="button secondary" href="/login">Back to login</a></div>
    </form>
  {/if}
</div>
