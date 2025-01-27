import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket']
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('numberUpdate', (data) => {
      console.log('Número atualizado:', data);
      // Broadcast para todos os clientes, incluindo o emissor
      io.emit('numberUpdate', data);
    });

    socket.on('error', (error) => {
      console.error('Erro no socket:', error);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  const PORT = process.env.SOCKET_PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Servidor Socket.IO rodando na porta ${PORT}`);
  });
}); 