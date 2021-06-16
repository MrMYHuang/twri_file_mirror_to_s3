import path from 'path';
import fs from 'fs';
import * as AdmZip from 'adm-zip';
import AWS from 'aws-sdk';
import puppeteer from 'puppeteer';
import params from './params.json';
const tempDir = './temp';
const node_xj = require("xls-to-json");

const s3bucket = new AWS.S3({
  accessKeyId: params.IAM_USER_KEY,
  secretAccessKey: params.IAM_USER_SECRET
});

export async function downloadSource() {
  const timeout = 5 * 60 * 1000;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  await (page as any)._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.resolve(tempDir),
  });
  await page.goto(params.SOURCE_URL);
  await page.setDefaultNavigationTimeout(timeout);
  await page.click('#LinkButton1');

  try {
    await new Promise<void>((ok, fail) => {
      let downloadDoneChecker = setInterval(() => {
        const files = fs.readdirSync(tempDir);
        if (files.some((file: string) => /.*xls$/.test(file))) {
          clearInterval(downloadDoneChecker);
          ok();
        }
      }, 500);
    });

    console.log('File download done!');
    await browser.close();
  } catch (error) {
    throw `Download source error: ${error}`;
  }
}

async function xlsToJson() {
  const files = fs.readdirSync(tempDir);
  return new Promise<void>((ok, fail) => {
    node_xj(
      {
        input: `${tempDir}/${files[0]}`, // input xls
        rowsToSkip: 0, // number of rows to skip at the top of the sheet; defaults to 0
        allowEmptyKey: false, // avoids empty keys in the output, example: {"": "something"}; default: true
      },
      function (err: any, result: any) {
        if (err) {
          fail(err);
        } else {
          ok(result);
        }
      }
    );
  });
}

async function uploadObjectToS3Bucket(objectName: string, objectData: any) {
  return new Promise<void>((ok, fail) => {
    const s3params: AWS.S3.PutObjectRequest = {
      Bucket: params.BUCKET_NAME,
      Key: objectName,
      Body: objectData,
      ACL: 'public-read'
    };
    s3bucket.upload(s3params, function (err: Error, data: { Location: any; }) {
      if (err) {
        fail(err);
        return;
      }

      ok();
    });
  });
}

export async function fileMirroringToS3() {
  try {
    await downloadSource();
    const data = Buffer.from(JSON.stringify(await xlsToJson()));
    fs.rmSync(tempDir, {recursive: true, force: true});
    const zip = new AdmZip.default();
    zip.addFile('a.json', data);
    await uploadObjectToS3Bucket(params.S3_OBJECT_NAME, zip.toBuffer());
    console.log(`File mirroring success!`);
  } catch (err) {
    console.error(`File mirroring failed: ` + err);
  }
}
