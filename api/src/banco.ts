import "dotenv/config";
import mysql from "mysql2/promise";

// Isso aqui é o que vai permitir que a gente se conecte com o banco de dados MySQL.

export const banco = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "catalogomidias",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});
