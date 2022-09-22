'use strict';
const { faker } = require('@faker-js/faker');
const items = [...Array(100)].map(() => ({
  id: faker.datatype.uuid(),
  user_id: faker.datatype.number({ min: 1, max: 101 }),
  item_id: faker.datatype.number({ min: 1, max: 101 }),
  item_type: faker.helpers.arrayElement(['PRODUCT', 'SERVICE']),
  createdAt: new Date(),
  updatedAt: new Date(),
}));
items.push({
  id: faker.datatype.uuid(),
  user_id: 101,
  item_id: 101,
  item_type: 'PRODUCT',
  createdAt: new Date(),
  updatedAt: new Date(),
});
items.push({
  id: faker.datatype.uuid(),
  user_id: 101,
  item_id: 101,
  item_type: 'SERVICE',
  createdAt: new Date(),
  updatedAt: new Date(),
});
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Carts', items, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Carts', null, {});
  },
};
