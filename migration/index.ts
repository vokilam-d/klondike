import { Database } from './mysql-db';
import { Migrate } from './migrate';

async function migrate() {
  const mysqlDb = new Database();
  const migrate = new Migrate(mysqlDb);

  // await migrate.retrieveModels();
  // await migrate.retrieveMysqlData();

  // await migrate.populateCategories();
  // await migrate.populateProductAttributes();
  // await migrate.populateProducts();
  await migrate.populateCustomers();

  console.log(`.\n.\n***     Finish migrating from Magento MySQL to MongoDB. It took: ${Math.floor(process.uptime())}s.    ***\n.\n.\n.`);
  process.exit();
}

migrate();
