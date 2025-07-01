const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Place your service account key here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixOrders() {
  const ordersRef = db.collection('orders');
  const snapshot = await ordersRef.get();
  let fixedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    if (typeof data.status !== 'string') {
      updates.status = 'pending';
    }
    if (typeof data.totalAmount !== 'number') {
      updates.totalAmount = 0;
    }
    if (!data.orderDate) {
      updates.orderDate = admin.firestore.Timestamp.now();
    }
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Fixed order ${doc.id}:`, updates);
      fixedCount++;
    }
  }
  console.log(`Done. Fixed ${fixedCount} orders.`);
}

fixOrders().catch(console.error); 