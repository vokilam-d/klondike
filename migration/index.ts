import { Database } from './mysql-db';
import { Migrate } from './migrate';

async function migrate() {
  const mysqlDb = new Database();
  await mysqlDb.connect();
  const migrate = new Migrate(mysqlDb);

  // await migrate.retrieveModels();
  // migrate.setModels();
  // await migrate.retrieveMysqlData();

  // await migrate.populateCategories();
  await migrate.updateCounter('categories');
  // await migrate.populateProductAttributes();
  // await migrate.populateProducts();
  await migrate.updateCounter('products');
  // await migrate.populateCustomers();
  await migrate.updateCounter('customers');
  await migrate.populateOrders();
  await migrate.updateCounter('orders');

  console.log(`.\n.\n***     Finish migrating from Magento MySQL to MongoDB. It took: ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s.    ***\n.\n.\n.`);
  process.exit();
}

migrate();
