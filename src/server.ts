import express from 'express';
import dotenv from 'dotenv';
import { testDBConnection } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { ensureUsersTable } from './services/userService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testDBConnection();
  await ensureUsersTable();
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();