'use strict';
const { faker } = require('@faker-js/faker');
const items = [...Array(100)].map(() => ({
  name: faker.name.firstName(),
  price: faker.commerce.price(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));
items.push({
  name: 'always_exist',
  price: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
});
/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Products', items, {});
  },
  /**
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns
   */
  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Products', null, {}).then(() => {
      return queryInterface.sequelize.query('ALTER TABLE `Products` auto_increment = 1');
    });
  },
};
