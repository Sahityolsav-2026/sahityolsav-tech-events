<script lang="ts">let { data, form } = $props();</script>
<div class="card narrow">
  <h1>Team login</h1>
  <p class="muted">Use the email and password registered for your team.</p>
  {#if form?.message}<div class="error">{form.message}</div>{/if}
  <form method="POST">
    <label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
    <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required />
    <div class="actions"><button>Log in</button><a class="button secondary" href="/register">Register team</a></div>
  </form>
</div>
