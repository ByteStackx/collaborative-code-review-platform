import express from 'express';
import dotenv from 'dotenv';
import { testDBConnection } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import { ensureUsersTable } from './services/userService';
import { ensureProjectTables } from './services/projectService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testDBConnection();
  await ensureUsersTable();
  await ensureProjectTables();
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();