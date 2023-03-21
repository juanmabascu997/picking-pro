const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

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


module.exports.getStoreData = async (req, res) => {
    try {
        const storeId = req.query.store_id;
        
        let storeInfo = await Store.findOne({ user_id: storeId }).lean();

        res.json(storeInfo);
    } catch (error) {
        res.json({err: "Error has been ocurred"});
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

