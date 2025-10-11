<tech_stack>
  Electron v38
  Electron Forge
  React v19
  TypeScript v5.9
  Tailwind CSS v4
  SQLite v5
  Node.js
  Vite v7
  react-router v7
  Biome v2
  Supabase (Auth, Postgres, Edge Functions)
  OpenRouter.ai (LLM API)
</tech_stack>

<!-- Architecture Notes
Local-first architecture:
- Entries & summaries stored in local SQLite (per-user machine).
- Supabase Edge Function `generate_weekly_summary` enforces quota and proxies LLM requests.
- No general REST API / no sync layer in MVP.
Security:
- OpenRouter API key remains server-side (Edge Function secret).
- Quota table (user_ai_quota) prevents tampering with local DB to gain extra summaries.
-->
