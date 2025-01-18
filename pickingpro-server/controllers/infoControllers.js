const Store = await import("../models/store");
const Order = await import("../models/orden");
const axios = await import("axios");
const jwt = await import("jsonwebtoken");
const User = await import("../models/user");
const { getInfoByID } = await import("../middlewares/infoMiddleware");

export async function getUserData(req, res) {
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

export async function getUsersData(req, res) {
    try {
        let users = await User.find({
            active: 1,
        }).lean()

        res.json(users);
    } catch (error) {
        res.json({err: "Error has been ocurred"});
    }
}

export async function getStoreData(req, res) {
    try {
        const storeId = req.query;
        console.log("Traer Store info:", storeId);
        
        let storeInfo = await Store.findOne({ user_id: storeId.store_id }).lean();
        
        res.json(storeInfo);
    } catch (error) {
        res.json({err: "Error has been ocurred" + error});
    }
}

export async function getPedidosFromId(req, res) {
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


export async function getUserDataDashboard(req, res) {
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

export async function getShippingMethods(req, res) {
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