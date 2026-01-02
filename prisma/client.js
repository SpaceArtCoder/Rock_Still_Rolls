import { PrismaClient } from '@prisma/client';

/**
 * Создание и экспорт единственного экземпляра PrismaClient.
 * 
 * PrismaClient управляет подключением к базе данных и предоставляет
 * типизированные методы для выполнения операций с данными.
 * 
 * @constant {PrismaClient} prisma - Глобальный экземпляр PrismaClient
 */
const prisma = new PrismaClient();

export default prisma;
