import {fileMirroringToS3} from './dist/fileMirroringToS3.js';
import pkg from './package.json' assert {type: 'json'};

// For Amazon AWS Lambda.
export const handler = async (event) => {
  let response;
  try {
      await fileMirroringToS3();
      response = {
          statusCode: 200,
          body: JSON.stringify(`App ver ${pkg.version}. Success!`),
      };
  } catch(err) {
      response = {
          statusCode: 400,
          body: JSON.stringify(`App ver ${pkg.version}. Error! ${err}`),
      };        
  }
  return response;
};
