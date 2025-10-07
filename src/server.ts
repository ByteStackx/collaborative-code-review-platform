import express from 'express';
import dotenv from 'dotenv';
import { testDBConnection } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import submissionRoutes from './routes/submissionRoutes';
import { ensureUsersTable } from './services/userService';
import { ensureProjectTables } from './services/projectService';
import { ensureSubmissionsTable } from './services/submissionService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testDBConnection();
  await ensureUsersTable();
  await ensureProjectTables();
  await ensureSubmissionsTable();
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/submissions', submissionRoutes);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();