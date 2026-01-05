-- 1. Adicionar coluna avatar_url na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Remover colunas fixas de followers/following (vamos contar dinamicamente)
-- (Se você já criou essas colunas antes, pode deixar, mas não vamos usar)

-- 3. Criar tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id)
);

-- 4. Políticas para comentários (qualquer usuário autenticado pode criar)
CREATE POLICY "Usuários podem criar comentários" ON comments FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Comentários são públicos" ON comments FOR SELECT 
USING (true);

CREATE POLICY "Usuário pode deletar próprio comentário" ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
