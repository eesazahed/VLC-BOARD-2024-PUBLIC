const { exec } = require("child_process");

// Load .env
const dotenv = require("dotenv");
dotenv.config();

// Express
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// Socket
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// JWT
const jwt = require("jsonwebtoken");

// Encrypt
const encrypt = require("./utils/encrypt");

// MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const client = new MongoClient(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const client2 = new MongoClient(process.env["MONGO_URI2"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let pixelArray, boardCollection;
const usersCollection = client.db("main").collection("users");
const placedCollection = client2.db("main").collection("placed");

const allowedUsers = [];

client.connect(async (err) => {
  if (err) {
    console.log(err);
    exec("kill 1");
    process.exit(1);
  }

  console.log("Connected to MongoDB");

  boardCollection = client.db("board").collection("pixels");

  const board = await boardCollection.findOne({ _id: "latestBoard" });

  try {
    pixelArray = board.pixelArray;
  } catch (err) {
    pixelArray = Array(50).fill(Array(50).fill(32));
    await boardCollection.updateOne(
      { _id: "latestBoard" },
      { $set: { _id: "latestBoard", pixelArray } },
      { upsert: true }
    );
  }
});

client2.connect();

const renderIndex = (req, res) => {
  if (!pixelArray) {
    // Retry render in 3s
    return setTimeout(() => {
      renderIndex(req, res);
    }, 3000);
  }
  res.render("board", {
    canvasHeight: pixelArray.length * 10,
    canvasWidth: pixelArray[0].length * 10,
  });
};

app.get("/", renderIndex);

const verifyjwt = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY);
  } catch {
    return null;
  }
};

app.post("/login", async (req, res) => {
  const data = req.body;

  const username = data.username.includes("@")
    ? data.username.split("@")[0].trim().toLowerCase()
    : data.username.trim().toLowerCase();
  const code = data.logincode;

  if (!username || !code) {
    return res.status(400).json({
      type: "error",
      message: "Login code is required.",
    });
  }

  try {
    const checkUser = await usersCollection.findOne({
      username: encrypt(username),
    });

    if (!checkUser) {
      return res
        .status(400)
        .json({ type: "error", message: "User does not exist." });
    }

    const realCode = checkUser.code;

    if (realCode !== encrypt(code)) {
      return res
        .status(400)
        .json({ type: "error", message: "Incorrect login code." });
    }

    const token = jwt.sign({ username }, String(process.env.JWT_KEY));

    let cooldown;

    if (!checkUser.cooldown) {
      cooldown = Date.now();

      await usersCollection.updateOne(
        { username: checkUser.username },
        { $set: { cooldown } }
      );
    } else {
      cooldown = checkUser.cooldown;
    }

    return res.status(200).json({
      type: "success",
      message: "Successfully logged in.",
      token,
      cooldown,
    });
  } catch {
    return res
      .status(500)
      .json({ type: "error", message: "Could not connect to database" });
  }
});

app.post("/createaccount", async (req, res) => {
  if (req.headers.authorization !== process.env.AUTH_KEY) {
    return res.status(401).json({ type: "error", message: "Unauthorized." });
  }

  const data = req.body;

  const username = encrypt(data.email.split("@")[0].trim().toLowerCase());
  const code = encrypt(data.code);

  const accountExists = await usersCollection.findOne({ username });

  if (accountExists) {
    return res.status(400).json({
      type: "error",
      message: "Account already exists.",
    });
  }

  await usersCollection.insertOne({
    username,
    code,
    creditBalance: 10,
  });

  return res
    .status(200)
    .json({ type: "success", message: "Successfully created account." });
});

app.post("/", async (req, res) => {
  let token = req.body.token;
  let user = null;

  try {
    if (!token) return res.status(405).send("Unauthorized.");

    const verified = verifyjwt(token);
    if (!verified) return res.status(405).send("Unauthorized.");

    user = await usersCollection.findOne({
      username: encrypt(verified.username),
    });

    if (!user) return res.status(405).send("Unauthorized.");

    user = { ...user, _id: user._id.toString() };
  } catch (err) {
    return res.status(405).send(err);
  }

  if (!user) return res.status(405).send("Please create an account.");

  let cooldown;

  if (!user.cooldown) {
    cooldown = Date.now();

    await usersCollection.updateOne(
      { username: user.username },
      { $set: { cooldown } }
    );
  } else {
    cooldown = user.cooldown;
  }

  res.send({ cooldown: cooldown });
});

app.post("/placepixel", async (req, res) => {
  const isCanvasDay = false; // Manually set

  if (pixelArray && isCanvasDay) {
    let token = req.body.token;
    let selectedX = req.body.selectedX;
    let selectedY = req.body.selectedY;
    let selectedColor = req.body.selectedColor;
    if (
      selectedX > pixelArray[0].length ||
      selectedY > pixelArray.length ||
      selectedX < 0 ||
      selectedY < 0
    ) {
    }
    if (!selectedColor) {
      return res.status(400).send("Please select a colour.");
    }
    let user = null;
    try {
      if (!token) return res.status(405).send("Unauthorized.");
      const verified = verifyjwt(token);
      if (!verified) return res.status(405).send("Unauthorized.");
      user = await usersCollection.findOne({
        username: encrypt(verified.username),
      });
      if (!user) return res.status(405).send("Unauthorized.");

      user = { ...user, _id: user._id.toString() };
    } catch (err) {
      return res.status(405).send(err);
    }
    let cooldown;
    if (user) {
      cooldown = user.cooldown;
    } else {
      return res.status(405).send("Not a registered user!");
    }
    if (cooldown < Date.now()) {
      cooldown = Date.now() + 11000;
      await usersCollection.updateOne(
        { username: user.username },
        { $set: { cooldown } }
      );

      try {
        if (cooldown < Date.now()) {
          pixelArray[selectedY][selectedX] = parseInt(selectedColor, 10);
          let newlog = `${
            verified.username
          } Placed pixel at ${selectedX}, ${selectedY} at ${Date.now()}`;
          await client2
            .db("main")
            .collection("logs")
            .insertOne({
              log: newlog,
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } catch (err) {
        return res.sendStatus(403);
      }

      res.send({ cooldown: cooldown });

      io.emit("pixelUpdate", {
        x: req.body.selectedX,
        y: req.body.selectedY,
        color: req.body.selectedColor,
        pixelArray: pixelArray,
        u: user._id,
      });

      let _id = `${selectedX}${selectedY}`;

      await placedCollection.updateOne(
        { _id },
        { $push: { p: { c: req.body.selectedColor, u: user._id } } },
        { upsert: true }
      );
    } else {
      return res.status(403).send({ cooldown: cooldown });
    }
  } else {
    return res.status(400).send("Canvas day is over.");
  }
});

app.get("/about", (req, res) => {
  res.redirect("https://en.wikipedia.org/wiki/R/place");
});

app.post("/user", async (req, res) => {
  const user = await usersCollection.findOne({ _id: ObjectId(req.body.id) });
  if (user) {
    res.json({ username: user.username });
  } else {
    res.json({});
  }
});

app.post("/pixel", async (req, res) => {
  const pixel = await placedCollection.findOne({
    _id: `${req.body.x}${req.body.y}`,
  });

  if (!pixel) {
    return res.sendStatus(404);
  }

  res.json(pixel.p[pixel.p.length - 1]);
});

const sendPixelArray = (socket) => {
  if (typeof pixelArray !== "undefined") {
    if (socket) {
      socket.emit("canvasUpdate", { pixelArray: pixelArray });
    }
  } else {
    setTimeout(() => {
      sendPixelArray(socket);
    }, 250);
  }
};

io.on("connection", sendPixelArray);

io.on("connection", (socket) => {
  socket.on("chat", async (msg) => {
    if (msg) {
      const msgContent = JSON.parse(msg);

      const token = msgContent.token;
      const textContent = msgContent.textContent;

      let username = null;

      try {
        if (!token) return null;
        const verified = verifyjwt(token);

        if (!verified) return null;

        user = await usersCollection.findOne({
          username: encrypt(verified.username),
        });
        if (!user) return null;
        username = verified.username;
      } catch (err) {
        console.log("cannot send");
        // return res.status(405).send(err);
      }

      if (username && textContent.trim().length > 0) {
        io.emit("chat", JSON.stringify({ sender: username, textContent }));
      }
    }
  });
});

setInterval(() => {
  if (pixelArray) {
    boardCollection.updateOne({ _id: "latestBoard" }, { $set: { pixelArray } });
  }
}, 5000);

server.listen(3000, () => {
  console.log("Listening on port 3000\nhttp://localhost:3000");
});
