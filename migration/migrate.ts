import * as path from "path";
import * as fs from "fs";
import { Database } from './mysql-db';
import { AdminAddOrUpdateCategoryDto, AdminResponseCategoryDto } from '../src/shared/dtos/admin/category.dto';
import { MetaTagsDto } from '../src/shared/dtos/admin/meta-tags.dto';
import axios from 'axios';
import { AdminProductDto } from '../src/shared/dtos/admin/product.dto';
import { AdminAttributeDto, AdminAttributeValueDto } from '../src/shared/dtos/admin/attribute.dto';

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
    console.log('start migrate');

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
    const file = fs.readFileSync(this.datafilesdir + 'catalog_category_flat_store_1.json', 'utf-8');
    const categories: any[] = Array.from(JSON.parse(file));

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
      dto.slug = category.url_key;

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/categories`, dto, { params: { migrate: true } });
      } catch (ex) {
        console.error(`[Categories]: '${dto.id}' '${dto.name}' error: `, ex.response.status);
        console.error(ex.response.data.message);
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }
  }

  async populateProductAttributes() {
    const attrsFile = fs.readFileSync(this.datafilesdir + 'eav_attribute.json', 'utf-8');
    const attributes: any[] = Array.from(JSON.parse(attrsFile));
    const optionsFile = fs.readFileSync(this.datafilesdir + 'eav_attribute_option.json', 'utf-8');
    const options: any[] = Array.from(JSON.parse(optionsFile));
    const optionValuesFile = fs.readFileSync(this.datafilesdir + 'eav_attribute_option_value.json', 'utf-8');
    const optionValues: any[] = Array.from(JSON.parse(optionValuesFile));

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
      } catch (ex) {
        console.error(`[ProductAttributes]: '${dto.id}' error: `, ex.response.status);
        console.error(ex.response.data.message);
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }
  }

  async populateProducts() {
    const file = fs.readFileSync(this.datafilesdir + 'catalog_product_flat_1.json', 'utf-8');
    const products: any[] = Array.from(JSON.parse(file));

    for (const product of products) {
      if (product.parent_id < 2) { continue; }

      const dto = {} as AdminProductDto;

      try {
        await axios.post(`http://localhost:3500/api/v1/admin/products`, dto, { params: { migrate: true } });
      } catch (ex) {
        console.error(`[Product]: '${dto.id}' error: `, ex.response.status);
        console.error(ex.response.data.message);
        console.log(`'${dto.id}' dto: `);
        console.log(dto);
      }
    }
  }
}
