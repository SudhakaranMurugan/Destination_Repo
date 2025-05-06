const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

const sessionClient = createClient({ database: 0 });// For session tokens
const logClient = createClient({ database: 1 }); // For login/logout counts

async function setup() {
  await sessionClient.connect();
  await logClient.connect();
  console.log('Connected to Redis');
}
async function loginUser(userId) {
  const sessionToken = uuidv4(); // unique token
  await sessionClient.setEx(`user:${userId}:session`, 60, sessionToken);//expired in 60 sec
  await logClient.hIncrBy(`user:${userId}:logs`, 'login', 1);//Increment login count
  console.log(`User ${userId} logged in`);
  console.log(`Session Token: ${sessionToken} (expires in 60s)`);
}
async function logoutUser(userId) {
  await logClient.hIncrBy(`user:${userId}:logs`, 'logout',1);//Increment logout count
  await sessionClient.del(`user:${userId}:session`);//Remove session token
  console.log(`User ${userId} logged out`);
}
async function getUserStatus(userId) {
  const session = await sessionClient.get(`user:${userId}:session`);
  const logs = await logClient.hGetAll(`user:${userId}:logs`);
  console.log(`\nStatus for User ID: ${userId}`);
  console.log(`Session Token: ${session || 'Expired'}`);
  console.log(`Login Count: ${logs.login || 0}`);
  console.log(`Logout Count: ${logs.logout || 0}`);
}
async function main() {
  await setup();
  const userId = '010';
  await loginUser(userId);
  await getUserStatus(userId);
  //wait before logout
  setTimeout(async () => {
    await logoutUser(userId);
    await getUserStatus(userId);
    await sessionClient.quit();
    await logClient.quit();
  }, 3000);
}
main();
