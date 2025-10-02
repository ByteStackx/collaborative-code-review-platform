import express from 'express';
import dotenv from 'dotenv';
import { testDBConnection } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await testDBConnection();
    app.use(express.json());

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
};
startServer();