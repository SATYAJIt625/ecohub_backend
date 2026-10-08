/**
 * Database Seed Script
 * Populates EcoHub with sample data for development/testing
 * Run: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecohub';

// ─── Sample Users ─────────────────────────────────────────────────────────────
const users = [
  { name: 'Alex Rivera', email: 'admin@ecohub.dev', password: 'password123', role: 'admin' },
  { name: 'Sam Chen', email: 'treasurer@ecohub.dev', password: 'password123', role: 'treasurer' },
  { name: 'Jordan Lee', email: 'member1@ecohub.dev', password: 'password123', role: 'member' },
  { name: 'Taylor Kim', email: 'member2@ecohub.dev', password: 'password123', role: 'member' },
  { name: 'Morgan Patel', email: 'member3@ecohub.dev', password: 'password123', role: 'member' },
];

// ─── Generate Transactions for last 6 months ──────────────────────────────────
const generateTransactions = (adminId) => {
  const transactions = [];
  const now = new Date();

  const incomeItems = [
    { title: 'Annual Membership Fees', category: 'membership', min: 2000, max: 5000 },
    { title: 'Government Grant', category: 'grants', min: 5000, max: 15000 },
    { title: 'Corporate Sponsorship', category: 'sponsorship', min: 3000, max: 8000 },
    { title: 'Fundraising Event', category: 'events', min: 1000, max: 4000 },
    { title: 'Donation Drive', category: 'donations', min: 500, max: 3000 },
  ];

  const expenseItems = [
    { title: 'Monthly Office Rent', category: 'maintenance', min: 800, max: 1200 },
    { title: 'Team Lunch', category: 'food', min: 150, max: 400 },
    { title: 'Annual Conference', category: 'events', min: 2000, max: 5000 },
    { title: 'Equipment Purchase', category: 'equipment', min: 500, max: 2000 },
    { title: 'Travel Reimbursements', category: 'travel', min: 200, max: 800 },
    { title: 'Utility Bills', category: 'utilities', min: 100, max: 300 },
    { title: 'Marketing Materials', category: 'marketing', min: 300, max: 1000 },
    { title: 'Staff Stipends', category: 'salaries', min: 1500, max: 3000 },
  ];

  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Add 2–3 income transactions per month
    const incomeCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < incomeCount; i++) {
      const item = incomeItems[Math.floor(Math.random() * incomeItems.length)];
      const amount = Math.floor(Math.random() * (item.max - item.min) + item.min);
      const day = Math.floor(Math.random() * 28) + 1;
      transactions.push({
        title: item.title,
        amount,
        type: 'income',
        category: item.category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
        createdBy: adminId,
        description: `${item.title} for ${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      });
    }

    // Add 4–6 expense transactions per month
    const expenseCount = Math.floor(Math.random() * 3) + 4;
    for (let i = 0; i < expenseCount; i++) {
      const item = expenseItems[Math.floor(Math.random() * expenseItems.length)];
      const amount = Math.floor(Math.random() * (item.max - item.min) + item.min);
      const day = Math.floor(Math.random() * 28) + 1;
      transactions.push({
        title: item.title,
        amount,
        type: 'expense',
        category: item.category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
        createdBy: adminId,
        description: `${item.title} - ${monthDate.toLocaleString('default', { month: 'long' })}`,
      });
    }
  }

  return transactions;
};

// ─── Sample Budgets for current month ────────────────────────────────────────
const generateBudgets = (adminId) => {
  const now = new Date();
  return [
    { name: 'Events Budget', category: 'events', plannedAmount: 5000, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Food & Catering', category: 'food', plannedAmount: 1500, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Equipment', category: 'equipment', plannedAmount: 3000, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Travel', category: 'travel', plannedAmount: 2000, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Marketing', category: 'marketing', plannedAmount: 1000, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Utilities', category: 'utilities', plannedAmount: 500, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Staff Stipends', category: 'salaries', plannedAmount: 8000, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
    { name: 'Office Maintenance', category: 'maintenance', plannedAmount: 2000, month: now.getMonth() + 1, year: now.getFullYear(), createdBy: adminId },
  ];
};

// ─── Main Seed Function ───────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    const admin = createdUsers[0];
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create transactions
    const transactions = generateTransactions(admin._id);
    await Transaction.create(transactions);
    console.log(`💰 Created ${transactions.length} transactions`);

    // Create budgets
    const budgets = generateBudgets(admin._id);
    await Budget.create(budgets);
    console.log(`📊 Created ${budgets.length} budgets`);

    console.log('\n🌱 Seed complete! Login credentials:');
    console.log('  Admin:     admin@ecohub.dev / password123');
    console.log('  Treasurer: treasurer@ecohub.dev / password123');
    console.log('  Member:    member1@ecohub.dev / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
