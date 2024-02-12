const fs = require("fs");
const bodyParser = require("body-parser");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

const server = jsonServer.create();
const database = JSON.parse(fs.readFileSync("./db.json", "utf-8"));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

const SECRET_KEY = "dd5f3089-40c3-403d-af14-d0c228b05cb4";
const expiresIn = "1h";

function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function isLoginAuthenticated({ email, password }) {
  return (
    database.users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
}

function isRegisterAuthenticated({ email }) {
  return database.users.findIndex((user) => user.email === email) !== -1;
}

function getUser({ email, password }) {
  let _database = _.cloneDeep(database);
  return (
    _database.users.filter((user) => user.email === email && user.password === password)
  )
}

server.post("/api/auth/register", (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  if (isRegisterAuthenticated({ email })) {
    const status = 401;
    const message = "Email already exist";
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile("./db.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }

    data = JSON.parse(data.toString());
    let lastIndex = data.users.length ? data.users[data.users.length - 1].id : 0;
    const payload = { id: lastIndex + 1, email: email, password: password, firstname: firstname, lastname: lastname };
    data.users.push(payload);

    fs.writeFile(
      "./db.json",
      JSON.stringify(data),
      (err, result) => {
        if (err) {
          const status = 401;
          const message = err;
          res.status(status).json({ status, message });
          return;
        }
      }
    );
  });

  const token = createToken({ email });
  res.status(200).json({ token, email, firstname, lastname });
});

server.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!isLoginAuthenticated({ email, password })) {
    const status = 401;
    const message = "Incorrect Email or Password";
    res.status(status).json({ status, message });
    return;
  }

  const user = getUser({ email, password });
  const token = createToken({ email });

  const payload = user[0];
  delete payload.password;

  res.status(200).json({
    token,
    ...payload
  });
});

server.listen(5050, () => {
  console.log("Running fake api json server for web app: 5050");
});
