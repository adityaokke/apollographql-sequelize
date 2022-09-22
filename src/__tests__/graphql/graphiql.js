const { ApolloServer } = require('apollo-server');

const typeDefs = require('./schemas');
const resolvers = require('./resolvers');
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

// to use this, change main value at package.json to  "src/__tests__/graphql/graphiql.js"
