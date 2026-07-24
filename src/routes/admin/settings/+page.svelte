<script lang="ts">
  let { data, form } = $props();
  type Field = 'event_name' | 'timezone' | 'registration_deadline' | 'idea_deadline' | 'development_deadline' | 'submission_deadline';
  const formValues = $derived(form && 'values' in form ? form.values : undefined);
  const value = (key: Field) => formValues?.[key] ?? data.settings[key];
</script>
<div class="card narrow">
  <h1>Event settings</h1>
  <div class="notice">Deadline inputs are entered and stored as UTC. Event display timezone is {data.settings.timezone}.</div>
  {#if form?.message}<div class="error">{form.message}</div>{/if}{#if form?.success}<div class="notice">Event settings saved.</div>{/if}
  <form method="POST">
    <label for="event_name">Event name</label><input id="event_name" name="event_name" required value={value('event_name')} />
    <label for="timezone">Event timezone</label><input id="timezone" name="timezone" required value={value('timezone')} placeholder="Asia/Kolkata" />
    <label for="registration_deadline">Registration deadline (UTC)</label><input id="registration_deadline" name="registration_deadline" type="datetime-local" required value={value('registration_deadline')} />
    <label for="idea_deadline">Idea deadline (UTC)</label><input id="idea_deadline" name="idea_deadline" type="datetime-local" required value={value('idea_deadline')} />
    <label for="development_deadline">Development deadline (UTC)</label><input id="development_deadline" name="development_deadline" type="datetime-local" required value={value('development_deadline')} />
    <label for="submission_deadline">Final submission deadline (UTC)</label><input id="submission_deadline" name="submission_deadline" type="datetime-local" required value={value('submission_deadline')} />
    <div class="actions"><button>Save settings</button><a class="button secondary" href="/admin">Back to admin</a></div>
  </form>
</div>
