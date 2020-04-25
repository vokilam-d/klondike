import * as path from 'path';
import * as fs from 'fs';
import { Database } from './mysql-db';
import { AdminResponseCategoryDto } from '../src/shared/dtos/admin/category.dto';
import axios from 'axios';
import * as FormData from 'form-data';
import { AdminProductDto } from '../src/shared/dtos/admin/product.dto';
import { AdminAttributeDto, AdminAttributeValueDto } from '../src/shared/dtos/admin/attribute.dto';
import { AdminProductVariantDto } from '../src/shared/dtos/admin/product-variant.dto';
import { AdminProductSelectedAttributeDto } from '../src/shared/dtos/admin/product-selected-attribute.dto';
import { AdminMediaDto } from '../src/shared/dtos/admin/media.dto';
import { AdminCustomerDto } from '../src/shared/dtos/admin/customer.dto';
import { AdminAddOrUpdateOrderDto } from '../src/shared/dtos/admin/order.dto';
import { OrderItemDto } from '../src/shared/dtos/shared-dtos/order-item.dto';
import { AdminCreateOrderItemDto } from '../src/shared/dtos/admin/create-order-item.dto';
import { AdminStoreReviewDto } from '../src/shared/dtos/admin/store-review.dto';
import { AdminProductReviewDto } from '../src/shared/dtos/admin/product-review.dto';
import { CurrencyCodeEnum } from '../src/shared/enums/currency.enum';
import { stripHtmlTags } from '../src/shared/helpers/strip-html-tags.function';
import { MetaTagsDto } from '../src/shared/dtos/shared-dtos/meta-tags.dto';
import { ShippingAddressDto } from '../src/shared/dtos/shared-dtos/shipping-address.dto';
import { AdminProductCategoryDto } from '../src/shared/dtos/admin/product-category.dto';

export class Migrate {
  private apiHostname = 'http://localhost:3500';
  /**
   * Hold name of the models to be generated
   *
   * @private
   * @type {(string | any[])}
   * @memberof Migrate
   */
  private models: string | any[];

  failedReqs = {
    categories: [],
    attributes: [],
    products: [],
    customers: [],
    orders: [],
    storeReviews: [],
    productReviews: []
  };

  /**
   * Directory where data is saved in json format. File names correspond to MySQL table names
   *
   * @private
   * @type {string}
   * @memberof Migrate
   */
  private datafilesdir: string;

  /**
   * Store collection model names and their corresonding data files
   *
   * @private
   * @type {Map<string, string>}
   * @memberof Migrate
   */
  private modelschemas: Map<string, string>;

  private mysqldb: Database;

  constructor(mysqlconn: Database) {
    console.log('.\n.\n.\n***     Start migration     ***\n.\n.\n.');

    this.datafilesdir = path.join(__dirname, `/json-data-files/`);
    this.modelschemas = new Map();
    this.mysqldb = mysqlconn;
  }

  /**
   * Get table names from the selected / provided this.mysqldb.
   *
   * Will populate `this.models` property.
   *
   * @memberof Migrate
   */
  public async retrieveModels(): Promise<void> {
    const modelInfo = await this.mysqldb.query(`show full tables where Table_Type = 'BASE TABLE'`);
    this.models = modelInfo
      .map((res: { [x: string]: any }) => {
        return res[Object.keys(res)[0]];
      })
      .filter((name: string) => name !== 'amasty_xsearch_users_search' && !name.startsWith('mst_cache_warmer'));
  }

  public setModels() {
    this.models = [
      'amasty_order_attribute_entity',
      'amasty_order_attribute_entity_int',
      'amasty_order_attribute_grid_flat',
      'catalog_category_flat_store_1',
      'catalog_product_flat_1',
      'cataloginventory_stock_item',
      'catalog_category_product',
      'catalog_product_entity_varchar',
      'catalog_product_entity_text',
      'catalog_product_entity_int',
      'catalog_product_entity_decimal',
      'catalog_product_entity_tier_price',
      'catalog_product_entity_datetime',
      'catalog_product_entity_gallery',
      'catalog_product_entity_media_gallery_value_to_entity',
      'catalog_product_entity_media_gallery_value',
      'catalog_product_entity_media_gallery',
      'customer_entity',
      'customer_entity_varchar',
      'customer_address_entity',
      'eav_attribute',
      'eav_attribute_option',
      'eav_attribute_option_value',
      'review',
      'review_detail',
      'sales_order',
      'sales_order_address',
      'sales_order_payment',
      'sales_shipment_track',
      'sales_order_item',
      'intenso_review_storeowner_comment'
    ]
  }

  /**
   * Retrieve data for each model from MySQL, and generate corresponding data file in json.
   *
   * @memberOf Migrate
   */
  public async retrieveMysqlData(): Promise<void> {
    if (this.models === undefined) {
      throw new Error(`Call retrieveModels to get MySQL models!`);
    }
    try {
      const files = fs.readdirSync(this.datafilesdir);
      if (files.length) {
        for await (const file of files) {
          fs.unlinkSync(this.datafilesdir + file);
        }
      }
    } catch {
      fs.mkdirSync(this.datafilesdir);
    }

    for await (const model of this.models) {
      console.log('start retrieve mysql data: ', model);

      const modelData = await this.mysqldb.query(`select * from ${model}`);
      fs.writeFileSync(`${this.datafilesdir + model}.json`, JSON.stringify(modelData));
    }
    console.log(`Found ${this.models.length} models and ` + 'wrote into json files in ' + Math.floor(process.uptime()) + 's');
  }

  async populateCategories() {
    console.log('.\n.\n***     Start migrating CATEGORIES     ***\n***\n***');
    const file = fs.readFileSync(this.datafilesdir + 'catalog_category_flat_store_1.json', 'utf-8');
    const categories: any[] = Array.from(JSON.parse(file));

    let count: number = 0;

    for (const category of categories) {
      if (category.parent_id < 2) { continue; }

      const dto = {} as AdminResponseCategoryDto;
      dto.id = category.entity_id;
      dto.parentId = category.parent_id === 2 ? 0 : category.parent_id;
      dto.isEnabled = category.is_active === 1;
      dto.name = category.name;
      dto.description = category.description;
      dto.metaTags = {} as MetaTagsDto;
      dto.metaTags.title = category.meta_title;
      dto.metaTags.description = category.meta_description;
      dto.metaTags.keywords = category.meta_keywords;
      dto.slug = category.url_key ? `${category.url_key}.html` : '';

      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/categories`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
          }
        );
        console.log(`[Categories]: Migrated id`, dto.id, `- '${dto.name}'`);
        count++;
      } catch (ex) {
        this.failedReqs.categories.push(dto.id);
        console.error(`[Categories ERROR]: '${dto.id}' '${dto.name}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }

    console.log(`.\n.\n***     Finish migrating CATEGORIES     ***\nCount: ${count} \n.\n.`);
  }

  async populateProductAttributes() {
    console.log('.\n.\n***     Start migrating PRODUCT ATTRIBUTES     ***\n***\n***');
    const attrsFile = fs.readFileSync(this.datafilesdir + 'eav_attribute.json', 'utf-8');
    const attributes: any[] = Array.from(JSON.parse(attrsFile));
    const optionsFile = fs.readFileSync(this.datafilesdir + 'eav_attribute_option.json', 'utf-8');
    const options: any[] = Array.from(JSON.parse(optionsFile));
    const optionValuesFile = fs.readFileSync(this.datafilesdir + 'eav_attribute_option_value.json', 'utf-8');
    const optionValues: any[] = Array.from(JSON.parse(optionValuesFile));
    const attrDecimals: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_entity_decimal.json', 'utf-8')));

    let count: number = 0;

    for (const attr of attributes) {
      if (attr.entity_type_id !== 4) { continue; }
      if (attr.attribute_code === 'is_general_discount_applicable') { continue; }

      const dto = {} as AdminAttributeDto;
      dto.id = attr.attribute_code;
      dto.label = attr.frontend_label;
      dto.groupName = '';
      dto.values = [];

      const attrOptions = options.filter(option => option.attribute_id === attr.attribute_id);
      for (const option of attrOptions) {
        const attrOptionValues = optionValues.filter(optionValue => optionValue.option_id === option.option_id);
        const valueDto = {} as AdminAttributeValueDto;
        for (const optionValue of attrOptionValues) {
          if (optionValue.store_id === 0) {
            valueDto.id = optionValue.value
          }
          if (optionValue.store_id === 1) {
            valueDto.label = optionValue.value
          }
        }
        if (!valueDto.label) {
          valueDto.label = valueDto.id;
        }
        dto.values.push(valueDto);
      }

      if (!dto.values.length) { continue; }

      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/attributes`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
          }
        );
        console.log(`[ProductAttributes]: Migrated id`, dto.id, `- '${dto.label}'`);
        count++;
      } catch (ex) {
        this.failedReqs.attributes.push(dto.id);
        console.error(`[ProductAttributes ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }

    console.log(`.\n.\n***     Finish migrating PRODUCT ATTRIBUTES     ***\nCount: ${count} \n.\n.`);
  }

  async populateProducts() {
    console.log('.\n.\n***     Start migrating PRODUCTS     ***\n.\n.');
    const products: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_flat_1.json', 'utf-8')));
    const productLinks: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_link.json', 'utf-8')));
    const inventories: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'cataloginventory_stock_item.json', 'utf-8')));
    const categoryProducts: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_category_product.json', 'utf-8')));
    const catalog_product_entity_varchars: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_entity_varchar.json', 'utf-8')));
    const mediaValueToEntities: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_entity_media_gallery_value_to_entity.json', 'utf-8')));
    const mediaValues: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_entity_media_gallery_value.json', 'utf-8')));
    const mediaGalleries: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_entity_media_gallery.json', 'utf-8')));
    const euro_price_attrs: any[] = Array.from<any>(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_entity_decimal.json', 'utf-8'))).filter(attr => attr.attribute_id === 233);

    let count: number = 0;

    const attrsResponse = await axios.get(`${this.apiHostname}/api/v1/admin/attributes`);
    const savedAttributes: AdminAttributeDto[] = attrsResponse.data.data;


    // for (const product of products) {
    const addProduct = async (product) => {
      // if (product.entity_id >= 400 && product.entity_id <= 457 ) { return; }
      if (product.parent_id < 2) { return; }

      const dto = {} as AdminProductDto;
      dto.id = product.entity_id;
      dto.createdAt = new Date(product.created_at);
      dto.updatedAt = new Date(product.updated_at);
      dto.isEnabled = true;
      dto.name = product.name || '';

      dto.categories = [];
      const categoryProductsForProduct = categoryProducts.filter(cp => cp.product_id === product.entity_id);
      for (const categoryProduct of categoryProductsForProduct) {
        dto.categories.push({ id: categoryProduct.category_id, sortOrder: categoryProduct.position } as AdminProductCategoryDto);
      }

      dto.attributes = [];
      Object.keys(product).forEach(key => {
        if (key === 'is_general_discount_applicable') { return; }

        if (product[key] !== null) {
          const savedAttribute = savedAttributes.find(attr => attr.id === key);
          if (savedAttribute) {
            const savedValue = savedAttribute.values.find(v => v.label === product[`${key}_value`]);
            if (savedValue) {
              const selectedAttr = {} as AdminProductSelectedAttributeDto;
              selectedAttr.attributeId = savedAttribute.id;
              selectedAttr.valueId = savedValue.id;
              dto.attributes.push(selectedAttr);
            }
          }
        }
      });


      dto.variants = [];
      const variantDto = {} as AdminProductVariantDto;
      variantDto.name = product.name || '';
      variantDto.sku = product.sku || '';
      variantDto.slug = product.url_key ? `${product.url_key}.html` : '';
      variantDto.attributes = [];
      variantDto.isEnabled = true;

      variantDto.priceInDefaultCurrency = product.price || 0;
      const euro_price_attr = euro_price_attrs.find(attr => attr.entity_id === product.entity_id);
      if (euro_price_attr) {
        variantDto.currency = CurrencyCodeEnum.EUR;
        variantDto.price = euro_price_attr.value || 0;
      } else {
        variantDto.currency = CurrencyCodeEnum.UAH;
        variantDto.price = variantDto.priceInDefaultCurrency;
      }

      variantDto.salesCount = 0;

      const tmpMedias: {alt: string; disabled: number; position: number; url: string;}[] = [];
      for (const mediaValue of mediaValues) {
        if (mediaValue.entity_id === product.entity_id) {
          const foundGallery = mediaGalleries.find(mediaGallery => mediaGallery.value_id === mediaValue.value_id);
          if (foundGallery) {
            const tmpMedia = {} as any;
            tmpMedia.alt = mediaValue.label;
            tmpMedia.disabled = mediaValue;
            tmpMedia.position = mediaValue.position;
            tmpMedia.url = foundGallery.value;
            tmpMedias.push(tmpMedia);
          }
        }
      }
      tmpMedias.sort((a, b) => a.position - b.position);

      variantDto.medias = [];
      for (let tmpMedia of tmpMedias) {
        try {
          const imgResponse = await axios.get(`https://klondike.com.ua/media/catalog/product${tmpMedia.url}`, { responseType: 'arraybuffer' });
          const form = new FormData();
          form.append('file', imgResponse.data, { filename: path.parse(tmpMedia.url).base });

          const { data: media } = await axios.post<AdminMediaDto>(`${this.apiHostname}/api/v1/admin/products/media`, form, { headers: form.getHeaders() });
          media.altText = tmpMedia.alt || '';
          media.isHidden = tmpMedia.disabled === 0;

          variantDto.medias.push(media);

        } catch (ex) {
          console.error(`[Products Media]: '${tmpMedia.url}' for product '${product.name}' id '${dto.id}' error: `, ex.response ? ex.response.status : ex);
          console.error(this.buildErrorMessage(ex.response && ex.response.data));
        }
      }

      variantDto.fullDescription = product.description && product.description.replace(new RegExp(/(\<span\>\<\/span\>)|(\<span\> \<\/span\>)/, 'g'), '') || '';
      variantDto.shortDescription = stripHtmlTags(product.short_description || '');

      const regex = new RegExp(/{{media url=&quot;(.+?)&quot;}}/, 'g');
      do {
        const exec = regex.exec(variantDto.fullDescription);
        if (!exec) { continue; }

        const str = exec[0];
        const urlPart = exec[1];

        try {
          const imgResponse = await axios.get(`https://klondike.com.ua/media/${urlPart}`, { responseType: 'arraybuffer' });
          const form = new FormData();
          form.append('file', imgResponse.data, { filename: path.parse(urlPart).base });

          const { data: newUrl } = await axios.post<AdminMediaDto>(`${this.apiHostname}/api/v1/admin/wysiwyg/media`, form, { headers: form.getHeaders() });

          variantDto.fullDescription = variantDto.fullDescription.slice(0, exec.index)
            + newUrl
            + variantDto.fullDescription.slice(exec.index + str.length);

        } catch (ex) {
          console.dir({ urlPart, str });
          console.error(`[WYSIWYG Media]: '${urlPart}' for product '${product.name}' id '${dto.id}' error: `, ex.response ? ex.response.status : ex);
          console.error(this.buildErrorMessage(ex.response && ex.response.data));
        }
      } while (regex.lastIndex !== 0);

      variantDto.metaTags = {} as MetaTagsDto;
      catalog_product_entity_varchars.forEach(varchar => {
        if (varchar.entity_id === product.entity_id) {
          if (varchar.attribute_id === 84) {
            variantDto.metaTags.title = varchar.value;
          }
          if (varchar.attribute_id === 85) {
            variantDto.metaTags.keywords = varchar.value;
          }
          if (varchar.attribute_id === 86) {
            variantDto.metaTags.description = varchar.value;
          }
          if (varchar.attribute_id === 229) {
            variantDto.gtin = varchar.value;
          }
          if (varchar.attribute_id === 222) {
            variantDto.vendorCode = varchar.value;
          }
          if (varchar.attribute_id === 236) {
            variantDto.googleAdsProductTitle = varchar.value;
          }
        }
      });

      const foundInventory = inventories.find(inventory => inventory.product_id === product.entity_id);
      variantDto.qtyInStock = foundInventory ? foundInventory.qty : 0;
      variantDto.isDiscountApplicable = product.is_general_discount_applicable === 453;

      productLinks.forEach(link => {
        if (link.product_id === dto.id) {
          if (link.link_type_id === 1) {
            variantDto.relatedProducts.push({ productId: link.linked_product_id, variantId: '???', sortOrder: 0 });
          } else if (link.link_type_id === 5) {
            variantDto.crossSellProducts.push({ productId: link.linked_product_id, variantId: '???', sortOrder: 0 });
          }
        }
      });

      dto.variants.push(variantDto);

      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/products`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); }, retry: 5 }
          }
        );
        console.log(`[Products]: Migrated id`, dto.id, `- '${dto.name}'`);

        count++;
      } catch (ex) {
        this.failedReqs.products.push(dto.id);
        console.error(`[Products ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
        console.log(dto.variants[0].medias);
        console.log(dto.variants[0].metaTags);
      }
    };

    for (const batch of this.getBatches(products, 3)) {
      await Promise.all(batch.map(product => addProduct(product)));
    }

    try {
      await axios.post(
        `${this.apiHostname}/api/v1/admin/products/migrate-linked`,
        {  },
        {
          params: { migrate: true },
          raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); }, retry: 5 }
        }
      );
      console.log(`[Products]: Updated Related and CrossSell products`);

      count++;
    } catch (ex) {
      console.error(`[Products ERROR]: could not update Related and CrossSell products`);
      console.error(this.buildErrorMessage(ex.response && ex.response.data));
    }

    console.log(`.\n.\n***     Finish migrating PRODUCTS     ***\nCount: ${count} \n.\n.`);
  }

  async populateProductCategories() {
    console.log('.\n.\n***     Start migrating PRODUCTS     ***\n.\n.');
    const products: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_flat_1.json', 'utf-8')));
    const categoryProducts: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_category_product.json', 'utf-8')));

    let count: number = 0;


    const addProduct = async (product) => {
      // if (product.entity_id >= 400 && product.entity_id <= 457 ) { return; }
      if (product.parent_id < 2) { return; }

      const categories = [];
      const categoryProductsForProduct = categoryProducts.filter(cp => cp.product_id === product.entity_id);
      for (const categoryProduct of categoryProductsForProduct) {
        categories.push({ id: categoryProduct.category_id, sortOrder: categoryProduct.position } as AdminProductCategoryDto);
      }

      try {
        await axios.patch(
          `${this.apiHostname}/api/v1/admin/products/${product.entity_id}/categories`,
          categories,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); }, retry: 5 }
          }
        );
        console.log(`[Products]: Migrated id`, product.entity_id);

        count++;
      } catch (ex) {
        this.failedReqs.products.push(product.entity_id);
        console.error(`[Products ERROR]: '${product.entity_id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
      }
    };

    for (const batch of this.getBatches(products, 3)) {
      await Promise.all(batch.map(product => addProduct(product)));
    }

    console.log(`.\n.\n***     Finish migrating PRODUCTS     ***\nCount: ${count} \n.\n.`);
  }

  async populateCustomers() {
    console.log('.\n.\n***     Start migrating CUSTOMERS     ***\n.\n.');
    const customers: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'customer_entity.json', 'utf-8')));
    const customerAttrs: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'customer_entity_varchar.json', 'utf-8')));
    const addresses: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'customer_address_entity.json', 'utf-8')));
    const reviews: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'review.json', 'utf-8')));
    const reviewDetails: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'review_detail.json', 'utf-8')));
    const orders: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'sales_order.json', 'utf-8')));

    let count: number = 0;

    for (const customer of customers) {
      const dto = {} as AdminCustomerDto;
      dto.id = customer.entity_id;
      dto.firstName = customer.firstname;
      dto.lastName = customer.lastname;
      dto.email = customer.email;
      dto.phoneNumber = '';
      const billingAddress = addresses.find(address => address.entity_id === customer.default_billing);
      if (billingAddress) {
        dto.phoneNumber = billingAddress.telephone
      }

      dto.password = null; // todo handle password;

      dto.createdAt = new Date(customer.created_at);
      dto.lastLoggedIn = dto.createdAt;
      dto.isLocked = customer.is_active !== 1;
      dto.isEmailConfirmed = customer.confirmation !== null;
      dto.isPhoneNumberConfirmed = false;

      dto.note = '';
      const customerNote = customerAttrs.find(attr => attr.attribute_id === 226 && attr.entity_id === customer.entity_id);
      if (customerNote) {
        dto.note = customerNote.value || '';
      }

      dto.addresses = [];
      for (const address of addresses) {
        if (address.parent_id === customer.entity_id) {
          const addressDto = {} as ShippingAddressDto;
          addressDto.firstName = address.firstname || '';
          addressDto.lastName = address.lastname || '';
          addressDto.phoneNumber = address.telephone || '';
          addressDto.city = address.city || '';
          addressDto.novaposhtaOffice = address.street || '';
          addressDto.streetName = '';

          dto.addresses.push(addressDto);
        }
      }

      dto.reviewIds = [];
      for (const reviewDetail of reviewDetails) {
        const foundReview = reviews.find(review => review.review_id === reviewDetail.review_id);
        if (foundReview && foundReview.entity_pk_value !== 218 && reviewDetail.customer_id === customer.entity_id) {
          dto.reviewIds.push(foundReview.review_id);
        }
      }

      dto.totalOrdersCost = 0;
      dto.orderIds = [];
      for (const order of orders) {
        if (order.customer_id === customer.entity_id) {
          dto.orderIds.push(order.entity_id);
          dto.totalOrdersCost += order.grand_total;
        }
      }

      dto.discountPercent = 0;
      if (dto.totalOrdersCost >= 500 && dto.totalOrdersCost < 1500) {
        dto.discountPercent = 3;
      } else if (dto.totalOrdersCost >= 1500 && dto.totalOrdersCost < 3000) {
        dto.discountPercent = 5;
      } else if (dto.totalOrdersCost >= 3000 && dto.totalOrdersCost < 5000) {
        dto.discountPercent = 7;
      } else if (dto.totalOrdersCost >= 5000) {
        dto.discountPercent = 10;
      }

      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/customers`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
          }
        );
        console.log(`[Customers]: Migrated id`, dto.id, `- '${dto.firstName} ${dto.lastName}'`);

        count++;
      } catch (ex) {
        this.failedReqs.customers.push(dto.id);
        console.error(`[Customers ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }
    console.log(`.\n.\n***     Finish migrating CUSTOMERS     ***\nCount: ${count} \n.\n.`);
  }

  async populateOrders() {
    console.log('.\n.\n***     Start migrating Orders     ***\n.\n.');
    const orders: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'sales_order.json', 'utf-8')));
    const addresses: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'sales_order_address.json', 'utf-8')));
    const orderPayments: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'sales_order_payment.json', 'utf-8')));
    const orderAttrEntities: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'amasty_order_attribute_entity.json', 'utf-8')));
    const orderAttrEntityValues: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'amasty_order_attribute_entity_int.json', 'utf-8')));
    const shipmentTracks: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'sales_shipment_track.json', 'utf-8')));
    const orderAttrsFlat: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'amasty_order_attribute_grid_flat.json', 'utf-8')));
    const magOrderItems: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'sales_order_item.json', 'utf-8')));
    let count: number = 0;

    // for (const order of orders) {
    const addOrder = async (order) => {
      const dto = {} as AdminAddOrUpdateOrderDto;
      dto.id = order.entity_id;
      dto.idForCustomer = order.increment_id;
      dto.customerId = order.customer_id;
      dto.customerFirstName = order.customer_firstname || '';
      dto.customerLastName = order.customer_lastname || '';
      dto.customerEmail = order.customer_email;
      dto.customerPhoneNumber = order.customer_email;

      dto.address = {} as ShippingAddressDto;
      const foundAddress = addresses.find(address => address.entity_id === order.shipping_address_id);
      dto.address.firstName = foundAddress.firstname;
      dto.address.lastName = foundAddress.lastname;
      dto.address.phoneNumber = foundAddress.telephone;
      dto.address.city = foundAddress.city;
      dto.address.novaposhtaOffice = '';
      if (foundAddress.postcode !== '-') { dto.address.novaposhtaOffice = foundAddress.postcode; }
      if (foundAddress.street !== '-') { dto.address.novaposhtaOffice = foundAddress.street; }

      dto.shouldSaveAddress = false;
      dto.createdAt = order.created_at;
      dto.isConfirmationEmailSent = order.email_sent !== null;

      const foundPayment = orderPayments.find(payment => payment.parent_id === order.entity_id);
      if (foundPayment.method === 'wayforpay') {
        dto.paymentMethodClientName = 'Предоплата на карту. После оформления заказа Вам поступит сообщение с номером карты и суммой (комиссия по тарифам Вашего банка, для карт Привата 0,5% минимум 5 грн)';
      } else {
        dto.paymentMethodClientName = JSON.parse(foundPayment.additional_information) && JSON.parse(foundPayment.additional_information).method_title;
      }

      dto.paymentMethodId = '';
      dto.paymentMethodAdminName = dto.paymentMethodClientName;

      dto.shippingMethodId = '';
      dto.shippingMethodClientName = order.shipping_description;
      dto.shippingMethodAdminName = order.shipping_description;

      dto.isCallbackNeeded = false;
      const foundAttrEntity = orderAttrEntities.find(entity => entity.parent_entity_type === 1 && entity.parent_id === order.entity_id);
      if (foundAttrEntity) {
        const foundAttrEntityValue = orderAttrEntityValues.find(value => value.attribute_id === 225 && value.entity_id === foundAttrEntity.entity_id);
        if (foundAttrEntityValue) {
          dto.isCallbackNeeded = foundAttrEntityValue.value_id === 455;
        }
      }

      dto.items = [];
      for (const magOrderItem of magOrderItems) {
        if (magOrderItem.order_id === order.entity_id) {
          const orderItem = {} as OrderItemDto;
          orderItem.name = magOrderItem.name;
          orderItem.productId = magOrderItem.product_id;
          orderItem.variantId = '';
          orderItem.sku = magOrderItem.sku;
          orderItem.qty = magOrderItem.qty_ordered;
          orderItem.discountValue = magOrderItem.discount_amount;
          orderItem.price = magOrderItem.price;
          orderItem.originalPrice = magOrderItem.original_price;
          orderItem.cost = magOrderItem.row_total;
          orderItem.totalCost = orderItem.cost - orderItem.discountValue;

          try {
            const orderItemDto = {} as AdminCreateOrderItemDto;
            orderItemDto.sku = magOrderItem.sku;
            orderItemDto.qty = magOrderItem.qty_ordered;
            orderItemDto.customerId = magOrderItem.customer_id;
            const response = await axios.post<{ data: OrderItemDto }>(
              `${this.apiHostname}/api/v1/admin/order-items`,
              orderItemDto,
              {
                params: { migrate: true },
                raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
              }
            );

            orderItem.variantId = response.data.data.variantId;
            orderItem.imageUrl = response.data.data.imageUrl;
            orderItem.slug = response.data.data.slug;

            dto.items.push(orderItem);
          } catch (ex) {
            if (ex.response.status === 404) {

              dto.items.push(orderItem);

            } else {
              console.error(`[Order Items ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
              console.error(this.buildErrorMessage(ex.response && ex.response.data));
            }
          }
        }
      }

      if (!dto.items.length) { return; }

      dto.status = order.status;
      dto.state = order.state;

      dto.clientNote = '';
      dto.adminNote = '';
      const foundFlat = orderAttrsFlat.find(flat => flat.parent_id === order.entity_id);
      if (foundFlat) {
        dto.clientNote = foundFlat.buyer_order_comment || '';
        dto.adminNote = foundFlat.manager_order_comment || '';
      }

      dto.novaposhtaTrackingId = '';
      const foundTracking = shipmentTracks.find(track => track.order_id === order.entity_id);
      if (foundTracking) {
        dto.novaposhtaTrackingId = foundTracking.track_number;
      } else if (dto.adminNote) {
        const regexMatch = dto.adminNote.match(/([25]\d{13})/m);
        if (regexMatch) {
          dto.novaposhtaTrackingId = regexMatch[0];
        }
      }

      dto.logs = [];
      dto.totalItemsCost = order.subtotal;
      dto.discountValue = Math.abs(order.discount_amount);
      dto.discountPercent = Math.round((dto.discountValue / dto.totalItemsCost) * 100);
      dto.discountLabel = order.discount_description;
      dto.totalCost = order.grand_total;


      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/orders`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
          }
        );
        console.log(`[Orders]: Migrated id: `, dto.id);

        count++;
      } catch (ex) {
        this.failedReqs.orders.push(dto.id);
        console.error(`[Orders ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    };

    for (const batches of this.getBatches(orders, 3)) {
      await Promise.all(batches.map(order => addOrder(order)));
    }

    console.log(`.\n.\n***     Finish migrating Orders     ***\nCount: ${count} \n.\n.`);
  }

  async populateStoreReviews() {
    console.log('.\n.\n***     Start migrating Store Reviews     ***\n.\n.');
    const store_reviews: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'review.json', 'utf-8')))
      .filter((review: any) => review.entity_pk_value === 218);
    const reviewDetails: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'review_detail.json', 'utf-8')));
    const owner_comments: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'intenso_review_storeowner_comment.json', 'utf-8')));
    let count: number = 0;

    // const addStoreReviews = async (store_review) => {
    for (const store_review of store_reviews) {

      const dto = {} as AdminStoreReviewDto;
      dto.id = store_review.review_id;
      dto.isEnabled = true;
      dto.votesCount = 0;
      dto.hasClientVoted = false;
      const store_review_details = reviewDetails.find(rd => rd.review_id === store_review.review_id);
      dto.name = store_review_details.nickname;
      dto.text = store_review_details.detail;
      dto.customerId = store_review_details.customer_id;
      dto.email = 'info@klondike.com.ua';
      dto.rating = 5;
      dto.sortOrder = 0;
      dto.medias = [];
      dto.createdAt = new Date(store_review.created_at);

      const owner_comment = owner_comments.find(c => c.review_id === store_review.review_id);
      dto.managerComment = owner_comment ? owner_comment.text : '';

      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/store-reviews`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
          }
        );
        console.log(`[Store Reviews]: Migrated id: `, dto.id);

        count++;
      } catch (ex) {
        this.failedReqs.storeReviews.push(dto.id);
        console.error(`[Store Reviews ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }

    // for (const batches of this.getBatches(store_reviews, 2)) {
    //   await Promise.all(batches.map(order => addStoreReviews(order)));
    // }

    console.log(`.\n.\n***     Finish migrating Store Reviews     ***\nCount: ${count} \n.\n.`);
  }

  async populateProductReviews() {
    console.log('.\n.\n***     Start migrating Product Reviews     ***\n.\n.');
    const product_reviews: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'review.json', 'utf-8')))
      .filter((review: any) => review.entity_pk_value !== 218);
    const reviewDetails: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'review_detail.json', 'utf-8')));
    const products: any[] = Array.from(JSON.parse(fs.readFileSync(this.datafilesdir + 'catalog_product_flat_1.json', 'utf-8')));
    let count: number = 0;

    // const addProductReviews = async (store_review) => {
    for (const product_review of product_reviews) {

      const dto = {} as AdminProductReviewDto;
      dto.id = product_review.review_id;
      dto.isEnabled = true;
      dto.votesCount = 0;
      dto.hasClientVoted = false;
      const product_review_details = reviewDetails.find(rd => rd.review_id === product_review.review_id);
      dto.name = product_review_details.nickname;
      dto.text = product_review_details.detail;
      dto.customerId = product_review_details.customer_id;
      dto.email = 'info@klondike.com.ua';
      dto.rating = 5;
      dto.sortOrder = 0;
      dto.medias = [];
      dto.createdAt = new Date(product_review.created_at);
      dto.productId = product_review.entity_pk_value;
      const product = products.find(p => p.entity_id === product_review.entity_pk_value);
      dto.productName = product.name;
      dto.comments = [];


      try {
        await axios.post(
          `${this.apiHostname}/api/v1/admin/product-reviews`,
          dto,
          {
            params: { migrate: true },
            raxConfig: { httpMethodsToRetry: ['GET', 'POST', 'PUT'], onRetryAttempt: err => { console.log('retry!'); } }
          }
        );
        console.log(`[Product Reviews]: Migrated id: `, dto.id);

        count++;
      } catch (ex) {
        this.failedReqs.productReviews.push(dto.id);
        console.error(`[Product Reviews ERROR]: '${dto.id}': `, ex.response ? ex.response.status : ex);
        console.error(this.buildErrorMessage(ex.response && ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }

    // for (const batches of this.getBatches(store_reviews, 2)) {
    //   await Promise.all(batches.map(order => addProductReviews(order)));
    // }

    console.log(`.\n.\n***     Finish migrating Product Reviews     ***\nCount: ${count} \n.\n.`);
  }

  async updateCounter(entity: string) {
    await axios.post(
      `${this.apiHostname}/api/v1/admin/${entity}/counter`);
  }















  private getBatches<T = any>(arr: T[], size: number = 2): T[][] {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (i % size !== 0) {
        continue;
      }

      const resultItem = [];
      for (let k = 0; (resultItem.length < size && arr[i + k]); k++) {
        resultItem.push(arr[i + k]);
      }
      result.push(resultItem);
    }

    return result;
  }

  private buildErrorMessage(response: any): string {
    const errors: string[] = [];

    if (!response) { return 'Cannot build error'; }
    if (typeof response.message === 'string') {
      errors.push(`${response.error}: ${response.message}`);

    } else if (Array.isArray(response.message) && response.message.length > 0) {
      errors.push(response.error + ':');
      errors.push(...this.getErrorsFromValidationErrors(response.message));
    }

    return errors.join('\n');
  }

  private getErrorsFromValidationErrors(validationErrors): string[] {
    const errors: string[] = [];

    validationErrors.forEach(validationError => {

      if (validationError.constraints) {
        let errorMsg = this.buildMessageFromConstraints(validationError.constraints);

        if (typeof validationError.value === 'string') {
          errorMsg += `, got: '${validationError.value}'`;
        }

        errors.push(errorMsg);
      }

      if (Array.isArray(validationError.children) && validationError.children.length > 0) {
        errors.push(...this.getErrorsFromValidationErrors(validationError.children));
      }
    });

    return errors;
  }

  private buildMessageFromConstraints(constraints): string {
    const messages: string[] = [];

    Object.keys(constraints).forEach(key => {
      messages.push(constraints[key]);
    });

    return messages.join(', ');
  }
}
