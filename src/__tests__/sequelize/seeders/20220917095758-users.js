'use strict';
const { faker } = require('@faker-js/faker');
const items = [...Array(100)].map(() => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  userName: faker.internet.userName(),
  password: faker.internet.password(8),
  jobTitle: faker.name.jobTitle(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users', items, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {}).then(() => {
      return queryInterface.sequelize.query("ALTER TABLE `Users` auto_increment = 1");
    })
  },
};
