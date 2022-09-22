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

{
  "where": {
    "age": {
      "eq": 20
    }
  }
}
```

then on resolver use this code as a sample
```javascript
# resolver
const { GetOutput, AssociationToInclude, GetValidAttributes, ParseResolverArgsOrder, ParseResolverArgsWhere } = require('../../../lib/index');

sampleQuery(parent, args, context, info) {
    const opt = {};
    if (args.where) {
      opt.where = ParseResolverArgsWhere(args.where);
    }
    if (args.order) {
      opt.order = ParseResolverArgsOrder(args.order);
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

## License
[MIT](https://choosealicense.com/licenses/mit/)