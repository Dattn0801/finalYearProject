function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    //jwt authentication err
    res.status(500).json({ message: "User is not authorized" });
  }
  if (err.name === "ValidationError") {
    //validate err
    res.status(500).json({ message: err });
  }

  //server err
  return res.status(500).json(err);
}
module.exports = errorHandler;
