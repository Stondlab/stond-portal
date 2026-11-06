# Área do cliente Stond

Portal em que os clientes da Stond aprovam conteúdos, veem o calendário, as métricas e os arquivos do projeto.

- Página estática (`index.html`, `app.js`, `app.css`), publicada pela Vercel a cada push na `main`.
- Dados e login no Supabase (projeto `stond-portal`): login por e-mail (Supabase Auth) com as funções `portal_me`, `portal_claim(token)` e `portal_feedback_me`.
- Convite: `?convite=<código do cliente>` abre a criação de senha e liga a conta ao cliente.
- Link antigo sem login: `?c=<código do cliente>` (funções `portal_get` e `portal_feedback`).
