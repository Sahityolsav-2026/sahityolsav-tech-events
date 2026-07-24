<script lang="ts">
  let { data, form } = $props();
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
</script>

<div class="card narrow">
  <h1>AI review settings</h1>
  <p class="muted">Configure any OpenAI-compatible chat-completions endpoint. Reviews remain advisory and are run manually from a team’s admin page.</p>
  {#if form?.message}<div class="error">{form.message}</div>{/if}
  {#if form?.success}<div class="notice">AI review settings saved.</div>{/if}
  <form method="POST">
    <label for="endpoint">API endpoint</label>
    <input id="endpoint" name="endpoint" type="url" placeholder="https://provider.example/v1" value={formValues?.endpoint ?? data.settings.endpoint} />
    <p class="muted">Enter the API base URL ending in <code>/v1</code>, not the full chat-completions path.</p>

    <label for="model">Model</label>
    <input id="model" name="model" placeholder="model-name" value={formValues?.model ?? data.settings.model} />

    <label for="api_key">API key</label>
    <input id="api_key" name="api_key" type="password" autocomplete="new-password"
      placeholder={data.settings.hasApiKey ? 'Key configured — leave blank to keep it' : 'Enter API key'} />
    <p class="muted">{data.settings.hasApiKey ? 'An API key is configured. It is never displayed.' : 'No API key is configured.'}</p>

    <label class="checkbox">
      <input name="enabled" type="checkbox" value="yes" checked={formValues?.enabled ?? data.settings.enabled} />
      Enable AI reviews
    </label>

    <div class="actions">
      <button>Save AI settings</button>
      <a class="button secondary" href="/admin">Back to admin</a>
    </div>
  </form>
</div>
