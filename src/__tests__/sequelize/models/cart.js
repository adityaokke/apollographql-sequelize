'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Cart.belongsTo(models.User, {
        onDelete: 'CASCADE',
        foreignKey: 'user_id',
        targetKey: 'id',
      });
    }
  }
  Cart.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: DataTypes.INTEGER,
      item_id: DataTypes.INTEGER,
      item_type: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Cart',
    },
  );
  return Cart;
};
