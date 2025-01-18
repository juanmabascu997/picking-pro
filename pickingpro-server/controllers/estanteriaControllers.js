const Estanteria = await import("../models/estanteria");

export async function createEstanteria(req, res, next) {
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
}

export async function getEstanterias(req, res, next) {
    try {
      const estanterias = await Estanteria.find();

      res
        .status(200)
        .json(estanterias);
    } catch (err) {
      res.json(err);
    }
}