import Dexie from 'dexie';

export const db = new Dexie('salesApp');

db.version(2).stores({
  // Using a simplified schema based on the prompt
  // We'll store products with their stock info together for simplicity
  products: '++id, name', // auto-incrementing id, index on name
  orders: '++id, createdAt, status', // auto-incrementing id, index on creation date and status
  paymentChannels: '++id, &name', // auto-incrementing id, unique index on name
});

// Pre-populate with default payment channels if the table is empty on version 1
db.version(1).stores({
    products: '++id, name',
    orders: '++id, createdAt',
    paymentChannels: '++id, &name',
}).upgrade(async (tx) => {
    // This upgrade function will only run if the DB existed with version 1
    // We are just adding tables and indexes, no data migration needed here for the old format.
    // However, we need to re-populate since 'populate' event only fires on creation.
    const channels = await tx.paymentChannels.toArray();
    if (channels.length === 0) {
        await tx.paymentChannels.bulkAdd([
            { name: '微信', isSystemChannel: false },
            { name: '支付宝', isSystemChannel: false },
            { name: '现金', isSystemChannel: false },
            { name: '赠送', isSystemChannel: true },
        ]);
    }
});


// The populate event is only fired when the database is first created.
// Since we are versioning, it's safer to handle default data in upgrades.
db.on('populate', async () => {
  await db.paymentChannels.bulkAdd([
    { name: '微信', isSystemChannel: false },
    { name: '支付宝', isSystemChannel: false },
    { name: '现金', isSystemChannel: false },
    { name: '赠送', isSystemChannel: true },
  ]);
});

export default db;
