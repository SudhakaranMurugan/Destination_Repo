const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const sessionClient = createClient({ database: 0 });
const logClient = createClient({ database: 1 });

async function setup(){
  await sessionClient.connect();
  await logClient.connect();
  console.log('Connected to Redis\n');
}
async function loginUser(userId){
  const sessionToken = uuidv4();
  await sessionClient.setEx(`user:${userId}:session`, 60, sessionToken);
  await logClient.hIncrBy(`user:${userId}:logs`, 'login', 1);
  console.log(`User ${userId} logged in`);
  console.log(`Session Token: ${sessionToken} (expires in 60s)\n`);
}
async function logoutUser(userId){
  await logClient.hIncrBy(`user:${userId}:logs`, 'logout', 1);
  await sessionClient.del(`user:${userId}:session`);
  console.log(`User ${userId} logged out\n`);
}
async function getUserStatus(userId){
  const session = await sessionClient.get(`user:${userId}:session`);
  const logs = await logClient.hGetAll(`user:${userId}:logs`);

  console.log(`Status for User ID: ${userId}`);
  console.log(`Session Token: ${session || 'Expired/Not Found'}`);
  console.log(`Login Count: ${logs.login || 0}`);
  console.log(`Logout Count: ${logs.logout || 0}\n`);
}
async function menu() {
  rl.question(
    `\nChoose an option:1.Login\n2.Logout\n3.Status\n4.Exit\nEnter choice (1-4): `, async (choice) =>{
      if (choice === '4') {
        await sessionClient.quit();
        await logClient.quit();
        rl.close();
        return;
      }
      rl.question('Enter User ID: ', async (userId) =>{
        switch (choice) {
          case '1':
            await loginUser(userId);
            break;
          case '2':
            await logoutUser(userId);
            break;
          case '3':
            await getUserStatus(userId);
            break;
          default:
            console.log('Invalid option\n');
        }
        menu(); 
      });
    });
}
async function main(){
  await setup();
  menu();
}
main();
