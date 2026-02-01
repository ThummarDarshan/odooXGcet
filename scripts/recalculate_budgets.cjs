const budgetService = require('../backend/src/services/budgets.service');
const prisma = require('../backend/src/config/database');

async function run() {
    console.log('--- Starting Budget Recalculation ---');
    console.log('This will update "Actual" and "Reserved" amounts for ALL budgets based on existing Invoices and Bills.');

    try {
        console.log('Fetching all budgets...');
        await budgetService.recalculateAllBudgets();
        console.log('Successfully recalculated all budgets.');
    } catch (error) {
        console.error('Error recalculating budgets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
