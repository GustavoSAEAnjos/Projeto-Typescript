# Catálogo de filmes e séries

Aplicação em TypeScript com uma interface Vite e uma API Express que consulta o MySQL do XAMPP. A API preserva o tema do catálogo e lê as tabelas `Midias`, `Generos` e `MidiaGenero`.

## Requisitos

- Node.js 20.19+ e npm
- MySQL/MariaDB do XAMPP iniciado
- Banco `catalogomidias` existente, com as tabelas de mídias, gêneros e usuários já configuradas

## Configuração

Na raiz do projeto, copie `.env.example` para `.env` e ajuste as credenciais caso sejam diferentes das configurações padrão do XAMPP:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=catalogomidias
API_PORT=3000
JWT_SEGREDO=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
```

Substitua `JWT_SEGREDO` por uma chave aleatória com pelo menos 32 caracteres. Você pode gerar uma com:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

O arquivo `.env` é local e não deve ser enviado ao Git.

## Executar

```sh
npm install
npm run dev
```

O comando inicia a API em `http://localhost:3000` e a interface Vite em `http://localhost:5173` (ou na próxima porta disponível). A interface encaminha as chamadas `/api` para a API.

- `GET /api/midias` e `GET /api/midias/:id` consultam o catálogo.
- `GET /api/generos` lista os gêneros disponíveis.
- `POST /api/usuarios` cria uma conta; a coluna `usuarios.senha` guarda somente o hash bcrypt.
- `POST /api/login` autentica e devolve um JWT com validade de 8 horas.
- `GET /api/eu` devolve os dados públicos do usuário autenticado.
- `POST /api/midias` cadastra uma mídia e seus gêneros.
- `PATCH /api/midias/:id/status` atualiza o status.
- `DELETE /api/midias/:id` remove a mídia e seus vínculos de gênero.

As rotas de mídia exigem login e filtram por `idUsuario`, que vem do token assinado — nunca do corpo enviado pelo navegador. A interface guarda o JWT no `localStorage`, envia o cabeçalho `Authorization: Bearer ...` e permite sair. Cadastro, atualização de status e remoção são persistidos antes de a interface atualizar a lista.

O banco atual não tem índice `UNIQUE` para `usuarios.email`; a API verifica e-mails repetidos antes do cadastro, mas a garantia contra cadastros simultâneos depende de uma restrição única no banco. Nenhum schema é alterado pelo projeto.

## Verificar e compilar

```sh
npm run verificar
npm run build
```
