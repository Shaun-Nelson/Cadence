const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const path = require("path");
const Auth = require("./utils/auth");
const { handleSpotifyCallback, spotifyApi } = require("./utils/spotify");

const { typeDefs, resolvers } = require("./schemas");
const db = require("./config/connection");

const PORT = process.env.REAC_APP_PORT || 3001;
const app = express();
//get the user info from the token
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.get("authorization") || "";
    console.log("TOKEN:", token);
    return {
      user: Auth.getUser(token.replace("Bearer ", "")),
      api: spotifyApi,
    };
  },
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.get("/callback", handleSpotifyCallback);

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app });

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(
        `Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

// Call the async function to start the server
startApolloServer();
