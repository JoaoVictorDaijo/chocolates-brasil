# Instruções para agentes

## Branches

- Trabalho novo sai de `develop` e volta para ela por PR. `main` é o site no ar e recebe `develop` por PR de promoção, com merge commit.

## Pushes e builds do Cloudflare Pages

- O Cloudflare Pages constrói o site a cada push que tem permissão de construir (integração nativa com o GitHub, sem workflow). Em Branch control, `main` publica o site e `develop` é a única branch de prévia.
- Acumule commits localmente e faça push uma vez por entrega, não a cada commit.
- Todo commit de agente em branch que não seja `main` leva `[CF-Pages-Skip]` na mensagem. O Pages lê só o último commit de cada push, então o marcador precisa estar nele. Não use `[skip ci]`.
- Títulos de PR para `develop` também levam o marcador: o GitHub copia o título no commit de merge, e assim o merge não gera build. PRs para `main` nunca levam o marcador, senão o site não é publicado.
- Prévias ao vivo existem só em `develop` e só quando o usuário pedir. Nesse caso, retire o marcador do título do PR antes do merge; o merge constrói `develop.chocolates-brasil.pages.dev`. Não crie branches só para prévia.
