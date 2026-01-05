# Guia Rápido - Versão 5

## Arquivos já criados ✅
- `src/utils.js` - Timezone do Brasil
- `src/index.js` - Com React Router
- `package.json` - Com react-router-dom

## O que modificar no App.js:

### 1. IMPORTS (linha 1-3)
ADICIONAR após `import React...`:
```javascript
import { useNavigate } from 'react-router-dom';
import { getBrazilDate, formatDate } from './utils';
```

DELETAR a função formatDate() que está dentro do App (linha ~460)

### 2. ESTADOS (logo após `const [selectedPost, setSelectedPost] = useState(null);`)
ADICIONAR:
```javascript
const navigate = useNavigate();
const [showFollowersList, setShowFollowersList] = useState(false);
const [followersList, setFollowersList] = useState([]);
const [followingListData, setFollowingListData] = useState([]);
const [listType, setListType] = useState('followers');
```

### 3. FUNÇÕES (adicionar antes de `if (loading)`)
```javascript
async function loadFollowersList() {
  const { data } = await supabase
    .from('follows')
    .select('follower_id, profiles!follows_follower_id_fkey(id, username, name, avatar_url)')
    .eq('following_id', user.id);
  setFollowersList(data?.map(f => f.profiles) || []);
}

async function loadFollowingListData() {
  const { data } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(id, username, name, avatar_url)')
    .eq('follower_id', user.id);
  setFollowingListData(data?.map(f => f.profiles) || []);
}

function openFollowersList(type) {
  setListType(type);
  if (type === 'followers') {
    loadFollowersList();
  } else {
    loadFollowingListData();
  }
  setShowFollowersList(true);
}

function shareProfile() {
  const url = `${window.location.origin}/${profile.username}`;
  navigator.clipboard.writeText(url);
  alert(`Link copiado!
${url}`);
}
```

### 4. NO PERFIL - Tornar stats clicáveis
PROCURAR:
```javascript
<div className="stat-item">
  <span className="stat-number">{followStats[user.id]?.followers || 0}</span>{' '}
  <span className="stat-label">seguidores</span>
</div>
```

SUBSTITUIR POR:
```javascript
<div className="stat-item" onClick={() => openFollowersList('followers')} style={{cursor: 'pointer'}}>
  <span className="stat-number">{followStats[user.id]?.followers || 0}</span>{' '}
  <span className="stat-label">seguidores</span>
</div>
```

E o mesmo para "seguindo":
```javascript
<div className="stat-item" onClick={() => openFollowersList('following')} style={{cursor: 'pointer'}}>
  <span className="stat-number">{followStats[user.id]?.following || 0}</span>{' '}
  <span className="stat-label">seguindo</span>
</div>
```

### 5. BOTÃO COMPARTILHAR
APÓS o botão "Editar perfil", ADICIONAR:
```javascript
<button className="share-profile-btn" onClick={shareProfile}>
  📎 Compartilhar
</button>
```

### 6. MODAL DE SEGUIDORES
ANTES do último `</div>` do component (antes de fechar o App), ADICIONAR:
```javascript
{showFollowersList && (
  <div className="modal-overlay" onClick={() => setShowFollowersList(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title">
          {listType === 'followers' ? 'Seguidores' : 'Seguindo'}
        </div>
        <button className="modal-close" onClick={() => setShowFollowersList(false)}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        {(listType === 'followers' ? followersList : followingListData).map(person => (
          <div key={person.id} className="search-result-item" onClick={() => {
            setShowFollowersList(false);
            navigate(`/${person.username}`);
          }}>
            {renderAvatar(person)}
            <div className="search-result-info">
              <div className="search-result-username">@{person.username}</div>
              <div className="search-result-name">{person.name}</div>
            </div>
          </div>
        ))}
        {(listType === 'followers' ? followersList : followingListData).length === 0 && (
          <div className="empty-search">
            {listType === 'followers' ? 'Nenhum seguidor ainda' : 'Não está seguindo ninguém'}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

### 7. SUBSTITUIR TODAS OCORRÊNCIAS
CTRL+F e substituir:
- `new Date().toISOString().split('T')[0]` POR `getBrazilDate()`

### 8. ENVOLVER APP COM ROUTES
NO FINAL DO ARQUIVO, SUBSTITUIR:
```javascript
export default function App() {
```

POR:
```javascript
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  );
}

function App() {
```

E importar no topo:
```javascript
import { Routes, Route } from 'react-router-dom';
```

## CSS - Adicionar no final:
```css
.share-profile-btn {
  padding: 7px 16px;
  background: #fff;
  border: 1px solid #10b981;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: #10b981;
}

.share-profile-btn:hover {
  background: #f0fdf4;
}
```

---

## Testando

1. Clique nos números de seguidores/seguindo
2. Clique em "Compartilhar" e cole o link em uma aba anônima
3. Poste hoje e tente postar de novo (não deve deixar)

