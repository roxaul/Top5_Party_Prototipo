import { io } from 'socket.io-client';

// Em produção, conecta ao mesmo host que serviu o app.
// Em desenvolvimento (vite proxy), também funciona automaticamente.
const socket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export default socket;
