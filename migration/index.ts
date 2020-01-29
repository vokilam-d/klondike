import { Database } from './mysql-db';
import { Migrate } from './migrate';

async function migrate() {
  const mysqlDb = new Database();
  const migrate = new Migrate(mysqlDb);

  // await migrate.retrieveModels();
  // await migrate.retrieveMysqlData();

  // await migrate.populateCategories();
  await migrate.populateProductAttributes();
  // await migrate.populateProducts();

  process.exit();
}

migrate();
