/**
 * API base URL configuration.
 *
 * En développement local, créer un fichier .env.local à la racine du projet frontend
 * avec la variable EXPO_PUBLIC_API_URL pointant vers votre machine :
 *   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
 *
 * En production, EXPO_PUBLIC_API_URL est injecté par Coolify lors du build.
 *
 * @module api
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const BACKUP_API_URL = 'http://localhost:8000';
