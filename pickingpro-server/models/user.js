const mongoose = await import("mongoose");
const Schema = mongoose.Schema;
const bcrypt = await import("bcrypt");

const userSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is Required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is Required"],
  },
  userValid: {
    type: Boolean,
    default: false,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  pickingGoals: {
    type: Number,
    default: 0,
  },
  packingGoals: {
    type: Number,
    default: 0,
  }
});

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("incorrect password");
  }
  throw Error("incorrect email");
};

const User = mongoose.model("User", userSchema, "users");

module.exports = User;
