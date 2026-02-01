const prisma = require('../config/database');

class ProductService {
    async createProduct(data, userId) {
        // Generate SKU if not provided
        if (!data.sku) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await prisma.product.count({
                where: { sku: { startsWith: `PRD-${date}` } }
            });
            data.sku = `PRD-${date}-${(count + 1).toString().padStart(4, '0')}`;
        }

        const { sellPrice, purchasePrice, price, status, ...rest } = data;

        // Map status to is_active if provided, default to true
        // If status is 'archived', is_active = false. Else true.
        const isActive = status === 'archived' ? false : true;

        return await prisma.product.create({
            data: {
                ...rest,
                sell_price: sellPrice || price, // Fallback
                purchase_price: purchasePrice,
                is_active: isActive,
                created_by: userId
            }
        });
    }

    async getProducts(filters = {}) {
        const { category, search, status, page = 1, limit = 20 } = filters;
        const where = {};

        // Frontend sends 'draft', 'confirmed', 'archived'
        // Map to is_active
        if (status) {
            if (status === 'archived') where.is_active = false;
            else if (status === 'confirmed' || status === 'active') where.is_active = true;
            // 'draft' will also map to active effectively or we ignore it?
            // Let's treat 'draft' as 'active' for now or show nothing?
            // If the user filters by 'draft' (which doesn't exist), we return empty or Active?
            // Safer: If status is 'draft', we essentially show Active items that *might* be considered draft if we had the field.
            // But we don't. So let's just map 'confirmed' -> true, 'archived' -> false.
        }
        // Default behavior if status is missing? Usually all or active.
        // Existing logic was: if (status === 'active') ...

        if (category && category !== 'all') where.category = category;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        const mappedProducts = products.map(p => ({
            ...p,
            sellPrice: Number(p.sell_price),
            purchasePrice: p.purchase_price ? Number(p.purchase_price) : 0,
            price: Number(p.sell_price),
            status: p.is_active ? 'confirmed' : 'archived'
        }));

        return {
            data: mappedProducts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getProductById(id) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error('Product not found');
        return {
            ...product,
            sellPrice: Number(product.sell_price),
            purchasePrice: product.purchase_price ? Number(product.purchase_price) : 0,
            price: Number(product.sell_price),
            status: product.is_active ? 'confirmed' : 'archived'
        };
    }

    async updateProduct(id, data) {
        const { sellPrice, purchasePrice, price, status, ...rest } = data;

        // Only include fields that are defined
        const updateData = { ...rest };
        if (sellPrice !== undefined) updateData.sell_price = sellPrice;
        else if (price !== undefined) updateData.sell_price = price;

        if (purchasePrice !== undefined) updateData.purchase_price = purchasePrice;

        if (status) {
            updateData.is_active = status !== 'archived';
        }

        return await prisma.product.update({
            where: { id },
            data: updateData
        });
    }

    async deleteProduct(id) {
        // Soft delete -> Archive
        return await prisma.product.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
                is_active: false
            }
        });
    }

    async getCategories() {
        const categories = await prisma.product.findMany({
            select: { category: true },
            distinct: ['category'],
            where: { is_active: true }
        });
        return categories.map(c => c.category).filter(Boolean);
    }
}

module.exports = new ProductService();
