const prisma = require('../backend/src/config/database');
const budgetService = require('../backend/src/services/budgets.service');

async function syncBudgets() {
    console.log('Syncing budgets actuals/reserved to database...');
    await budgetService.recalculateAllBudgets();
    console.log('Done.');
}

syncBudgets()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
