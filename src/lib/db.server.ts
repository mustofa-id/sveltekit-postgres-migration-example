import { DB_URI } from '$env/static/private';
import postgres from 'postgres';

export const sql = postgres(DB_URI);
