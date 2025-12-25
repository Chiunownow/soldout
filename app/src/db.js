import Dexie from 'dexie';

export const db = new Dexie('salesApp');

db.version(1).stores({
  // Using a simplified schema based on the prompt
  // We'll store products with their stock info together for simplicity
  products: '++id, name', // auto-incrementing id, index on name
  orders: '++id, createdAt', // auto-incrementing id, index on creation date
  paymentChannels: '++id, &name', // auto-incrementing id, unique index on name
});

// Pre-populate with default payment channels if the table is empty
db.on('populate', async () => {
  await db.paymentChannels.bulkAdd([
    { name: '微信' },
    { name: '支付宝' },
    { name: '现金' },
    { name: '赠送', isSystemChannel: true },
  ]);
});

export default db;
