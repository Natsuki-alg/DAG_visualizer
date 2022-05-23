const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
});

module.exports = {
  devServer: {
    port: 8888,
    proxy: {
      "^/dag": {
        target: "http://localhost:3000",
      },
    },
  },
};
