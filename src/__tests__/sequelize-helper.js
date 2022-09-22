const models = require('./sequelize/models');

function parse(items) {
  if (Array.isArray(items)) {
    return items.map((item) => {
      return parse(item);
    });
  } else if (typeof items === 'object' && Object.keys(items).length) {
    const returnObj = {};
    const itemsDataValues = items.dataValues;
    if (items.dataValues) {
      Object.keys(itemsDataValues).forEach((key) => {
        returnObj[key] = parse(itemsDataValues[key]);
      });
    }
    return returnObj;
  }
  return items;
}

module.exports = {
  findAll(modelName, opt) {
    return models[modelName].findAll(opt).then(parse);
  },
  findOne(modelName, opt) {
    return models[modelName].findOne(opt).then(parse);
  },
};
