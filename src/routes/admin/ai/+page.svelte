<script lang="ts">
  let { data, form } = $props();
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Administration</p>
    <h1>AI review settings</h1>
    <p class="page-description">Configure the OpenAI-compatible provider used for manual, advisory source reviews.</p>
  </div>
  <a class="btn btn-secondary" href="/admin">Back to overview</a>
</div>

{#if form?.message}<div class="alert alert-error mt-6" role="alert">{form.message}</div>{/if}
{#if form?.success}<div class="alert alert-success mt-6">AI review settings saved.</div>{/if}

<form method="POST" class="panel mt-6">
  <section class="form-section">
    <div class="form-section-header">
      <h2>Provider connection</h2>
      <p>The key remains server-side and is never returned by this page.</p>
    </div>
    <div class="form-stack">
      <div class="field">
        <label for="endpoint">OpenAI-compatible base URL</label>
        <input id="endpoint" name="endpoint" type="url" placeholder="https://provider.example/v1" value={formValues?.endpoint ?? data.settings.endpoint} />
        <p class="field-help">Use the base URL ending in <code>/v1</code>, not the full chat-completions path.</p>
      </div>
      <div class="field">
        <label for="model">Model ID</label>
        <input id="model" name="model" placeholder="model-name" value={formValues?.model ?? data.settings.model} />
      </div>
      <div class="field">
        <label for="api_key">API key</label>
        <input id="api_key" name="api_key" type="password" autocomplete="new-password"
          placeholder={data.settings.hasApiKey ? 'Key configured. Leave blank to keep it.' : 'Enter API key'} />
        <p class="field-help">{data.settings.hasApiKey ? 'A key is configured. Saving a blank value preserves it.' : 'No API key is configured.'}</p>
      </div>
    </div>
  </section>

  <section class="form-section">
    <label class="checkbox-row">
      <input name="enabled" type="checkbox" value="yes" checked={formValues?.enabled ?? data.settings.enabled} />
      <span>
        <strong class="block text-ink">Enable AI reviews</strong>
        Admins can manually run reviews after final submissions close.
      </span>
    </label>
  </section>

  <div class="form-actions">
    <button class="btn btn-primary">Save AI settings</button>
    <span class="text-xs text-ink-soft">Reviews remain advisory and never assign a score.</span>
  </div>
</form>
