const { gql } = require('apollo-server-express');
const typeDef = gql`
  extend type Query {
    carts(where: WhereCart): [Cart]
  }
  # Cart type defines the queryable fields for every Cart in our data source.
  type Cart {
    user_id: Int
    item_id: Int
    item_type: String
    User: User
  }

  input InputCart {
    user_id: Int
    item_id: Int
    item_type: String
  }

  input WhereCart {
    user_id: SeqOpInt
    item_type: SeqOpCartItem_type
  }

  input SeqOpCartItem_type {
    in: [CartItem_type]
    eq: CartItem_type
  }

  enum CartItem_type {
    PRODUCT
    SERVICE
  }
`;
module.exports = typeDef;
