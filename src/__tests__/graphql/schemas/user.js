const { gql } = require('apollo-server-express');
const typeDef = gql`
  extend type Query {
    users(page: Int, pageSize: Int, where: WhereUser, order: [OrderUser]): [User]
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
    Carts(separate: Boolean, required: Boolean, where: WhereCart): [Cart]
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

  enum OrderUser {
    AGE_ASC
    AGE_DESC
    EMAIL_ASC
    EMAIL_DESC
    CARTS__ITEM_ID_ASC
    CARTS__ITEM_ID_DESC
  }
`;

module.exports = typeDef;
