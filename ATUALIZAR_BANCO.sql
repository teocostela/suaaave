-- 1. Adicionar coluna avatar_url na tabela profiles (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Criar tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Políticas para comentários
DROP POLICY IF EXISTS "Usuários podem criar comentários" ON comments;
DROP POLICY IF EXISTS "Comentários são públicos" ON comments;
DROP POLICY IF EXISTS "Usuário pode deletar próprio comentário" ON comments;

CREATE POLICY "Usuários podem criar comentários" ON comments FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Comentários são públicos" ON comments FOR SELECT 
USING (true);

CREATE POLICY "Usuário pode deletar próprio comentário" ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Políticas para posts (adicionar UPDATE e DELETE)
DROP POLICY IF EXISTS "Usuário pode editar próprio post" ON posts;
DROP POLICY IF EXISTS "Usuário pode deletar próprio post" ON posts;

CREATE POLICY "Usuário pode editar próprio post" ON posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode deletar próprio post" ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- 6. DESABILITAR confirmação de email obrigatória
-- IMPORTANTE: Faça isso manualmente nas configurações do Supabase:
-- 1. Vá em Authentication → Settings
-- 2. Desmarque "Enable email confirmations"
-- 3. Mantenha marcado "Enable email" (para enviar o email, mas não obrigar confirmação)
