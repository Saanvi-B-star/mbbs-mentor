import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StudyMaterialService {
    async getAll(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [materials, total] = await Promise.all([
            prisma.studyMaterial.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.studyMaterial.count(),
        ]);

        return {
            data: materials,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        };
    }

    async getById(id: string) {
        return prisma.studyMaterial.findUnique({
            where: { id },
        });
    }
}
