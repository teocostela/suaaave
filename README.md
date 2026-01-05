# SUAAAVE 🌿 - Versão 5

Uma rede social minimalista e intencional.

## Uma foto por dia. Sem pressa.

---

## ✨ NOVIDADES v5

### 1. Lista de Seguidores/Seguindo
- Clique nos números de "seguidores" ou "seguindo" no seu perfil
- Veja a lista completa em um modal
- Clique em qualquer pessoa para ver o perfil dela

### 2. Link do Perfil
- Botão "📎 Compartilhar" no seu perfil
- Copia automaticamente o link: `suaaave2.vercel.app/seu_username`
- Compartilhe com amigos!

### 3. Horário do Brasil (Fortaleza)
- Postagens seguem o fuso horário de Fortaleza/Brasil (UTC-3)
- A virada do dia acontece à meia-noite de Fortaleza
- Você só pode postar 1 foto por dia (horário do Brasil)

---

## 🔧 Instalação

### 1. Atualizar banco de dados
Execute o SQL do arquivo `ATUALIZAR_BANCO.sql` no Supabase

### 2. Configurar email
Siga instruções do arquivo `CONFIGURAR_EMAIL.md`

### 3. Deploy
- Faça upload dos arquivos pro GitHub
- Vercel faz deploy automático

---

## 📦 Arquivos Novos

- `src/utils.js` - Funções de timezone do Brasil
- Modificações no `src/App.js` - Features novas
- Modificações no `src/App.css` - Estilos novos
- `src/index.js` atualizado (sem mudanças necessárias, mas incluído)

---

## 🎯 Como Usar

### Ver seguidores/seguindo:
1. Vá no seu perfil
2. Clique no número de "seguidores" ou "seguindo"
3. Modal abre com a lista
4. Clique em qualquer pessoa para ver o perfil

### Compartilhar perfil:
1. Vá no seu perfil
2. Clique em "📎 Compartilhar"
3. Link copiado automaticamente
4. Cole onde quiser!

### Timezone do Brasil:
- Funciona automaticamente
- Virada do dia à meia-noite de Fortaleza
- 1 foto por dia no horário do Brasil

---

## 🐛 Todas as Correções (v4 → v5)

✅ Botão seguir funcionando  
✅ Botão like ativo  
✅ Busca de usuários  
✅ Feed vazio quando não segue ninguém  
✅ Editar legenda  
✅ Excluir foto  
✅ **NOVO:** Lista de seguidores/seguindo  
✅ **NOVO:** Link do perfil  
✅ **NOVO:** Timezone do Brasil  

---

## 📝 Notas Técnicas

- React Router NÃO foi implementado (complexidade vs benefício)
- Links do perfil funcionam via clipboard (copiar/colar)
- Timezone usa `America/Fortaleza` (UTC-3)
- Todas as features testadas e funcionando

---

Aproveite o SUAAAVE! 🌿✨
