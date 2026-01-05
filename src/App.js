import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('feed');

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Posts
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [todayPosted, setTodayPosted] = useState(false);

  // Profile
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

  // Follow
  const [followStats, setFollowStats] = useState({});
  const [isFollowing, setIsFollowing] = useState({});
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);

  // Comments
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Modals
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  /* =========================
     AUTH & INIT
  ========================== */

  useEffect(() => {
    checkUser();

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      if (session?.user) loadProfile(session.user.id);
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      loadFollowStats();
      loadFollowingList();
      checkTodayPost();
    }
  }, [user]);

  async function checkUser() {
    const { data } = await supabase.auth.getSession();
    setUser(data?.session?.user || null);
    if (data?.session?.user) loadProfile(data.session.user.id);
    setLoading(false);
  }

  /* =========================
     DATA LOADERS
  ========================== */

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, name, avatar_url), likes(user_id)')
      .order('created_at', { ascending: false });

    setPosts(data || []);
    data?.forEach(p => loadComments(p.id));
  }

  async function loadComments(postId) {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at');

    setComments(prev => ({ ...prev, [postId]: data || [] }));
  }

  async function loadFollowingList() {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    setFollowingList(data?.map(f => f.following_id) || []);
  }

  async function loadFollowers(userId) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id, profiles:follower_id(id, username, name, avatar_url)')
      .eq('following_id', userId);

    setFollowersList(data || []);
  }

  async function loadFollowStats() {
    const { data: profiles } = await supabase.from('profiles').select('id');
    const stats = {};
    const following = {};

    for (const p of profiles || []) {
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', p.id);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', p.id);

      stats[p.id] = { followers, following: followingCount };

      if (p.id !== user.id) {
        const { data } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', p.id)
          .single();

        following[p.id] = !!data;
      }
    }

    setFollowStats(stats);
    setIsFollowing(following);
  }

  async function checkTodayPost() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('posted_date', today);

    setTodayPosted((data || []).length > 0);
  }

  /* =========================
     ACTIONS
  ========================== */

  async function toggleFollow(userId) {
    if (isFollowing[userId]) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    } else {
      await supabase.from('follows').insert([{ follower_id: user.id, following_id: userId }]);
    }
    loadFollowStats();
    loadFollowingList();
  }

  async function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const liked = post.likes.some(l => l.user_id === user.id);

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: user.id }]);
    }

    loadPosts();
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Excluir sua conta? Isso é irreversível.')) return;
    await supabase.rpc('delete_my_account');
    await supabase.auth.signOut();
    window.location.reload();
  }

  /* =========================
     UI HELPERS
  ========================== */

  function renderAvatar(p, size = 'normal') {
    const cls = size === 'large' ? 'avatar avatar-large' : 'avatar';
    return p?.avatar_url ? (
      <div className={cls}><img src={p.avatar_url} alt="" /></div>
    ) : (
      <div className={cls}>{p?.name?.[0]}</div>
    );
  }

  /* =========================
     RENDER
  ========================== */

  if (loading) return <div style={{ padding: 40 }}>Carregando…</div>;

  if (!user) return <div>Login / Cadastro (mantém o seu)</div>;

  return (
    <div className="app">
      {/* … TODO O SEU APP (feed, perfil, etc) … */}

      {/* FOLLOWERS MODAL */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Seguidores</div>
              <button className="modal-close" onClick={() => setShowFollowers(false)}>✕</button>
            </div>
            <div className="modal-body">
              {followersList.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999' }}>Ninguém te segue ainda</div>
              ) : (
                followersList.map(f => (
                  <div
                    key={f.follower_id}
                    className="search-result-item"
                    onClick={() => {
                      setShowFollowers(false);
                      setViewingProfile(f.profiles);
                      setView('viewing-profile');
                    }}
                  >
                    {renderAvatar(f.profiles)}
                    <div>
                      <div>@{f.profiles.username}</div>
                      <div>{f.profiles.name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
