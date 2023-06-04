const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { getInfoByID } = require("../middlewares/infoMiddleware");

module.exports.getUserData = async (req, res) => {
    try {
        const token = req.query.token;
        const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
        const userId = payload.id;

        let storeInfo = await Store.findOne({ user_id: body.store_id }).lean();
        usuarioInfo = await User.find(
            {
              _id: userId,
            },
        ).lean();

        res.json(usuarioInfo);
    } catch (error) {
        res.json({err: "Error has been ocurred"});
    }
}

module.exports.getUsersData = async (req, res) => {
    try {
        let users = await User.find({
            __v: 0
        }).lean()

        res.json(users);
    } catch (error) {
        res.json({err: "Error has been ocurred"});
    }
}

module.exports.getStoreData = async (req, res) => {
    try {
        const storeId = req.query;
        console.log("Traer Store info:", storeId);
        
        let storeInfo = await Store.findOne({ user_id: storeId.store_id }).lean();
        
        res.json(storeInfo);
    } catch (error) {
        res.json({err: "Error has been ocurred" + error});
    }
}

module.exports.getProductData = async (req, res) => {
    const myRequest = req.query;
    try {

        res.json({
            orders_to_pick,
            pending_orders,
            packed_orders_today
        });

    } catch (error) {
        res.json({err: "Error has been ocurred"});
    }
}


module.exports.getUserDataDashboard = async (req, res) => {
    try {
        const myUser = req.query.myUser;
        const findUserId = req.query.findUserId;

        const payload = jwt.verify(myUser, "my-secret-key"); //Obtengo ID del usuario conectado

        let usuarioInfo = await User.findById(payload.id).lean();

        if(!usuarioInfo.admin){ 
            res.json({err: "Se necesitan permisos de administrador!"})
        } else {
            let response = await getInfoByID(findUserId)
    
            res.json(response);
        }
    } catch (error) {
        res.json({err: "Error has been ocurred" + error});
    }
}