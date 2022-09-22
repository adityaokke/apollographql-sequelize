'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Service.belongsToMany(models.User, {
        through: {
          model: models.Cart,
          unique: false,
          scope: {
            item_type: 'SERVICE',
          },
        },
        foreignKey: 'item_id',
        constraints: false,
      });
    }
  }
  Service.init(
    {
      name: DataTypes.STRING,
      price: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: 'Service',
    },
  );
  return Service;
};
