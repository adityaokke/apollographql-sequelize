const { gql } = require('apollo-server-express');
const typeDef = gql`
  extend type Query {
    users(page: Int, pageSize: Int, where: WhereUser): [User]
  }
  union UnionCartItem = Product | Service
  # User type defines the queryable fields for every user in our data source.
  type User {
    firstName: String
    lastName: String
    email: String
    userName: String
    password: String
    age: Int
    Products: [Product]
    Carts(separate: Boolean, required: Boolean): [Cart]
    CartItems: [UnionCartItem]
  }

  input InputUser {
    firstName: String
    lastName: String
    email: String
    userName: String
    password: String
    age: Int
  }

  input WhereUser {
    age: SeqOpInt
  }
`;

module.exports = typeDef;
