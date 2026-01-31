const prisma = require('../config/database');

class AnalyticalService {
    /**
     * Create a new auto analytical rule
     */
    async createRule(data) {
        const createData = {};
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) createData[key] = value;
        });

        if (data.enabled !== undefined) {
            createData.is_active = data.enabled;
            delete createData.enabled;
        }
        return await prisma.autoAnalyticalRule.create({
            data: createData
        });
    }

    /**
     * Get a single rule by ID
     */
    async getRule(id) {
        const r = await prisma.autoAnalyticalRule.findUnique({
            where: { id },
            include: {
                analytical_account: true,
                product: true,
                contact: true,
                contact_tag: true
            }
        });

        if (!r) return null;

        let ruleType = 'other';
        if (r.product_id) ruleType = 'product';
        else if (r.product_category) ruleType = 'category';
        else if (r.contact_id) ruleType = 'contact';
        else if (r.contact_tag_id) ruleType = 'tag';

        return {
            ...r,
            ruleType,
            productName: r.product?.name,
            category: r.product_category,
            contactName: r.contact?.name,
            tagName: r.contact_tag?.name,
            costCenterName: r.analytical_account?.name,
            enabled: r.is_active,
            costCenterId: r.analytical_account_id
        };
    }

    /**
     * Get all rules
     */
    async getRules() {
        const rules = await prisma.autoAnalyticalRule.findMany({
            include: {
                analytical_account: true,
                product: true,
                contact: true,
                contact_tag: true
            },
            orderBy: { priority: 'desc' }
        });

        return rules.map(r => {
            let ruleType = 'other';
            if (r.product_id) ruleType = 'product';
            else if (r.product_category) ruleType = 'category';
            else if (r.contact_id) ruleType = 'contact';
            else if (r.contact_tag_id) ruleType = 'tag';

            return {
                ...r,
                ruleType,
                productName: r.product?.name,
                category: r.product_category,
                contactName: r.contact?.name,
                tagName: r.contact_tag?.name,
                costCenterName: r.analytical_account?.name,
                enabled: r.is_active,
                costCenterId: r.analytical_account_id
            };
        });
    }

    /**
     * Update a rule
     */
    async updateRule(id, data) {
        const updateData = {};
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) updateData[key] = value;
        });

        if (data.enabled !== undefined) {
            updateData.is_active = data.enabled;
            delete updateData.enabled;
        }

        return await prisma.autoAnalyticalRule.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * Delete a rule
     */
    async deleteRule(id) {
        return await prisma.autoAnalyticalRule.delete({
            where: { id }
        });
    }

    /**
     * Determine the correct Cost Center (Analytical Account) based on context.
     * Context: { productId, productCategory, contactId }
     */
    async getApplicableCostCenter(context) {
        const { productId, productCategory, contactId } = context;

        let contactTagId = null;
        if (contactId) {
            const contact = await prisma.contact.findUnique({ where: { id: contactId } });
            contactTagId = contact?.tag_id;
        }

        const rules = await prisma.autoAnalyticalRule.findMany({
            where: {
                is_active: true,
                OR: [
                    { product_id: productId },
                    { product_id: null }
                ]
            },
            include: { analytical_account: true }
        });

        let bestRule = null;
        let maxScore = -1;

        for (const rule of rules) {
            let score = 0;
            let possible = true;

            if (rule.product_id) {
                if (rule.product_id === productId) score += 10;
                else possible = false;
            }

            if (possible && rule.product_category) {
                if (rule.product_category === productCategory) score += 5;
                else possible = false;
            }

            if (possible && rule.contact_id) {
                if (rule.contact_id === contactId) score += 10;
                else possible = false;
            }

            if (possible && rule.contact_tag_id) {
                if (rule.contact_tag_id === contactTagId) score += 5;
                else possible = false;
            }

            score += (rule.priority || 0);

            if (possible && score > maxScore) {
                maxScore = score;
                bestRule = rule;
            }
        }

        return bestRule ? bestRule.analytical_account : null;
    }
}

module.exports = new AnalyticalService();
