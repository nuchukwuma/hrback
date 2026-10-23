// server.js
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import Channel from './src/models/chat/Channel.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import shiftRoutes from './src/routes/shiftRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import goalRoutes from './src/routes/goalRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';
import requestRoutes from './src/routes/requestRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import businessPartnerRoutes from './src/routes/businessPartnerRoutes.js';
import employeeRoutes from './src/routes/employeeRoutes.js';
import { setupSocket } from './src/socket.js';
import { clientOrigins } from './src/utils/clientOrigins.js';

const app = express();

app.use(express.json({ limit: '3mb' }));   // lets us read req.body (raised so a profile photo fits)
app.use(cookieParser());   // lets us read req.cookies (the login cookie)

app.use(cors({ origin: clientOrigins, credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/channels', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/business-partners', businessPartnerRoutes);
app.use('/api/employees', employeeRoutes);

// There must always be one company channel. Create it the first time the server runs.
const ensureCompanyChannel = async () => {
  if (!(await Channel.exists({ type: 'company' }))) {
    await Channel.create({ name: 'Company', type: 'company' });
    console.log('Company channel created');
  }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await ensureCompanyChannel();
  })
  .catch((err) => console.log("MongoDB error:", err.message));

// Socket.io needs a plain http server, so we wrap Express in one.
// (This is why we use httpServer.listen below, not app.listen.)
const httpServer = http.createServer(app);
const io = setupSocket(httpServer);
app.set('io', io); // lets controllers reach the socket server with req.app.get('io')

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
