const User = require("../models/user");
const jwt = require("jsonwebtoken");


module.exports.setPickingGoals = async (req, res, next) => {
    try {

        const myUser = req.query.token;
        const email = req.query.email;
    
        const payload = jwt.verify(myUser, "my-secret-key"); //Obtengo ID del usuario conectado
        let usuarioInfo = await User.findById(payload.id).lean();
        if(!usuarioInfo.admin){ 
            res.json({err: "Se necesitan permisos de administrador!"})
        } else {
            let response = await User.findOneAndUpdate({email: email},{pickingGoals: req.body.goals})
            res.json(response);
        }
    } catch (err) {
        console.log(err);
        res.json({err: "Error has been ocurred" + err});
    }
}

module.exports.setPackingGoals = async (req, res, next) => {
    try {
        const myUser = req.query.token;
        const email = req.query.email;
    
        const payload = jwt.verify(myUser, "my-secret-key"); //Obtengo ID del usuario conectado
        let usuarioInfo = await User.findById(payload.id).lean();

        if(!usuarioInfo.admin){ 
            res.json({err: "Se necesitan permisos de administrador!"})
        } else {
            let response = await User.findOneAndUpdate({email: email},{packingGoals: req.body.goals})
            res.json(response);
        }
    } catch (err) {
        console.log(err);
        res.json({err: "Error has been ocurred" + err});
    }
}


module.exports.getGoals = async (req, res, next) => {
    try {
        const email = req.query.email;
        let response = await User.findOne({email: email},{packingGoals: 1, pickingGoals: 1})
        res.json(response);
    } catch (err) {
        console.log(err);
        res.json({err: "Error has been ocurred" + err});
    }
}