# Instruções para agentes

## Pushes e builds do Cloudflare Pages

- O Cloudflare Pages constrói o site a cada push que tem permissão de construir (integração nativa com o GitHub, sem workflow). Em Branch control, só `main` gera build (Preview branch: None).
- Acumule commits localmente e faça push uma vez por entrega, não a cada commit.
- Todo commit de agente em branch que não seja `main` leva `[CF-Pages-Skip]` na mensagem. O Pages lê só o último commit de cada push, então o marcador precisa estar nele. Não use `[skip ci]`.
- Títulos de PR para `main` nunca levam o marcador: o GitHub copia o título no commit de merge, e com ele o site não seria publicado.
- Não crie branches só para prévia. Se algo precisar ser visto ao vivo antes do merge, peça ao usuário.
