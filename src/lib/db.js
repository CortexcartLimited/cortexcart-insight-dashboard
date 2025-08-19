// src/lib/db.js

import { PrismaClient } from '@prisma/client';

// This block prevents multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// You can keep your mysql2 pool if other parts of the app use it for raw queries
import mysql from 'mysql2/promise';
export const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});