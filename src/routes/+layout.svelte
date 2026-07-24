<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';

  let { children, data } = $props();

  const teamNavigation = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/idea', label: 'Idea declaration' },
    { href: '/submission', label: 'Final submission' }
  ];
  const adminNavigation = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/settings', label: 'Event settings' },
    { href: '/admin/ai', label: 'AI review settings' },
    { href: '/admin/export', label: 'Export CSV' }
  ];

  const navigation = $derived(data.user?.role === 'admin' ? adminNavigation : teamNavigation);
  const isActive = (href: string) => href === '/admin'
    ? page.url.pathname === href
    : page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

{#if data.user}
  <div class="min-h-screen md:grid md:grid-cols-[248px_minmax(0,1fr)]">
    <aside class="hidden h-screen flex-col bg-sidebar text-paper md:sticky md:top-0 md:flex">
      <a class="flex items-center gap-3 border-b border-paper/10 px-5 py-5 no-underline" href={data.user.role === 'admin' ? '/admin' : '/dashboard'}>
        <span class="grid size-9 place-items-center rounded-md bg-accent font-bold text-sidebar">S</span>
        <span>
          <span class="block text-sm font-semibold leading-5">Sahityolsav</span>
          <span class="block text-xs text-paper/55">Tech Events</span>
        </span>
      </a>

      <div class="px-5 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper/40">
        {data.user.role === 'admin' ? 'Event operations' : data.team?.name ?? 'Team workspace'}
      </div>
      <nav class="flex flex-1 flex-col gap-1 px-3">
        {#each navigation as item}
          <a
            href={item.href}
            class="rounded-md px-3 py-2.5 text-sm font-medium no-underline transition-colors {isActive(item.href) ? 'bg-paper/12 text-paper' : 'text-paper/65 hover:bg-paper/7 hover:text-paper'}"
            aria-current={isActive(item.href) ? 'page' : undefined}
          >{item.label}</a>
        {/each}
      </nav>

      <div class="border-t border-paper/10 p-4">
        <p class="truncate px-2 text-xs text-paper/50">{data.user.email}</p>
        <form method="POST" action="/logout" class="mt-2">
          <button class="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-paper/70 hover:bg-paper/7 hover:text-paper">Log out</button>
        </form>
      </div>
    </aside>

    <div class="min-w-0">
      <header class="sticky top-0 z-20 border-b bg-surface/95 backdrop-blur-sm md:hidden">
        <div class="flex h-14 items-center justify-between px-4">
          <a class="flex items-center gap-2 font-semibold no-underline" href={data.user.role === 'admin' ? '/admin' : '/dashboard'}>
            <span class="grid size-7 place-items-center rounded-sm bg-sidebar text-xs font-bold text-paper">S</span>
            <span>Sahityolsav Tech</span>
          </a>
          <form method="POST" action="/logout"><button class="btn btn-ghost btn-sm">Log out</button></form>
        </div>
        <nav class="flex gap-1 overflow-x-auto px-3 pb-2">
          {#each navigation as item}
            <a
              href={item.href}
              class="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold no-underline {isActive(item.href) ? 'bg-brand-soft text-brand' : 'text-ink-soft'}"
              aria-current={isActive(item.href) ? 'page' : undefined}
            >{item.label}</a>
          {/each}
        </nav>
      </header>

      <main class="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {@render children()}
      </main>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-canvas">
    <header class="border-b bg-surface">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <a class="flex items-center gap-3 font-semibold no-underline" href="/login">
          <span class="grid size-9 place-items-center rounded-md bg-sidebar font-bold text-paper">S</span>
          <span>
            <span class="block text-sm leading-4">Sahityolsav</span>
            <span class="block text-xs font-normal text-ink-soft">Tech Events</span>
          </span>
        </a>
      </div>
    </header>
    <main class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-16">
      {@render children()}
    </main>
  </div>
{/if}
