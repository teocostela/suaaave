# Mudanças para Versão 5

## Arquivos a criar/modificar:

### 1. src/utils.js (CRIAR NOVO)
```javascript
export function getBrazilDate() {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
  return brazilTime.toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  return `há ${diffDays} dias`;
}
```

### 2. package.json
ADICIONAR na seção dependencies:
```
"react-router-dom": "^6.20.0",
```

### 3. src/index.js
SUBSTITUIR todo conteúdo por:
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### 4. src/App.js - MUDANÇAS PRINCIPAIS:

#### No início do arquivo, ADICIONAR imports:
```javascript
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { getBrazilDate, formatDate } from './utils';
```

#### SUBSTITUIR a função formatDate() existente:
DELETAR a função formatDate que está no App.js (agora vem do utils.js)

#### SUBSTITUIR todas as ocorrências de:
```javascript
new Date().toISOString().split('T')[0]
```
POR:
```javascript
getBrazilDate()
```

#### NO INÍCIO do component App(), ADICIONAR estados:
```javascript
const [showFollowersList, setShowFollowersList] = useState(false);
const [followersList, setFollowersList] = useState([]);
const [followingList, setFollowingList] = useState([]);
const [listType, setListType] = useState('followers'); // 'followers' or 'following'
const navigate = useNavigate();
```

#### ADICIONAR função para carregar listas:
```javascript
async function loadFollowersList() {
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id(id, username, name, avatar_url)')
    .eq('following_id', user.id);
  
  setFollowersList(followers?.map(f => f.profiles) || []);
}

async function loadFollowingList() {
  const { data: following } = await supabase
    .from('follows')
    .select('following_id, profiles:following_id(id, username, name, avatar_url)')
    .eq('follower_id', user.id);
  
  setFollowingList(following?.map(f => f.profiles) || []);
}

function openFollowersList(type) {
  setListType(type);
  if (type === 'followers') {
    loadFollowersList();
  } else {
    loadFollowingList();
  }
  setShowFollowersList(true);
}
```

#### NO PERFIL, tornar os números clicáveis:
SUBSTITUIR:
```javascript
<div className="stat-item">
  <span className="stat-number">{followStats[user.id]?.followers || 0}</span>{' '}
  <span className="stat-label">seguidores</span>
</div>
```
POR:
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

#### ADICIONAR botão para copiar link do perfil:
No perfil, adicionar após o botão "Editar perfil":
```javascript
<button className="share-profile-btn" onClick={() => {
  navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
  alert('Link copiado! suaaave.vercel.app/' + profile.username);
}}>
  Compartilhar perfil
</button>
```

#### ADICIONAR Modal de seguidores/seguindo (antes do último </div>):
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
        {(listType === 'followers' ? followersList : followingList).map(person => (
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
        {(listType === 'followers' ? followersList : followingList).length === 0 && (
          <div className="empty-search">
            {listType === 'followers' ? 'Nenhum seguidor ainda' : 'Não está seguindo ninguém'}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

#### ENVOLVER todo o App com Routes:
SUBSTITUIR:
```javascript
export default function App() {
  // ... todo o código atual
  return (
    <div className="app">
      ...
    </div>
  );
}
```

POR:
```javascript
export default function AppWithRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/:username" element={<PublicProfile />} />
    </Routes>
  );
}

function App() {
  // ... todo o código atual permanece igual
  return (
    <div className="app">
      ...
    </div>
  );
}
```

E criar o PublicProfile component (código no arquivo separado)

### 5. App.css - ADICIONAR:
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
  margin-left: 10px;
}

.share-profile-btn:hover {
  background: #f0fdf4;
}
```

