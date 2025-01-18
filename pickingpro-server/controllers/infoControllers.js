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
            active: 1,
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

module.exports.getPedidosFromId = async (req, res) => {
    try {
        const myUser = req.query.myUser;
        const pedidoId = req.query.pedidoId;
        
        const payload = jwt.verify(myUser, "my-secret-key"); //Obtengo ID del usuario conectado

        let usuarioInfo = await User.findById(payload.id).lean();

        if(!usuarioInfo.admin){ 
            res.json({err: "Se necesitan permisos de administrador!"})
        } else {
            let response = await Order.find({
                    id: pedidoId
                }
            );
            res.json(response);
        }
    }
    catch (err) {
        console.log(err);
    }
}


module.exports.getUserDataDashboard = async (req, res) => {
    try {
        const myUser = req.query.myUser;
        const findUserId = req.query.findUserId;
        const primeraFecha = req.query.primeraFecha;
        const segundaFecha = req.query.segundaFecha;

        const payload = jwt.verify(myUser, "my-secret-key"); //Obtengo ID del usuario conectado

        let usuarioInfo = await User.findById(payload.id).lean();

        if(!usuarioInfo.admin){ 
            res.json({err: "Se necesitan permisos de administrador!"})
        } else {
            let response = await getInfoByID(findUserId, primeraFecha, segundaFecha)
    
            res.json(response);
        }
    } catch (error) {
        res.json({err: "Error has been ocurred" + error});
    }
}
function removeDuplicates(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}

module.exports.getShippingMethods = async (req, res) => {
    try {  
        let methods = [];
        
        let response = await Order.find(
            {
                shipping_option: {$nin: ['Retiras en RETIRO LOCAL RAMOS MEJIA']}
            },
            {
                shipping_option: 1,
            }).lean();

        response.map((i)=>( methods.push(i.shipping_option)));

        methods = removeDuplicates(methods);


        res.json(methods);
    } catch (error) {
        res.json({err: "Error has been ocurred" + error});
    }
}