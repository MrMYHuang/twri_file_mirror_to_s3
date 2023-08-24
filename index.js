const lib = require('./dist/fileMirroringToS3');
const pkg = require('./package.json');

// For Amazon AWS Lambda.
exports.handler = async (event) => {
  let response;
  try {
      await lib.fileMirroringToS3();
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
