import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: parseInt(process.env.DB_PORT ?? '5432'),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const testDBConnection = async () => {
	try {
		const client = await pool.connect();
		console.log('Database connected successfully');
		client.release();
	} catch (err) {
		console.error('Database connection error', err);
		process.exit(1);
	}
};