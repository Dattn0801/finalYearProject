const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

//Midleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);

//Routers
const categoriesRoutes = require("./routers/categories");
const productsRouters = require("./routers/products");
const usersRouters = require("./routers/users");
const ordersRouters = require("./routers/orders");
const res = require("express/lib/response");

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRouters);
app.use(`${api}/users`, usersRouters);
app.use(`${api}/orders`, ordersRouters);

//Database connection
//Add the connect before starting the serve <3
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "eshop-database",
  })
  .then(() => {
    console.log("Database Connection is ready");
  })
  .catch((err) => {
    console.log(err);
  });

//Server
app.listen(3000, () => {
  console.log(api);
  console.log("server is running http://localhost:3000");
});
