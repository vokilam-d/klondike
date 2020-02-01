import * as path from "path";
import * as fs from "fs";
import { Database } from './mysql-db';
import { AdminAddOrUpdateCategoryDto, AdminResponseCategoryDto } from '../src/shared/dtos/admin/category.dto';
import { MetaTagsDto } from '../src/shared/dtos/admin/meta-tags.dto';
import axios from 'axios';
import * as FormData from 'form-data';
import { AdminProductDto } from '../src/shared/dtos/admin/product.dto';
import { AdminAttributeDto, AdminAttributeValueDto } from '../src/shared/dtos/admin/attribute.dto';
import { AdminProductVariantDto } from '../src/shared/dtos/admin/product-variant.dto';
import { AdminProductSelectedAttributeDto } from '../src/shared/dtos/admin/product-selected-attribute.dto';
import { MediaDto } from '../src/shared/dtos/admin/media.dto';
import { AdminCustomerDto, AdminShippingAddressDto } from '../src/shared/dtos/admin/customer.dto';
import { AdminOrderDto } from '../src/shared/dtos/admin/order.dto';

export class Migrate {
  /**
   * Hold name of the models to be generated
   *
   * @private
   * @type {(string | any[])}
   * @memberof Migrate
   */
  private models: string | any[];

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
    this.models = modelInfo.map((res: { [x: string]: any }) => {
      return res[Object.keys(res)[0]];
    });
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
      dto.slug = category.url_key;

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/categories`, dto, { params: { migrate: true } });
        count++;
      } catch (ex) {
        console.error(`[Categories]: '${dto.id}' '${dto.name}' error: `, ex.response.status);
        console.error(this.buildErrorMessage(ex.response.data));
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

    let count: number = 0;

    for (const attr of attributes) {
      if (attr.entity_type_id !== 4) { continue; }

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

      if (!dto.values.length) {
        console.log(`[ProductAttributes]: Skip empty attribute: '${dto.id}'`);
        continue;
      }

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/attributes`, dto);
        count++;
      } catch (ex) {
        console.error(`[ProductAttributes]: '${dto.id}' error: `, ex.response.status);
        console.error(this.buildErrorMessage(ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }

    console.log(`.\n.\n***     Finish migrating PRODUCT ATTRIBUTES     ***\nCount: ${count} \n.\n.`);
  }

  async populateProducts() {
    console.log('.\n.\n***     Start migrating PRODUCTS     ***\n.\n.');
    const productsFile = fs.readFileSync(this.datafilesdir + 'catalog_product_flat_1.json', 'utf-8');
    const products: any[] = Array.from(JSON.parse(productsFile));
    const inventoryFile = fs.readFileSync(this.datafilesdir + 'cataloginventory_stock_item.json', 'utf-8');
    const inventories: any[] = Array.from(JSON.parse(inventoryFile));
    const categoryProductsFile = fs.readFileSync(this.datafilesdir + 'catalog_category_product.json', 'utf-8');
    const categoryProducts: any[] = Array.from(JSON.parse(categoryProductsFile));
    const productMetasFile = fs.readFileSync(this.datafilesdir + 'catalog_product_entity_varchar.json', 'utf-8');
    const productMetas: any[] = Array.from(JSON.parse(productMetasFile));
    const mediaValueToEntitiesFile = fs.readFileSync(this.datafilesdir + 'catalog_product_entity_media_gallery_value_to_entity.json', 'utf-8');
    const mediaValueToEntities: any[] = Array.from(JSON.parse(mediaValueToEntitiesFile));
    const mediaValuesFile = fs.readFileSync(this.datafilesdir + 'catalog_product_entity_media_gallery_value.json', 'utf-8');
    const mediaValues: any[] = Array.from(JSON.parse(mediaValuesFile));
    const mediaGalleriesFile = fs.readFileSync(this.datafilesdir + 'catalog_product_entity_media_gallery.json', 'utf-8');
    const mediaGalleries: any[] = Array.from(JSON.parse(mediaGalleriesFile));

    let count: number = 0;

    const attrsResponse = await axios.get(`http://localhost:3500/api/v1/admin/attributes`);
    const savedAttributes: AdminAttributeDto[] = attrsResponse.data.data;


    for (const product of products) {
      if (product.parent_id < 2) { continue; }

      const dto = {} as AdminProductDto;
      dto.id = product.entity_id;
      dto.createdAt = new Date(product.created_at);
      dto.updatedAt = new Date(product.updated_at);
      dto.isEnabled = true;
      dto.name = product.name || '';
      dto.sortOrder = 0;
      dto.salesCount = 0;

      dto.categoryIds = [];
      const categoryProductsForProduct = categoryProducts.filter(cp => cp.product_id === product.entity_id);
      for (const categoryProduct of categoryProductsForProduct) {
        dto.categoryIds.push(categoryProduct.category_id);
      }

      dto.attributes = [];
      Object.keys(product).forEach(key => {
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
      variantDto.slug = product.url_key || '';
      variantDto.attributes = [];
      variantDto.isEnabled = true;
      variantDto.price = product.price || 0;

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
          const imgResponse = await axios.get(`http://173.249.23.253:5200/media/catalog/product${tmpMedia.url}`, { responseType: 'arraybuffer' });
          const form = new FormData();
          form.append('file', imgResponse.data, { filename: path.parse(tmpMedia.url).base });

          const { data: media } = await axios.post<MediaDto>(`http://localhost:3500/api/v1/admin/products/media`, form, { headers: form.getHeaders() });
          media.altText = tmpMedia.alt || '';
          media.isHidden = tmpMedia.disabled === 0;

          variantDto.medias.push(media);

        } catch (ex) {
          console.error(`[Products Media]: '${tmpMedia.url}' for product '${product.name}' id '${dto.id}' error: `, ex.response.status);
          console.error(this.buildErrorMessage(ex.response.data));
        }
      }

      variantDto.fullDescription = product.description || '';
      variantDto.shortDescription = product.short_description || '';

      variantDto.metaTags = {} as MetaTagsDto;
      productMetas.forEach(productMeta => {
        if (productMeta.entity_id === product.entity_id) {
          if (productMeta.attribute_id === 84) {
            variantDto.metaTags.title = productMeta.value;
          }
          if (productMeta.attribute_id === 85) {
            variantDto.metaTags.keywords = productMeta.value;
          }
          if (productMeta.attribute_id === 86) {
            variantDto.metaTags.description = productMeta.value;
          }
        }
      });

      const foundInventory = inventories.find(inventory => inventory.product_id === product.entity_id);
      variantDto.qty = foundInventory ? foundInventory.qty : 0;
      variantDto.isDiscountApplicable = product.is_general_discount_applicable === 453;

      dto.variants.push(variantDto);

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/products`, dto, { params: { migrate: true } });
        console.log(`[Products]: Migrated '${dto.name}' with id '${dto.id}'`);

        count++;
      } catch (ex) {
        console.error(`[Products]: '${dto.id}' error: `, ex.response.status);
        console.error(this.buildErrorMessage(ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
        console.log(dto.variants[0].medias);
        console.log(dto.variants[0].metaTags);
      }
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

      dto.createdDate = new Date(customer.created_at);
      dto.lastLoggedIn = dto.createdDate;
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
          const addressDto = {} as AdminShippingAddressDto;
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
      if (dto.totalOrdersCost >= 500 && dto.totalOrdersCost <= 1499) {
        dto.discountPercent = 3;
      } else if (dto.totalOrdersCost >= 1500 && dto.totalOrdersCost <= 2999) {
        dto.discountPercent = 5;
      } else if (dto.totalOrdersCost >= 3000 && dto.totalOrdersCost <= 4999) {
        dto.discountPercent = 7;
      } else if (dto.totalOrdersCost >= 5000) {
        dto.discountPercent = 10;
      }

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/customers`, dto, { params: { migrate: true } });
        console.log(`[Customers]: Migrated '${dto.firstName} ${dto.lastName}' with id '${dto.id}'`);

        count++;
      } catch (ex) {
        console.error(`[Customers]: '${dto.id}' error: `, ex.response.status);
        console.error(this.buildErrorMessage(ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }
    console.log(`.\n.\n***     Finish migrating CUSTOMERS     ***\nCount: ${count} \n.\n.`);
  }

  async populateOrders() {
    console.log('.\n.\n***     Start migrating Orders     ***\n.\n.');
    const ordersFile = fs.readFileSync(this.datafilesdir + '.json', 'utf-8');
    const orders: any[] = Array.from(JSON.parse(ordersFile));
    let count: number = 0;

    for (const order of orders) {
      const dto = {} as AdminOrderDto;

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/orders`, dto, { params: { migrate: true } });
        console.log(`[Orders]: Migrated '${dto}' with id '${dto.id}'`);

        count++;
      } catch (ex) {
        console.error(`[Orders]: '${dto.id}' error: `, ex.response.status);
        console.error(this.buildErrorMessage(ex.response.data));
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }
    console.log(`.\n.\n***     Finish migrating Orders     ***\nCount: ${count} \n.\n.`);
  }
















  private buildErrorMessage(response: any): string {
    const errors: string[] = [];

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
