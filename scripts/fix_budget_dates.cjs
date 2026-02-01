const prisma = require('../backend/src/config/database');

async function fixBudgetDates() {
    console.log('Fixing budget start dates to include January data...');

    // Find budgets that start on Feb 1st
    const budgets = await prisma.budget.findMany({
        where: {
            start_date: { equals: new Date('2026-02-01') }
        }
    });

    console.log(`Found ${budgets.length} budgets starting on Feb 1st.`);

    for (const b of budgets) {
        console.log(`Updating budget "${b.name}" start date to Jan 1st 2026...`);
        await prisma.budget.update({
            where: { id: b.id },
            data: {
                start_date: new Date('2026-01-01')
            }
        });
    }
    console.log('Done.');
}

fixBudgetDates()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
