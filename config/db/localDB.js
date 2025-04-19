const mongoose = require("mongoose");
async function ConnectToLocalDB() {
  try {
    await mongoose.connect(process.env.MONGO_LOCAL_URI);
    console.log("Connected to Local DB successfully");
  } catch (error) {
    console.log(`Failed to connect to MongoDB: ${error}`);
  }
}

async function ConnectToOnlineDB() {
  try {
    await mongoose.connect(
      "mongodb://publicUserName:publicUserName@ac-4hoisbi-shard-00-00.6vrrysl.mongodb.net:27017,ac-4hoisbi-shard-00-01.6vrrysl.mongodb.net:27017,ac-4hoisbi-shard-00-02.6vrrysl.mongodb.net:27017/?replicaSet=atlas-h6vm8t-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Connected to Online DB successfully");
  } catch (error) {
    console.log(`Failed to connect to MongoDB: ${error}`);
  }
};

// old way

// mongoose
//     .connect(process.env.MONGO_URI)
//     .then(() => {
//       console.log("Connected to Local DB successfully");
//     })
//     .catch((error) => {
//       console.log(`Failed to connect to MongoDB: ${error}`);
//     });

module.exports = {ConnectToLocalDB, ConnectToOnlineDB};
