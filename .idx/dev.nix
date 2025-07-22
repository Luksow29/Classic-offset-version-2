{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    # We'll keep supabase-cli as it's useful for deploying
    pkgs.supabase-cli
  ];
  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
    # We'll keep the Supabase extension as it's useful
    "supabase.supabase-vscode"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
