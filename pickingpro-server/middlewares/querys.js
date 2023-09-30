module.exports.resetGoals = async (User) => {
  async function run() {
    try {
      const filter = {};
      // Create an update document specifying the change to make
      const updateDoc = {
        $set: {
            pickingGoals: 0,
            packingGoals: 0
        }
      };
      // Update the documents that match the specified filter
      const result = await User.updateMany(filter, updateDoc);
      console.log(`Updated ${result.modifiedCount} documents`);
    } finally {
      // Close the database connection on completion or error
    }
}
run().catch(console.dir);
}