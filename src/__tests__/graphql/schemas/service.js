const { gql } = require('apollo-server-express');
const typeDef = gql`
  # Service type defines the queryable fields for every Service in our data source.
  type Service {
    name: String
    price: Float
    Cart: Cart
  }

  input InputService {
    name: String
    price: Float
  }
`;
module.exports = typeDef;
