<script setup>
definePage({
  redirect: (to = {}) => ({
    path: "/app",
    query: to.query,
    hash: to.hash
  })
});
</script>
