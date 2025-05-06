const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  console.error('Redis Error:', err);
});

async function main() {
  await client.connect();
  console.log('Connected to Redis');

  // 1️⃣ Caching example (with expiry)
  await client.set('cache:user:1', JSON.stringify({ name: 'Sudhan', age: 22 }), { EX: 60 });
  console.log('Cached user data with 60s expiry');

  // 2️⃣ Session token (with expiry)
  await client.set('session:token123', 'user:1', { EX: 3600 });
  console.log('Session token set with 1 hour expiry');

  // 3️⃣ Counter management
  await client.incr('counter:visits');
  const visitCount = await client.get('counter:visits');
  console.log('Visit count:', visitCount);

  // 4️⃣ CRUD Operations

  // Create/Update
  await client.set('user:1', JSON.stringify({ name: 'Sudhan', city: 'Chennai' }));
  console.log('Created/Updated user:1');

  // Read
  const userData = await client.get('user:1');
  console.log('Read user:1 ->', JSON.parse(userData));

  // Delete
  await client.del('user:1');
  console.log('Deleted user:1');

  await client.quit();
  console.log('Disconnected from Redis');
}

main();
