const { ApolloServer } = require('apollo-server-express');

const typeDefs = require('./schemas');
const resolvers = require('./resolvers');

// For clarity in this example we included our typeDefs and resolvers above our test,
// but in a real world situation you'd be importing these in from different files
const testServer = new ApolloServer({
  typeDefs,
  resolvers,
});

module.exports = {
  graphql({ query, variables }) {
    // Run the GraphQL query
    return testServer.executeOperation({
      query,
      variables,
    });
  },
};
