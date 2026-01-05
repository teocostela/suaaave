# SUAAAVE 🌿

Uma rede social minimalista e intencional.

## Uma foto por dia. Sem pressa.

---

## ⚠️ ANTES DE FAZER DEPLOY

### 1. Atualizar banco de dados

Acesse o Supabase → SQL Editor → New query

Cole e execute o código do arquivo `ATUALIZAR_BANCO.sql`

### 2. Configurar email (IMPORTANTE!)

Siga as instruções do arquivo `CONFIGURAR_EMAIL.md`

Resumo:
- Supabase → Authentication → Providers → Email
- **DESMARQUE** "Confirm email"
- **MANTENHA** "Enable email provider"

---

## Novidades da versão 4

### ✅ CORRIGIDO:
- Sistema de seguir funcionando
- Botão like ativo
- Texto "Editar perfil" (removido ícone japonês)
- Email não obrigatório para ativar conta

### ✅ NOVO:
- **Busca de usuários** (por nome ou @username)
- **Feed vazio** quando não segue ninguém
- **Editar legenda** da própria foto
- **Excluir foto** postada
- Feed mostra apenas posts de quem você segue

---

## Como usar

### Buscar usuários:
- Clique no ícone 🔍 no header
- Digite nome ou @username
- Clique no usuário para ver perfil

### Seguir usuários:
- Clique no botão "Seguir" no feed ou perfil
- Feed mostra apenas posts de quem você segue

### Editar/Excluir post:
- No seu próprio post, clique nos 3 pontinhos (⋮)
- Escolha "Editar legenda" ou "Excluir foto"

### Comentar:
- Clique no ícone 💬
- Digite e pressione Enter

---

## Deploy

1. Execute o SQL do banco de dados
2. Configure o email no Supabase
3. Faça upload dos arquivos pro GitHub
4. Vercel faz deploy automático

---

## Estrutura

```
src/
├── App.js          # Componente principal
├── App.css         # Estilos
├── supabaseClient.js  # Configuração Supabase
└── index.js        # Entry point

public/
└── index.html      # HTML base
```
