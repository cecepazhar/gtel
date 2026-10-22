<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-dark-900 flex flex-col">
  {@render children()}
</div>
