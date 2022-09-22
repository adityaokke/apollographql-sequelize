"use strict";

const fs = require("fs");
const path = require("path");
const { merge } = require("lodash");
const basename = path.basename(__filename);


// Resolvers define the technique for fetching the types defined in the
// schema.
let resolvers = {};
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    resolvers = merge(resolvers, require(path.join(__dirname, file)));
  });

module.exports = resolvers;
