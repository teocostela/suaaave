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
  const [followingList, setFollowingList] = useState([]);

  // 🔹 ADIÇÕES (seguidores / seguindo)
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingUsersList, setFollowingUsersList] = useState([]);

  // Comment states
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Edit post states
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');

  // Modal state
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) loadProfile(session.user.id);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadFollowingList();
      loadPosts();
      checkTodayPost();
      loadFollowStats();
    }
  }, [user]);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) await loadProfile(session.user.id);
    setLoading(false);
  }

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  async function loadFollowingList() {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    setFollowingList(data?.map(f => f.following_id) || []);
  }

  // 🔹 ADIÇÕES
  async function loadFollowers(userId) {
    const { data } = await supabase
      .from('follows')
      .select(`follower_id, profiles:follower_id (id, username, name, avatar_url)`)
      .eq('following_id', userId);
    setFollowersList(data || []);
  }

  async function loadFollowing(userId) {
    const { data } = await supabase
      .from('follows')
      .select(`following_id, profiles:following_id (id, username, name, avatar_url)`)
      .eq('follower_id', userId);
    setFollowingUsersList(data || []);
  }

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles:user_id (id, username, name, avatar_url), likes (user_id)`)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    data?.forEach(post => loadComments(post.id));
  }

  async function loadFollowStats() {
    const { data: profiles } = await supabase.from('profiles').select('id');
    const stats = {};
    const following = {};

    for (const prof of profiles || []) {
      const { count: followers } = await supabase
        .from('follows').select('*', { count: 'exact', head: true })
        .eq('following_id', prof.id);

      const { count: followingCount } = await supabase
        .from('follows').select('*', { count: 'exact', head: true })
        .eq('follower_id', prof.id);

      stats[prof.id] = { followers: followers || 0, following: followingCount || 0 };

      if (user && prof.id !== user.id) {
        const { data } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', prof.id)
          .single();
        following[prof.id] = !!data;
      }
    }

    setFollowStats(stats);
    setIsFollowing(following);
  }

  async function loadComments(postId) {
    const { data } = await supabase
      .from('comments')
      .select(`*, profiles:user_id (username, avatar_url)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    setComments(prev => ({ ...prev, [postId]: data || [] }));
  }

  async function checkTodayPost() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('posted_date', today);
    setTodayPosted(data?.length > 0);
  }

  // 🔻 DAQUI PRA BAIXO: JSX ORIGINAL + CLIQUES + MODAIS 🔻

  if (loading) return <div>Carregando…</div>;

  return (
    <div className="app">

      {/* SEU PERFIL */}
      {view === 'profile' && profile && (
        <div className="profile-container">
          <div className="profile-stats">
            <div
              className="stat-item"
              onClick={() => { loadFollowers(user.id); setShowFollowers(true); }}
            >
              <span className="stat-number">{followStats[user.id]?.followers || 0}</span>
              <span className="stat-label">seguidores</span>
            </div>

            <div
              className="stat-item"
              onClick={() => { loadFollowing(user.id); setShowFollowing(true); }}
            >
              <span className="stat-number">{followStats[user.id]?.following || 0}</span>
              <span className="stat-label">seguindo</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SEGUIDORES */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Seguidores</h3>
            {followersList.map(item => (
              <div key={item.follower_id} className="search-result-item">
                @{item.profiles.username}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SEGUINDO */}
      {showFollowing && (
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Seguindo</h3>
            {followingUsersList.map(item => (
              <div key={item.following_id} className="search-result-item">
                @{item.profiles.username}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
