'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const { gql } = require('apollo-server');
const { print } = require('graphql');

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
let schema = print(gql`
  type Query {
    _empty: String
  }
  type Mutation {
    _emptySet: String
  }

  input SeqOpString {
    in: [String]
    eq: String
  }

  input SeqOpInt {
    in: [Int]
    eq: Int
  }
`);
fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach((file) => {
    schema += print(require(path.join(__dirname, file)));
  });

module.exports = schema;
