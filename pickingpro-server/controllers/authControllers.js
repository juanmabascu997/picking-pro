const User = require("../models/user");
const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60;

const createToken = (id) => {
  return jwt.sign({ id }, "my-secret-key", {
    expiresIn: maxAge,
  });
};

const handleErrors = (err) => {
  let errors = { email: "", password: "" };

  console.log(err);
  if (err.message === "incorrect email") {
    errors.email = "That email is not registered";
  }

  if (err.message === "incorrect password") {
    errors.password = "That password is incorrect";
  }

  if (err.code === 11000) {
    errors.email = "Email is already registered";
    return errors;
  }

  if (err.message.includes("Users validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

module.exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const user = await User.create({ name, email, password });
    const token = createToken(user._id); //Creo el token jwt

    res
      .status(201)
      .json({ user: user._id, created: true, token: token, name, email });
  } catch (err) {
    console.log(err);
    const errors = handleErrors(err);
    res.json({ errors, created: false });
  }
};

module.exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);

    res
      .status(200)
      .json({
        user: user._id,
        created: true,
        token: token,
        name: user.name,
        email: user.email,
        valid: user.userValid,
        admin: user.admin,
      });
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
};


module.exports.validateUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);

        if(user.admin) {
            User.findOneAndUpdate({ email: email },{ userValid: true })
                .then(
                    () => {
                        console.log('User validado');
                    }
                ).catch(
                    (error) => {
                        console.log(error);
                    }
                );           
            res.status(200).json("Usuario validado");
        } else {
            res.status(400).json("Usuario no validado. Falta permiso de administrador.");
        }
    } catch (err) {
      const errors = handleErrors(err);
      res.json({ errors, status: false });
    }
};
