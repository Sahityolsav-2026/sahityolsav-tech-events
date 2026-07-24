<script lang="ts">
  import '../app.css';
  let { children, data } = $props();
</script>

<header>
  <a class="brand" href={data.user?.role === 'admin' ? '/admin' : '/dashboard'}>Sahityolsav Tech Events</a>
  {#if data.user}
    <nav>
      <span>{data.user.email}</span>
      <form method="POST" action="/logout"><button class="link-button">Log out</button></form>
    </nav>
  {/if}
</header>
<main>{@render children()}</main>
