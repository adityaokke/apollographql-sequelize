'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.User.belongsToMany(models.Product, {
        through: {
          model: models.Cart,
          unique: false,
          scope: {
            item_type: 'PRODUCT',
          },
        },
        foreignKey: 'item_id',
        constraints: false,
      });
      models.User.belongsToMany(models.Service, {
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
      models.User.hasMany(models.Cart, { foreignKey: 'user_id' });
    }
  }
  User.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      userName: DataTypes.STRING,
      password: DataTypes.STRING,
      age: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'User',
    },
  );
  return User;
};
