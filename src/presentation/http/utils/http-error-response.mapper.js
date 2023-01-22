const errorTypes = require('../../../shared/error-types.enum');

function mapError({ type, message }) {
  const errorResponse = {
    message: '',
    httpStatus: 500,
  };

  errorResponse.message = message;
  switch (type) {
    case errorTypes.INTERNAL_ERROR:
      errorResponse.httpStatus = 500;
      break;
    case errorTypes.UNPROCESSABLE:
      errorResponse.httpStatus = 422;
      break;
    default:
      errorResponse.httpStatus = 500;
      break;
  }

  return errorResponse;
}

module.exports = {
  mapError,
};
