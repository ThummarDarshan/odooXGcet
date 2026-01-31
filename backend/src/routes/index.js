const express = require('express');
const authRoutes = require('./auth.routes');
const contactRoutes = require('./contacts.routes');
const productRoutes = require('./products.routes');
const customerInvoiceRoutes = require('./customerInvoices.routes');
const paymentRoutes = require('./payments.routes');
const costCenterRoutes = require('./costCenters.routes');
const budgetRoutes = require('./budgets.routes');
const purchaseOrderRoutes = require('./purchaseOrders.routes');
const vendorBillRoutes = require('./vendorBills.routes');

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Other routes
router.use('/contacts', contactRoutes);
router.use('/products', productRoutes);
router.use('/customer-invoices', customerInvoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/cost-centers', costCenterRoutes);
router.use('/budgets', budgetRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/vendor-bills', vendorBillRoutes);
router.use('/sales-orders', require('./salesOrders.routes'));
router.use('/analytical', require('./analytical.routes'));
router.use('/dashboard', require('./dashboard.routes'));


module.exports = router;
