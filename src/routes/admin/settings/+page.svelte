<script lang="ts">
  let { data, form } = $props();
  type Field = 'event_name' | 'registration_deadline' | 'idea_deadline' | 'submission_deadline';
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
  const value = (key: Field) => formValues?.[key] ?? data.settings[key];
</script>

<div class="page-header">
  <div>
    <p class="page-kicker">Administration</p>
    <h1>Event settings</h1>
    <p class="page-description">Control the event name and important deadlines.</p>
  </div>
  <a class="btn btn-secondary" href="/admin">Back to overview</a>
</div>

{#if form?.message}<div class="alert alert-error mt-4" role="alert">{form.message}</div>{/if}
{#if form?.success}<div class="alert alert-success mt-4">Event settings saved.</div>{/if}

<form method="POST" class="panel mt-6">
  <section class="form-section">
    <div class="form-section-header">
      <h2>Event identity</h2>
      <p>This name appears on the team dashboard and registration screen.</p>
    </div>
    <div class="field max-w-xl">
      <label for="event_name">Event name</label>
      <input id="event_name" name="event_name" required value={value('event_name')} />
    </div>
  </section>

  <section class="form-section">
    <div class="form-section-header">
      <h2>Event timeline</h2>
      <p>Deadlines must remain in chronological order and take effect immediately.</p>
    </div>
    <div class="form-grid">
      <div class="field">
        <label for="registration_deadline">Registration closes</label>
        <input id="registration_deadline" name="registration_deadline" type="datetime-local" required value={value('registration_deadline')} />
      </div>
      <div class="field">
        <label for="idea_deadline">Idea declaration closes</label>
        <input id="idea_deadline" name="idea_deadline" type="datetime-local" required value={value('idea_deadline')} />
      </div>
      <div class="field">
        <label for="submission_deadline">Final submission closes</label>
        <input id="submission_deadline" name="submission_deadline" type="datetime-local" required value={value('submission_deadline')} />
      </div>
    </div>
  </section>

  <div class="form-actions">
    <button class="btn btn-primary">Save event settings</button>
    <span class="text-xs text-ink-soft">Changing a deadline takes effect immediately.</span>
  </div>
</form>
