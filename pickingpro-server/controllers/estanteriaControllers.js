const Estanteria = require("../models/estanteria");

module.exports.createEstanteria = async (req, res, next) => {
    try {
      const {  nombre, capacidad, token } = req.body;
      
      const estanteria = await Estanteria.create({
        nombre,
        capacidad,
        created_by: token
      })

      res
        .status(200)
        .json("Estanteria creada correctamente");
    } catch (err) {
      res.json(err);
    }
};

module.exports.getEstanterias = async (req, res, next) => {
    try {
      const estanterias = await Estanteria.find();

      res
        .status(200)
        .json(estanterias);
    } catch (err) {
      res.json(err);
    }
};