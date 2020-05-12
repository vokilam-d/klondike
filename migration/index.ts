import { Database } from './mysql-db';
import { Migrate } from './migrate';
import { attach } from 'retry-axios';

async function migrate() {
  attach();
  const mysqlDb = new Database();
  await mysqlDb.connect();
  const migrate = new Migrate(mysqlDb);

  // await migrate.retrieveModels();
  migrate.setModels();
  // await migrate.retrieveMysqlData();

  // await migrate.populateCategories();
  // await migrate.updateCounter('categories');
  // await migrate.populateProductAttributes();
  // await migrate.populateProducts();
  // await migrate.populateProductCategories();
  // await migrate.updateCounter('products');
  // await migrate.populateCustomers();
  // await migrate.updateCounter('customers');
  // await migrate.populateOrders();
  // await migrate.updateCounter('orders');
  // await migrate.populateStoreReviews();
  // await migrate.updateCounter('store-reviews');
  // await migrate.populateProductReviews();
  // await migrate.updateCounter('product-reviews');
  // await migrate.populateBlogCategories();
  // await migrate.populateBlogPosts();
  // await migrate.updateCounter('blog');

  console.log(`.\n.\n***     Finish migrating from Magento MySQL to MongoDB. It took: ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s.    ***\n.\n.\n.`);

  Object.keys(migrate.failedReqs).forEach(entity => {
    const failedArr = migrate.failedReqs[entity];
    if (!failedArr.length) { return; }

    console.log(`Failed '${entity}' ids: ${failedArr.join(', ')}`);
  });

  process.exit();
}

migrate();
