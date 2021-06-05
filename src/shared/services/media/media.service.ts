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

export const waitFor = (fn: (cb: (err?) => void) => void): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    fn(err => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

interface ResizeOption {
  variant: MediaVariantEnum;
  maxDimension: number | null;
}

@Injectable()
export class MediaService {

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
    // {
    //   variant: MediaVariantEnum.LargeSquare,
    //   maxDimension: 1024
    // },
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

            const fileName = isOriginal ? fullFileNameOfOriginal : `${fileNameOfOriginal}_${resizeOption.variant}${this.newFileExtWithDot}`;
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

  async setSquare(medias: Media[], mediaTypeDirName: string): Promise<Media[]> {
    const saveDirName = join(this.uploadDirName, mediaTypeDirName);

    for (const media of medias) {
      await new Promise<Media>((resolve, reject) => {
        const { base: fileNameBase, name: fileName} = parse(media.variantsUrls.large);
        const pathToOldFile = join(saveDirName, fileNameBase);
        const readStream = fs.createReadStream(pathToOldFile);

        const resizeStream = sharp()
          .resize({ width: 1024, height: 1024, fit: 'contain', background: '#fff' })
          .jpeg({ progressive: true, quality: 100 });

        const newFileName = fileName.slice(0, fileName.indexOf(`_${MediaVariantEnum.Large}`)) + `_${MediaVariantEnum.LargeSquare}${this.newFileExtWithDot}`;
        const pathToNewFile = join(saveDirName, newFileName);
        const writeStream = fs.createWriteStream(pathToNewFile);

        pipeline(readStream, resizeStream, writeStream, (err) => {
          if (err) {
            console.error(`Media "${mediaTypeDirName}${media.variantsUrls.original}" err:`);
            console.error(err);
            reject(err);
          } else {
            media.variantsUrls.large_square = `/${pathToNewFile}`;
            console.log(`Media "${mediaTypeDirName}${media.variantsUrls.large_square}" success`);
            resolve();
          }
        });
      });

    }

    return medias;
  }

  async duplicateMedias(medias: Media[], mediaTypeDirName: string): Promise<Media[]> {
    const duplicated: Media[] = [];
    for (const media of medias) {
      // duplicated.push(await this.resizeMediaDtoAndSave(media, mediaTypeDirName));
    }
    return duplicated;
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
