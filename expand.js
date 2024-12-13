const dotenv = require("dotenv");
dotenv.config();

// MongoDB
const { MongoClient, ServerApiVersion } = require("mongodb");
const client = new MongoClient(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const EXPAND_HEIGHT = 10;
const EXPAND_WIDTH = 10;

client.connect(async (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  const boardCollection = client.db("board").collection("pixels");
  const board = await boardCollection.findOne({ _id: "latestBoard" });

  let pixelArray;
  if (board) {
    pixelArray = board.pixelArray;
  }

  let oldWidth = pixelArray[0].length;

  console.log(`Current board height: ${pixelArray.length}`);
  console.log(`Current board width: ${pixelArray[0].length}`);

  for (let i = 0; i < EXPAND_HEIGHT; i += 1) {
    pixelArray.push(Array(oldWidth).fill(32));
  }

  for (let i = 0; i < pixelArray.length; i += 1) {
    pixelArray[i] = pixelArray[i].concat(Array(EXPAND_WIDTH).fill(32));
  }

  console.log(`New board height: ${pixelArray.length}`);
  console.log(`New board width: ${pixelArray[0].length}`);

  await boardCollection
    .updateOne(
      { _id: "latestBoard" },
      {
        $set: {
          _id: "latestBoard",
          pixelArray: pixelArray,
        },
      },
    )
    .then(async () => {
      console.log("Updated board");
    });

  client.close();
});
