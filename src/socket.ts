import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // We can restrict this in production
      methods: ['GET', 'POST']
    }
  });

  io.engine.on('connection_error', (err) => {
    console.error('Socket error:', err);
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);
    console.log(`User: ${socket.data.user.id}`);

    const { id: userId, company_id: companyId } = socket.data.user;

    socket.join(`user:${userId}`);
    if (companyId) {
      socket.join(`company:${companyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const isSocketReady = () => {
  return !!io;
};
