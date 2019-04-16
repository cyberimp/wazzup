module.exports = {
  parser: "babel-eslint",
  env: {
    "browser": true,
    "node": true,
    "es6": true
  },
  root: true,
  extends: "eslint:recommended",
  plugins: ["promise"],
  rules: {
    "no-console": "off",
    "max-lines-per-function": [ "error", { "max": 100, "skipComments": true, "skipBlankLines": true } ],
    "max-len": [ "error", { "code": 150, "ignoreStrings": true, "ignoreTemplateLiterals": true, "ignoreComments": true } ],
    "max-nested-callbacks": ["error", 3],
    "no-return-await": [ "error" ],
    "require-await": [ "error" ],
    "handle-callback-err": [ "error", "error" ],
    "no-throw-literal": [ "error" ],
    "prefer-promise-reject-errors": [ "error" ],
    "promise/no-return-wrap": "error",
    "promise/param-names": "error",
    "promise/no-native": "off",
    "promise/no-callback-in-promise": "warn",
    "promise/no-new-statics": "error",
    "promise/no-return-in-finally": "warn",
    "promise/valid-params": "warn"
  }
}
