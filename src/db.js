import Dexie from 'dexie';

export const db = new Dexie('salesApp');

db.version(3).stores({
  products: '++id, name',
  orders: '++id, createdAt, status',
  paymentChannels: '++id, &name',
  cart: 'cartItemId', 
}).upgrade(async (tx) => {
  // This upgrade function will run for users upgrading from ANY previous version to version 3
  const channels = await tx.table('paymentChannels').toArray();
  if (channels.length === 0) {
      await tx.table('paymentChannels').bulkAdd([
          { name: '微信', isSystemChannel: false },
          { name: '支付宝', isSystemChannel: false },
          { name: '现金', isSystemChannel: false },
          { name: '赠送', isSystemChannel: true },
      ]);
  }
});

// This is the initial schema, for users who had version 1
db.version(2).stores({
    products: '++id, name',
    orders: '++id, createdAt, status',
    paymentChannels: '++id, &name',
});

// This is the very first schema
db.version(1).stores({
    products: '++id, name',
    orders: '++id, createdAt',
    paymentChannels: '++id, &name',
});


// The populate event is only fired when the database is first created.
db.on('populate', async () => {
  await db.paymentChannels.bulkAdd([
    { name: '微信', isSystemChannel: false },
    { name: '支付宝', isSystemChannel: false },
    { name: '现金', isSystemChannel: false },
    { name: '赠送', isSystemChannel: true },
  ]);
});

export default db;

