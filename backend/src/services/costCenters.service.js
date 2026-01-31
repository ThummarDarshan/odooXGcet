const prisma = require('../config/database');

class CostCenterService {
    async createCostCenter(data, userId) {
        const { name, code, description, status } = data;

        // Check if code exists
        const existing = await prisma.analyticalAccount.findUnique({
            where: { code }
        });
        if (existing) {
            throw new Error('Cost Center with this code already exists');
        }

        const costCenter = await prisma.analyticalAccount.create({
            data: {
                name,
                code,
                description,
                is_active: status === 'active',
                created_by: userId
            }
        });
        return costCenter;
    }

    async getCostCenters(filters = {}) {
        const { search, status, page = 1, limit = 20 } = filters;
        const where = {};

        if (status === 'active') where.is_active = true;
        else if (status === 'inactive') where.is_active = false;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [costCenters, total] = await Promise.all([
            prisma.analyticalAccount.findMany({
                where,
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.analyticalAccount.count({ where })
        ]);

        return {
            data: costCenters.map(c => ({
                ...c,
                status: c.is_active ? 'active' : 'inactive'
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getCostCenterById(id) {
        const costCenter = await prisma.analyticalAccount.findUnique({
            where: { id }
        });
        if (!costCenter) throw new Error('Cost Center not found');
        return {
            ...costCenter,
            status: costCenter.is_active ? 'active' : 'inactive'
        };
    }

    async updateCostCenter(id, data) {
        const { name, code, description, status } = data;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.is_active = status === 'active';

        const costCenter = await prisma.analyticalAccount.update({
            where: { id },
            data: updateData
        });
        return costCenter;
    }

    async deleteCostCenter(id) {
        // Soft delete
        return await prisma.analyticalAccount.update({
            where: { id },
            data: { is_active: false }
        });
    }
}

module.exports = new CostCenterService();
