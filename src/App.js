import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('feed');
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  
  // Post states
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [todayPosted, setTodayPosted] = useState(false);
  
  // Profile states
  const [profile, setProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editAvatar, setEditAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Follow states
  const [followStats, setFollowStats] = useState({});
  const [isFollowing, setIsFollowing] = useState({});
  
  // Comment states
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      checkTodayPost();
      loadFollowStats();
    }
  }, [user]);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await loadProfile(session.user.id);
    }
    setLoading(false);
  }

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, username, name, avatar_url),
        likes (user_id)
      `)
      .order('created_at', { ascending: false });
    
    setPosts(data || []);
    
    // Load comments for all posts
    if (data) {
      data.forEach(post => loadComments(post.id));
    }
  }

  async function loadFollowStats() {
    if (!user) return;
    
    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id');
    
    if (!profiles) return;
    
    const stats = {};
    const following = {};
    
    for (const prof of profiles) {
      // Count followers
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', prof.id);
      
      // Count following
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', prof.id);
      
      stats[prof.id] = {
        followers: followersCount || 0,
        following: followingCount || 0
      };
      
      // Check if current user follows this profile
      if (prof.id !== user.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', prof.id)
          .single();
        
        following[prof.id] = !!followData;
      }
    }
    
    setFollowStats(stats);
    setIsFollowing(following);
  }

  async function loadComments(postId) {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    setComments(prev => ({
      ...prev,
      [postId]: data || []
    }));
  }

  async function checkTodayPost() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('posted_date', today);
    
    setTodayPosted(data && data.length > 0);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert('Erro ao criar conta: ' + authError.message);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            username: username,
            name: name,
            bio: '',
            location: '',
            link: '',
            avatar_url: null,
            is_company: false
          }
        ]);

      if (profileError) {
        alert('Erro ao criar perfil: ' + profileError.message);
      } else {
        alert('Conta criada! Verifique seu email.');
      }
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro ao entrar: ' + error.message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setView('feed');
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setEditAvatar(file);
    };
    reader.readAsDataURL(file);
  }

  async function handlePost() {
    if (!selectedImage || !user) return;

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      const { error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            image_url: publicUrl,
            caption: caption,
            posted_date: new Date().toISOString().split('T')[0]
          }
        ]);

      if (postError) throw postError;

      setSelectedImage(null);
      setCaption('');
      setTodayPosted(true);
      setView('feed');
      loadPosts();
      alert('Foto postada! ✨');
    } catch (error) {
      alert('Erro ao postar: ' + error.message);
    }
  }

  async function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    const hasLiked = post.likes.some(l => l.user_id === user.id);

    if (hasLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: user.id }]);
    }

    loadPosts();
  }

  async function toggleFollow(userId) {
    if (isFollowing[userId]) {
      // Unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
    } else {
      // Follow
      await supabase
        .from('follows')
        .insert([{
          follower_id: user.id,
          following_id: userId
        }]);
    }
    
    loadFollowStats();
  }

  async function handleComment(postId) {
    if (!commentText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          comment_text: commentText
        }]);
      
      if (error) throw error;
      
      setCommentText('');
      loadComments(postId);
    } catch (error) {
      alert('Erro ao comentar: ' + error.message);
    }
  }

  async function handleUpdateProfile() {
    try {
      let avatarUrl = profile.avatar_url;

      // Upload avatar if changed
      if (editAvatar) {
        const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, editAvatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          username: editUsername,
          bio: editBio,
          location: editLocation,
          link: editLink,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      await loadProfile(user.id);
      setEditingProfile(false);
      setEditAvatar(null);
      setAvatarPreview(null);
      alert('Perfil atualizado! ✨');
    } catch (error) {
      alert('Erro ao atualizar perfil: ' + error.message);
    }
  }

  function openEditProfile() {
    setEditName(profile.name || '');
    setEditUsername(profile.username || '');
    setEditBio(profile.bio || '');
    setEditLocation(profile.location || '');
    setEditLink(profile.link || '');
    setAvatarPreview(profile.avatar_url || null);
    setEditingProfile(true);
  }

  async function viewProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setViewingProfile(data);
    setView('viewing-profile');
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    return `há ${diffDays} dias`;
  }

  function renderAvatar(profile, size = 'normal') {
    const sizeClass = size === 'large' ? 'avatar avatar-large' : 'avatar';
    if (profile?.avatar_url) {
      return (
        <div className={sizeClass}>
          <img src={profile.avatar_url} alt={profile.name} />
        </div>
      );
    }
    return (
      <div className={sizeClass}>
        {profile?.name?.charAt(0).toUpperCase()}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Carregando...</div>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-logo">suaaave</div>
          <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </>
            )}
            <input
              type="email"
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="auth-input"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn">
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
          <div className="auth-divider">
            <button
              className="auth-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Criar nova conta' : 'Já tem conta? Entre'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="app">
      <header className="header">
        <div className="logo">suaaave</div>
        <div className="header-icons">
          <button className="icon-btn" onClick={() => setView('feed')}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setView('create')}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setView('profile')}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </div>
      </header>

      {/* Feed */}
      {view === 'feed' && (
        <div className="feed-container">
          {posts.length === 0 ? (
            <div className="empty-feed">
              <svg width="64" height="64" fill="none" stroke="#dbdbdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <div className="empty-title">Bem-vindo ao suaaave</div>
              <div className="empty-text">
                Siga pessoas para ver suas fotos diárias
              </div>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div onClick={() => viewProfile(post.profiles.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      {renderAvatar(post.profiles)}
                      <div className="post-user-info">
                        <div className="post-username">{post.profiles?.username}</div>
                        <div className="post-date">{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                    {post.profiles.id !== user.id && (
                      <button 
                        className="follow-btn-small"
                        onClick={() => toggleFollow(post.profiles.id)}
                      >
                        {isFollowing[post.profiles.id] ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}
                  </div>
                  <img src={post.image_url} alt="" className="post-image" />
                  <div className="post-actions">
                    <button 
                      className="action-btn"
                      onClick={() => toggleLike(post.id)}
                    >
                      {post.likes.some(l => l.user_id === user.id) ? (
                        <svg width="24" height="24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      ) : (
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      )}
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    >
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                  </div>
                  {post.likes.length > 0 && (
                    <div className="like-count">
                      {post.likes.length} {post.likes.length === 1 ? 'curtida' : 'curtidas'}
                    </div>
                  )}
                  {post.caption && (
                    <div className="post-caption">
                      <span className="caption-username">{post.profiles?.username}</span>
                      {post.caption}
                    </div>
                  )}
                  
                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="comments-section">
                      {comments[post.id]?.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <span className="comment-username">{comment.profiles?.username}</span>
                          <span className="comment-text">{comment.comment_text}</span>
                        </div>
                      ))}
                      <div className="comment-input-box">
                        <input
                          type="text"
                          placeholder="Adicione um comentário..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(post.id);
                            }
                          }}
                          className="comment-input"
                        />
                        <button 
                          onClick={() => handleComment(post.id)}
                          className="comment-post-btn"
                          disabled={!commentText.trim()}
                        >
                          Publicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="feed-end">você viu tudo por hoje ✨</div>
            </>
          )}
        </div>
      )}

      {/* Create Post */}
      {view === 'create' && (
        <div className="create-container">
          {todayPosted ? (
            <div className="already-posted-box">
              <svg width="64" height="64" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px' }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div className="already-title">Você já postou hoje</div>
              <div className="already-text">
                Volte amanhã para compartilhar um novo momento
              </div>
            </div>
          ) : (
            <>
              <div className="create-title">Criar publicação</div>
              <div className="create-subtitle">
                Compartilhe sua foto de hoje
              </div>

              {!selectedImage ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="upload-box">
                    <svg width="64" height="64" fill="none" stroke="#dbdbdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <div className="upload-text">Selecionar foto</div>
                    <div className="upload-subtext">clique aqui</div>
                  </label>
                </>
              ) : (
                <>
                  <img src={selectedImage} alt="Preview" className="image-preview" />
                  <textarea
                    className="caption-input"
                    placeholder="Escreva uma legenda..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                    maxLength={200}
                  />
                  <div className="char-counter">{caption.length}/200</div>
                  <button className="post-btn" onClick={handlePost}>
                    Publicar
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setSelectedImage(null);
                      setCaption('');
                    }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Own Profile */}
      {view === 'profile' && profile && (
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar-section">
              {renderAvatar(profile, 'large')}
            </div>
            <div className="profile-info">
              <div className="profile-top">
                <div className="profile-username">@{profile.username}</div>
                <button className="edit-profile-btn" onClick={openEditProfile}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m6-12H6m6 0a6 6 0 0 0 0 12 6 6 0 0 0 0-12z"></path>
                  </svg>
                </button>
              </div>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {posts.filter(p => p.user_id === user.id).length}
                  </span>{' '}
                  <span className="stat-label">fotos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{followStats[user.id]?.followers || 0}</span>{' '}
                  <span className="stat-label">seguidores</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{followStats[user.id]?.following || 0}</span>{' '}
                  <span className="stat-label">seguindo</span>
                </div>
              </div>
              <div className="profile-bio-section">
                <div className="profile-name">{profile.name}</div>
                {profile.bio && <div className="profile-bio">{profile.bio}</div>}
                {profile.location && (
                  <div className="profile-location">
                    📍 {profile.location}
                  </div>
                )}
                {profile.link && (
                  <a href={`https://${profile.link}`} className="profile-link" target="_blank" rel="noopener noreferrer">
                    🔗 {profile.link}
                  </a>
                )}
              </div>
              <button className="cancel-btn" onClick={handleSignOut} style={{ marginTop: '20px' }}>
                Sair
              </button>
            </div>
          </div>

          <div className="profile-grid-container">
            <div className="profile-grid">
              {posts
                .filter(p => p.user_id === user.id)
                .map(post => (
                  <div key={post.id} className="grid-item" onClick={() => setSelectedPost(post)}>
                    <img src={post.image_url} alt="" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Other Profile */}
      {view === 'viewing-profile' && viewingProfile && (
        <div className="profile-container">
          <button className="back-btn" onClick={() => setView('feed')}>
            ← Voltar
          </button>
          <div className="profile-header">
            <div className="profile-avatar-section">
              {renderAvatar(viewingProfile, 'large')}
            </div>
            <div className="profile-info">
              <div className="profile-top">
                <div className="profile-username">@{viewingProfile.username}</div>
                {viewingProfile.id !== user.id && (
                  <button 
                    className="edit-profile-btn"
                    onClick={() => toggleFollow(viewingProfile.id)}
                  >
                    {isFollowing[viewingProfile.id] ? 'Deixar de seguir' : 'Seguir'}
                  </button>
                )}
              </div>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {posts.filter(p => p.user_id === viewingProfile.id).length}
                  </span>{' '}
                  <span className="stat-label">fotos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{followStats[viewingProfile.id]?.followers || 0}</span>{' '}
                  <span className="stat-label">seguidores</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{followStats[viewingProfile.id]?.following || 0}</span>{' '}
                  <span className="stat-label">seguindo</span>
                </div>
              </div>
              <div className="profile-bio-section">
                <div className="profile-name">{viewingProfile.name}</div>
                {viewingProfile.bio && <div className="profile-bio">{viewingProfile.bio}</div>}
                {viewingProfile.location && (
                  <div className="profile-location">
                    📍 {viewingProfile.location}
                  </div>
                )}
                {viewingProfile.link && (
                  <a href={`https://${viewingProfile.link}`} className="profile-link" target="_blank" rel="noopener noreferrer">
                    🔗 {viewingProfile.link}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="profile-grid-container">
            <div className="profile-grid">
              {posts
                .filter(p => p.user_id === viewingProfile.id)
                .map(post => (
                  <div key={post.id} className="grid-item" onClick={() => setSelectedPost(post)}>
                    <img src={post.image_url} alt="" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="modal-overlay" onClick={() => setEditingProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Editar perfil</div>
              <button className="modal-close" onClick={() => setEditingProfile(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field" style={{ textAlign: 'center' }}>
                <div className="avatar-upload-section">
                  {avatarPreview ? (
                    <div className="avatar avatar-large">
                      <img src={avatarPreview} alt="Avatar preview" />
                    </div>
                  ) : (
                    <div className="avatar avatar-large">
                      {editName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                    id="avatar-input"
                  />
                  <label htmlFor="avatar-input" className="avatar-upload-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </label>
                </div>
                <div style={{ fontSize: '12px', color: '#8e8e8e', marginTop: '10px' }}>
                  Clique no ícone para alterar a foto
                </div>
              </div>
              
              <div className="form-field">
                <label className="field-label">Nome</label>
                <input
                  type="text"
                  className="field-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Nome de usuário</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#8e8e8e', fontSize: '14px' }}>@</span>
                  <input
                    type="text"
                    className="field-input"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="nomedeusuario"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Bio</label>
                <textarea
                  className="field-input"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
                  maxLength={160}
                  rows={3}
                  placeholder="Conte um pouco sobre você"
                />
                <div className="char-counter">{editBio.length}/160</div>
              </div>
              <div className="form-field">
                <label className="field-label">Localização</label>
                <input
                  type="text"
                  className="field-input"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="cidade, país"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Link</label>
                <input
                  type="text"
                  className="field-input"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="seu-site.com"
                />
              </div>
              <button className="save-btn" onClick={handleUpdateProfile}>
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-post" onClick={() => setSelectedPost(null)}>
              ✕
            </button>
            <img src={selectedPost.image_url} alt="" className="modal-post-image" />
            {selectedPost.caption && (
              <div className="modal-post-caption">
                <strong>{profile.username}</strong> {selectedPost.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
