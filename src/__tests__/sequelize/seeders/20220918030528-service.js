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
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Services', items, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Services', null, {}).then(() => {
      return queryInterface.sequelize.query('ALTER TABLE `Services` auto_increment = 1');
    });
  },
};
