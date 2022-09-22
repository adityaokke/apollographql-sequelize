const { gql } = require('apollo-server-express');
const typeDef = gql`
  extend type Query {
    products: [Product]
  }

  # Product type defines the queryable fields for every Product in our data source.
  type Product {
    name: String
    price: Float
    Cart: Cart
  }

  input InputProduct {
    name: String
    price: Float
  }
`;
module.exports = typeDef;
