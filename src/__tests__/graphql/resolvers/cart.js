const models = require('../../sequelize/models');
const { getOptions } = require('../graphql-helper');

const resolvers = {
  Query: {
    carts(parent, args, context, info) {
      return models.Cart.findAll(getOptions(models.Cart, args, info));
    },
  },
};

module.exports = resolvers;
