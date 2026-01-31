require('dotenv').config();
const app = require('./app');
const prisma = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Check database connection
        await prisma.$connect();
        logger.info('Database connected successfully');

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
