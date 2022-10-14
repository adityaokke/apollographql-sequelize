# apollographql-sequelize

apollographql-sequelize is a nodejs library for dealing with translation from graphql AST to sequlize option used on find query

## Installation


```bash
npm i apollographql-sequelize
```

## Usage
schema sample (more schema sample on [test file](https://github.com/adityaokke/apollographql-sequelize/blob/main/src/__tests__/resolver-helper.test.ts))
```javascript
#has many
query users($where: WhereUser, $order: [OrderUser], $cartsWhere2: WhereCart) {
  users(where: $where, order: $order) {
    firstName
    age
    Carts (where: $cartsWhere2) {
      user_id
      item_type
      item_id
    }
  }
}

{
  "where": {
    "age": {
      "eq": 20
    }
  },
  "order": [
    "AGE_ASC",
    "CARTS__ITEM_ID_DESC"
  ],
  "cartsWhere2": {
    "item_type": {
      "eq": "PRODUCT"
    }
  }
}
```

then on resolver use this code as a sample
```javascript
# resolver
const { GetOutput, AssociationToInclude, GetValidAttributes, ParseResolverArgsOrder, ParseResolverArgsWhere } = require('apollographql-sequelize');

sampleQuery(parent, args, context, info) {
    const opt = {};
    if (args.where) {
      opt.where = ParseResolverArgsWhere(args.where);
    }
    if (args.order) {
      opt.order = ParseResolverArgsOrder(model, args.order);
    }
    const output = GetOutput(info);
    opt.attributes = GetValidAttributes(model, output.attributes);
    if (output.associations) {
      opt.include = AssociationToInclude(model, output.associations);
    }
    sequelizeModel.findAll(opt)
}
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Reference
[https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c](https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c)
[https://levelup.gitconnected.com/getting-started-with-sequelize-cli-using-faker-824b3f4c4cfe](https://levelup.gitconnected.com/getting-started-with-sequelize-cli-using-faker-824b3f4c4cfe)

## License
[MIT](https://choosealicense.com/licenses/mit/)