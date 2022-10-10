const { graphql } = require('./graphql');
const { findAll } = require('./sequelize-helper');
const { Op } = require('sequelize');
const models = require('./sequelize/models');

describe('graphql output', () => {
  test('has same attributes', async () => {
    const query = `
      query users {
        users(page:1, pageSize:1) {
            firstName
        }
      }
    `;
    const variables = {};
    const result = await graphql({ query, variables });
    // offset = (page - 1) * pageSize;
    // limit = pageSize;
    const compare = await findAll('User', { attributes: ['firstName'], offset: 0, limit: 1 });
    expect(result.data.users).toEqual(compare);
  });
});

describe('graphql arguments', () => {
  describe('where', () => {
    test('sequelize eq', async () => {
      const query = `
        query users($where: WhereUser){
          users(where: $where){
            firstName
            age
          }
        }
      `;
      const variables = {
        where: {
          age: {
            eq: 20,
          },
        },
      };
      const result = await graphql({ query, variables });
      const compare = await findAll('User', { attributes: ['firstName', 'age'], where: { age: { [Op.eq]: 20 } } });
      expect(result.data.users).toEqual(compare);
    });
  });
  describe('separate', () => {
    // use dataloader to load nested type
    test('true', async () => {
      const query = `
        query users($separate: Boolean, $where: WhereUser) {
          users(where: $where) {
            firstName
            Carts(separate: $separate) {
              user_id
              item_type
              item_id
            }
          }
        }
      `;
      const variables = {
        separate: true,
        where: {
          age: {
            eq: 20,
          },
        },
      };
      const result = await graphql({ query, variables });
      const compare = await findAll('User', { attributes: ['firstName'], where: { age: { [Op.eq]: 20 } } });
      expect(result.data.users).toEqual(
        compare.map((item) => {
          // Carts will be loaded in separate way (i.e: using dataloader)
          item.Carts = null;
          return item;
        }),
      );
    });
  });
  describe('required', () => {
    // use dataloader to load nested type
    test('true', async () => {
      const query = `
        query users($required: Boolean) {
          users {
            firstName
            Carts(required: $required) {
              user_id
              item_type
              item_id
            }
          }
        }
      `;
      const variables = {
        required: true,
      };
      const result = await graphql({ query, variables });
      const compare = await findAll('User', {
        attributes: ['firstName'],
        include: [
          {
            model: models.Cart,
            required: true,
            attributes: ['user_id', 'item_type', 'item_id'],
          },
        ],
      });
      expect(result.data.users).toEqual(compare);
    });
  });
  describe('order', () => {
    test('1 field', async () => {
      const query = `
        query users($order: [OrderUser]) {
          users(order: $order) {
            firstName
            age
          }
        }
      `;
      const variables = {
        order: ["AGE_DESC"],
      };
      const result = await graphql({ query, variables });
      const compare = await findAll('User', {
        attributes: ['firstName', 'age'],
        order: [
          ['age', 'DESC'],
        ] 
      });
      expect(result.data.users).toEqual(compare);
    });
    test('2 field', async () => {
      const query = `
        query users($order: [OrderUser]) {
          users(order: $order) {
            firstName
            email
            age
          }
        }
      `;
      const variables = {
        order: ["AGE_ASC", "EMAIL_DESC"],
      };
      const result = await graphql({ query, variables });
      const compare = await findAll('User', {
        attributes: ['firstName', 'email', 'age'],
        order: [
          ['age', 'ASC'],
          ['email', 'DESC'],
        ] 
      });
      expect(result.data.users).toEqual(compare);
    });
  });
});

describe('graphql association', () => {
  test('has many', async () => {
    const query = `
      query users($where: WhereUser) {
        users(where: $where) {
          firstName
          age
          Carts {
            user_id
            item_type
            item_id
          }
        }
      }
    `;
    const variables = {
      where: {
        age: {
          eq: 20,
        },
      },
    };
    const result = await graphql({ query, variables });
    const compare = await findAll('User', {
      attributes: ['firstName', 'age'],
      include: [
        {
          attributes: ['user_id', 'item_id', 'item_type'],
          model: models.Cart,
        },
      ],
      where: { age: { [Op.eq]: 20 } },
    });
    expect(result.data.users).toEqual(compare);
  });
  test('belongs to', async () => {
    const query = `
      query carts($where: WhereCart){
        carts(where: $where) {
          item_id
          item_type
          User {
            firstName
          }
        }
      }
    `;
    const variables = {
      where: {
        user_id: {
          eq: 101,
        },
      },
    };
    const result = await graphql({ query, variables });
    const compare = await findAll('Cart', {
      attributes: ['item_id', 'item_type'],
      include: [
        {
          attributes: ['firstName'],
          model: models.User,
        },
      ],
      where: { user_id: { [Op.eq]: 101 } },
    });
    expect(result.data.carts).toEqual(compare);
  });
  test('belongs to many', async () => {
    const query = `
      query users($where: WhereUser){
        users(where: $where){
          firstName
          age
          Products {
            name
            Cart {
              item_id
              user_id
            }
          }
        }
      }
    `;
    const variables = {
      where: {
        age: {
          eq: 20,
        },
      },
    };
    const result = await graphql({ query, variables });
    const compare = await findAll('User', {
      attributes: ['firstName', 'age'],
      include: [
        {
          attributes: ['name'],
          model: models.Product,
          through: {
            attributes: ['item_id', 'user_id'],
          },
        },
      ],
      where: { age: { [Op.eq]: 20 } },
    });
    expect(result.data.users).toEqual(compare);
  });
  test('belongs to many using union', async () => {
    const query = `
      query users($where: WhereUser) {
        users(where: $where) {
          firstName
          CartItems {
            __typename
            ... on Product {
              name
            }
            ... on Service {
              name
            }
          }
        }
      }
    `;
    const variables = {
      where: {
        age: {
          eq: 20,
        },
      },
    };
    const result = await graphql({ query, variables });
    const compare = await findAll('User', {
      attributes: ['firstName'],
      include: [
        {
          attributes: ['name'],
          model: models.Product,
        },
        {
          attributes: ['name'],
          model: models.Service,
        },
      ],
      where: { age: { [Op.eq]: 20 } },
    });
    expect(result.data.users).toEqual(
      compare.map((item) => {
        let CartItems = item.Products.map((product) => {
          return {
            __typename: 'Product',
            name: product.name,
          };
        });
        const services = item.Services.map((service) => {
          return {
            __typename: 'Service',
            name: service.name,
          };
        });
        CartItems = CartItems.concat(services);
        return {
          firstName: item.firstName,
          CartItems,
        };
      }),
    );
  });
});
