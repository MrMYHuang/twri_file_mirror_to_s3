import AWS from 'aws-sdk';
import axios from 'axios';
import params from './params.json';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

let twrDataUrl = `https://opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=50C8256D-30C5-4B8D-9B84-2E14D5C6DF71`;
let twrWaterDataUrl = `https://opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=1602CA19-B224-4CC3-AA31-11B1B124530F`;

const s3bucket = new AWS.S3({
  accessKeyId: params.IAM_USER_KEY,
  secretAccessKey: params.IAM_USER_SECRET,
  sslEnabled: true,
});

export async function downloadSource(url: string) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  if (res.status == 200) {
    return res.data as ArrayBuffer;
  } else {
    throw `Download source error: ${res.statusText}`;
  }
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

function isJson(buf:ArrayBuffer) {
  try {
    JSON.parse((new TextDecoder('utf-8')).decode(buf));
    return true;
  } catch (error) {
    throw error;
  }
}

export async function fileMirroringToS3() {
  try {
    const data = await downloadSource(twrDataUrl);
    isJson(data);
    await uploadObjectToS3Bucket('twrData.json', data);

    const dataWater = await downloadSource(twrWaterDataUrl);
    isJson(dataWater);
    await uploadObjectToS3Bucket('twrDataWater.json', dataWater);

    console.log(`File mirroring success!`);
  } catch (err) {
    console.error(`File mirroring failed: ` + err);
  }
}
