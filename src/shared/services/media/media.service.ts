import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { pipeline as pipelineImport } from 'stream';
import * as sharp from 'sharp';
import { FastifyRequest } from 'fastify';
import { join, parse } from 'path';
import { promisify } from 'util';
import { transliterate } from '../../helpers/transliterate.function';
import { Media } from '../../models/media.model';
import { readableBytes } from '../../helpers/readable-bytes.function';
import { MediaVariantEnum } from '../../enums/media-variant.enum';
import { AdminMediaDto } from '../../dtos/admin/media.dto';

const pipeline = promisify(pipelineImport);

interface ResizeOptions {
  variant: MediaVariantEnum;
  maxDimension: number | null;
}

@Injectable()
export class MediaService {

  private uploadDirName = 'upload';
  private tmpDirName = 'tmp';
  private resizeOptions: ResizeOptions[] = [
    {
      variant: MediaVariantEnum.Original,
      maxDimension: null
    }, {
      variant: MediaVariantEnum.Large,
      maxDimension: 1024
    }, {
      variant: MediaVariantEnum.Medium,
      maxDimension: 600
    }, {
      variant: MediaVariantEnum.Small,
      maxDimension: 300
    }
  ];
  private allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.tiff', '.gif'];
  private logger = new Logger(MediaService.name);

  async upload(request: FastifyRequest, entityDirName: string, saveToTmp: boolean = true): Promise<Media> {

    return new Promise<Media>((resolve, reject) => {

      request.multipart(
        async (field, file, fileName, _encoding, _mimetype) => {

          let { name, ext } = parse(fileName);
          if (!this.allowedExt.includes(ext)) {
            reject(new BadRequestException(`Type of the file '${fileName}' is not allowed`));
            return;
          }

          const saveDirName = saveToTmp
            ? join(this.uploadDirName, this.tmpDirName, entityDirName)
            : join(this.uploadDirName, entityDirName);
          await fs.promises.mkdir(saveDirName, { recursive: true });

          name = transliterate(name).substring(0, 100);

          const media = new Media();
          const metadataCallback  = (err, metadata: sharp.Metadata) => {
            if (err) {
              reject(err);
              return;
            }
            media.size = readableBytes(metadata.size);
            media.dimensions = `${metadata.width}x${metadata.height} px`;
          };
          const resize = sharp().jpeg({ progressive: true, quality: 100 }).metadata(metadataCallback);
          const newFileName = await this.getUniqueFileName(saveDirName, `${name}.jpeg`);
          const writeStream = fs.createWriteStream(join(saveDirName, newFileName));
          media.variantsUrls.original = `${join('/', saveDirName, newFileName)}`;

          await pipeline(file, resize, writeStream);

          resolve(media);
        },
        error => {
          if (error) {
            reject(error);
            return;
          }
        }
      );
    });
  }

  async checkTmpAndSaveMedias(mediaDtos: AdminMediaDto[], mediaTypeDirName: string): Promise<{ tmpMedias: Media[], savedMedias: Media[] }> {
    const tmpMedias = [];
    const savedMedias = [];

    for (let media of mediaDtos) {
      const isTmp = media.variantsUrls.original.includes('/tmp/');
      if (isTmp) {
        tmpMedias.push(media);
        savedMedias.push(await this.processAndSave(media, mediaTypeDirName, true));
      } else {
        savedMedias.push(media);
      }
    }

    return { tmpMedias, savedMedias };
  }

  private async processAndSave(mediaDto: AdminMediaDto, mediaTypeDirName: string, isTmp: boolean): Promise<Media> {
    const media = new Media();
    media.altText = mediaDto.altText;
    media.isHidden = mediaDto.isHidden;
    media.size = mediaDto.size;
    media.dimensions = mediaDto.dimensions;

    const { base: tmpFileName } = parse(mediaDto.variantsUrls.original);
    const pathToOldFile = isTmp
      ? join(this.uploadDirName, this.tmpDirName, mediaTypeDirName, tmpFileName)
      : join(this.uploadDirName, mediaTypeDirName, tmpFileName);

    const dir = join(this.uploadDirName, mediaTypeDirName);
    const fileNameToSave = await this.getUniqueFileName(dir, tmpFileName);
    const { name, ext } = parse(fileNameToSave);

    await fs.promises.mkdir(dir, { recursive: true });

    for (const option of this.resizeOptions) {
      const fileName = option.variant === MediaVariantEnum.Original ? fileNameToSave : `${name}_${option.variant}${ext}`;
      const pathToNewFile = join(dir, fileName);
      const writeStream = fs.createWriteStream(pathToNewFile);
      const resizeStream = sharp()
        .resize(option.maxDimension, option.maxDimension, { fit: 'inside' })
        .jpeg({ progressive: true });
      const readStream = fs.createReadStream(pathToOldFile, { autoClose: false });

      await pipeline(readStream, resizeStream, writeStream);

      media.variantsUrls[option.variant] = `/${pathToNewFile}`;
    }

    this.logger.log(`Saved image '${fileNameToSave}' in directory '${dir}'.`);

    return media;
  }

  async duplicateSavedMedias(medias: Media[], mediaTypeDirName: string): Promise<Media[]> {
    const duplicated: Media[] = [];
    for (const media of medias) {
      duplicated.push(await this.processAndSave(media, mediaTypeDirName, false));
    }
    return duplicated;
  }

  async deleteTmpMedias(mediaDtos: AdminMediaDto[], mediaTypeDirName: string) {
    for (const mediaDto of mediaDtos) {
      const { base: tmpFileName } = parse(mediaDto.variantsUrls.original);
      const pathToTmpFile = join(this.uploadDirName, this.tmpDirName, mediaTypeDirName, tmpFileName);

      try {
        await fs.promises.unlink(pathToTmpFile);
      } catch (e) {
        this.logger.error(`Could not delete tmp media: ${pathToTmpFile}`);
        this.logger.error(e);
      }
    }
  }

  async deleteSavedMedias(medias: Media[], mediaTypeDirName: string) {
    for (const media of medias) {
      for (const url of Object.values(media.variantsUrls)) {
        const { base: fileName } = parse(url);
        const pathToFile = join(this.uploadDirName, mediaTypeDirName, fileName);

        try {
          await fs.promises.unlink(pathToFile);
        } catch (e) {
          this.logger.error(`Could not delete saved media:`, pathToFile);
          this.logger.error(e);
        }
      }

      this.logger.log(`Deleted image '${media.variantsUrls.original}'.`);
    }
  }

  private async getUniqueFileName(dir: string, fileName: string, iteration: number = 0): Promise<string> {
    const originalFileName = fileName;

    if (iteration > 0) {
      let { name, ext } = parse(fileName);
      fileName = `${name}_${iteration}${ext}`;
    }

    const exists = await this.doesFileExist(join(dir, fileName));
    if (exists) {
      return await this.getUniqueFileName(dir, originalFileName, ++iteration);
    } else {
      return fileName;
    }
  }

  private async doesFileExist(pathToFile): Promise<boolean> {
    try {
      await fs.promises.access(pathToFile, fs.constants.F_OK); // throws if file doesn't exist
      return true;
    } catch (e) {
      return false;
    }
  }
}
