import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { pipeline } from 'stream';
import * as sharp from 'sharp';
import { FastifyRequest } from 'fastify';
import { join, parse } from 'path';
import { transliterate } from '../../helpers/transliterate.function';
import { Media } from '../../models/media.model';
import { readableBytes } from '../../helpers/readable-bytes.function';
import { isMediaVariantSquare, MediaVariantEnum } from '../../enums/media-variant.enum';
import * as FileType from 'file-type';

interface ResizeOption {
  variant: MediaVariantEnum;
  maxDimension: number | null;
}

@Injectable()
export class MediaService {

  private fileNameSeparator = '_';
  private uploadDirName = 'upload';
  private resizeOptions: ResizeOption[] = [
    {
      variant: MediaVariantEnum.Original,
      maxDimension: null
    },
    {
      variant: MediaVariantEnum.Large,
      maxDimension: 1024
    },
    {
      variant: MediaVariantEnum.LargeSquare,
      maxDimension: 1024
    },
    {
      variant: MediaVariantEnum.Medium,
      maxDimension: 600
    },
    {
      variant: MediaVariantEnum.Small,
      maxDimension: 300
    }
  ];
  private allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'tiff', 'gif'];
  private logger = new Logger(MediaService.name);
  private newFileExtWithDot = '.jpg';

  async upload(request: FastifyRequest, entityDirName: string): Promise<Media> {

    return new Promise<Media>((resolve, reject) => {
      let isRejected: boolean = false;

      request.multipart(
        async (field, fileStreamArg, fileName, _encoding, _mimetype) => {

          const fileStream = await FileType.stream(fileStreamArg);

          if (!this.allowedExt.includes(fileStream.fileType.ext)) {
            reject(new BadRequestException(`Type of the file '${fileName}' is not allowed`));
            return;
          }
          let { name } = parse(fileName);
          name = transliterate(name).substring(0, 100);

          const saveDirName = join(this.uploadDirName, entityDirName);
          await fs.promises.mkdir(saveDirName, { recursive: true });

          const media = new Media();
          const metadataCallback  = (isOriginal: boolean) => {
            if (isOriginal) { return () => {}; }
            return (err, metadata: sharp.Metadata) => {
              if (err) {
                reject(err);
                return;
              }
              media.size = readableBytes(metadata.size);
              media.dimensions = `${metadata.width}x${metadata.height} px`;
            };
          };

          const fullFileNameOfOriginal = await this.getUniqueFileName(saveDirName, `${name}${this.newFileExtWithDot}`);
          const { name: fileNameOfOriginal } = parse(fullFileNameOfOriginal);

          let resizedCount = 0;
          for (const resizeOption of this.resizeOptions) {
            const isOriginal = resizeOption.variant === MediaVariantEnum.Original;

            const sharpResizeOptions: sharp.ResizeOptions = {
              width: resizeOption.maxDimension,
              height: resizeOption.maxDimension
            };
            if (isMediaVariantSquare(resizeOption.variant)) {
              sharpResizeOptions.fit = 'contain';
              sharpResizeOptions.background = '#fff';
            } else {
              sharpResizeOptions.fit = 'inside';
            }

            const resizeStream = sharp()
              .resize(sharpResizeOptions)
              .jpeg({ progressive: true, quality: isOriginal ? 100: 80 })
              .metadata(metadataCallback(isOriginal))

            const fileName = isOriginal ? fullFileNameOfOriginal : `${fileNameOfOriginal}${this.fileNameSeparator}${resizeOption.variant}${this.newFileExtWithDot}`;
            const pathToFile = join(saveDirName, fileName);
            const writeStream = fs.createWriteStream(pathToFile);

            pipeline(fileStream, resizeStream, writeStream, (err) => {
              if (err) {
                isRejected = true;
                reject(err);
                return;
              }

              media.variantsUrls[resizeOption.variant] = `/${pathToFile}`;
              resizedCount++;

              if (!isRejected && resizedCount === this.resizeOptions.length) {
                resolve(media);
              }
            });
          }
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

  async duplicateMedias(medias: Media[], mediaTypeDirName: string): Promise<Media[]> {
    const duplicates: Media[] = [];

    for (const media of medias) {
      const duplicate = new Media();
      duplicate.altText = media.altText;
      duplicate.dimensions = media.dimensions;
      duplicate.isHidden = media.isHidden;
      duplicate.size = media.size;

      for (const [variantName, variantUrl] of Object.entries(media.variantsUrls)) {
        if (!variantUrl) {
          continue;
        }

        let { base: oldFileNameWithExt, name: oldFileName, ext } = parse(variantUrl);
        if (variantName !== MediaVariantEnum.Original) {
          oldFileName = oldFileName.slice(0, oldFileName.indexOf(`${this.fileNameSeparator}${variantName}`));
        }

        const parts = oldFileName.split(this.fileNameSeparator);

        let newFileNameWithExt: string = '';
        if (parts.length === 1) {
          newFileNameWithExt = `${oldFileName}${this.fileNameSeparator}1`;
        } else {
          const [lastPart] = parts.splice(-1, 1);
          const iteration = parseInt(lastPart);
          if (Number.isNaN(iteration)) {
            newFileNameWithExt = `${oldFileName}${this.fileNameSeparator}1`;
          } else {
            parts.push(`${iteration + 1}`);
            newFileNameWithExt = parts.join(this.fileNameSeparator);
          }
        }
        if (variantName !== MediaVariantEnum.Original) {
          newFileNameWithExt += `${this.fileNameSeparator}${variantName}`;
        }
        newFileNameWithExt += ext;

        const pathToOldFile = join(this.uploadDirName, mediaTypeDirName, oldFileNameWithExt);
        const pathToNewFile = join(this.uploadDirName, mediaTypeDirName, newFileNameWithExt);

        await fs.promises.copyFile(pathToOldFile, pathToNewFile);

        duplicate.variantsUrls[variantUrl] = `${pathToNewFile}`;
      }

      duplicates.push(duplicate);
    }

    return duplicates;
  }

  async deleteMedias(medias: Media[], mediaTypeDirName: string) {
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
      fileName = `${name}${this.fileNameSeparator}${iteration}${ext}`;
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
