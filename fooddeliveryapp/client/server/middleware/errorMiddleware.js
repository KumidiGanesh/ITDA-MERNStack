const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || error.status || (
    error.name === "ValidationError" || error.name === "CastError" ? 400 : 500
  );
  let message = error.message || "Internal server error";
  let errors = error.errors;

  if (error.name === "ValidationError") {
    message = "Validation failed";
    errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, fieldError]) => [field, fieldError.message]),
    );
  }

  if (error.code === 11000) {
    message = "A record with this value already exists";
    errors = Object.fromEntries(
      Object.keys(error.keyValue || {}).map((field) => [field, `${field} must be unique`]),
    );
  }

  const response = { success: false, message };
  if (errors && Object.keys(errors).length > 0) response.errors = errors;

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
