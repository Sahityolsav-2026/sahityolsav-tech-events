<script lang="ts">
  let { serverTime, deadline }: { serverTime: string; deadline: string | null } = $props();
  let display = $state('—');
  let timer: ReturnType<typeof setInterval> | undefined;

  function update() {
    if (!deadline) { display = 'Complete'; return; }
    const offset = Date.parse(serverTime) - Date.now();
    const remaining = Math.max(0, Date.parse(deadline) - (Date.now() + offset));
    if (remaining <= 0) {
      display = '00:00:00';
      if (timer) clearInterval(timer);
      location.reload();
      return;
    }
    const seconds = Math.floor(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    display = `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  $effect(() => {
    update();
    timer = setInterval(update, 1000);
    return () => timer && clearInterval(timer);
  });
</script>

<div class="font-mono text-[2.35rem] font-semibold leading-none tracking-[-0.055em] text-paper tabular-nums sm:text-5xl lg:text-[3.5rem]" aria-live="polite">{display}</div>
