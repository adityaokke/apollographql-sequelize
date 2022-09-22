const models = require('../../sequelize/models');
const { getOptions } = require('../graphql-helper');
const resolvers = {
  User: {
    CartItems(parent, args) {
      let returnArray = parent.Products || [];
      returnArray = returnArray
        .concat(parent.Services || [])
      return returnArray;
    },
  },
  UnionCartItem: {
    __resolveType(parent, ctx, info) {
      if (parent.Cart.item_type === "PRODUCT") {
        return "Product";
      } 
      if (parent.Cart.item_type === "SERVICE") {
        return "Service";
      }
    },
  },
  Query: {
    users(parent, args, context, info) {
      return models.User.findAll(getOptions(models.User, args, info));
    },
  },
};

module.exports = resolvers;
