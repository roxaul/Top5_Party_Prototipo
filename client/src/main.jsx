import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import MesaPage from './pages/MesaPage';
import './index.css';

// Decide qual componente raiz renderizar baseado na URL.
// Feito aqui (fora do React) para não violar Rules of Hooks com early return
// dentro de App.jsx antes das chamadas de useState/useEffect.
const Root = window.location.pathname === '/mesa' ? MesaPage : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
