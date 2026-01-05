# Configuração de Email (Supabase)

## Desabilitar confirmação obrigatória de email

Para que os usuários não precisem confirmar o email para fazer login (mas ainda recebam o email de boas-vindas):

1. Acesse o **Supabase** (https://supabase.com)
2. Entre no projeto **suaaave**
3. Vá em **Authentication** (menu lateral)
4. Clique em **Providers**
5. Clique em **Email**
6. **DESMARQUE** a opção: **"Confirm email"**
7. **MANTENHA MARCADO**: **"Enable email provider"**
8. Clique em **"Save"**

Pronto! Agora:
- ✅ Usuários podem fazer login imediatamente após criar conta
- ✅ Email de confirmação ainda é enviado
- ✅ Confirmação não é obrigatória

## Opcional: Personalizar email

Se quiser mudar o texto do email de boas-vindas:

1. Ainda em **Authentication** → **Email Templates**
2. Escolha **"Confirm signup"**
3. Personalize o texto
4. Salve
