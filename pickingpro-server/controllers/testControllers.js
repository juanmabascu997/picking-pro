const Order = require("../models/orden");

module.exports.getPedidosFromId = async (req, res) => {
    try {
        const myId = req.body.id;

        console.log(myId);

        let response = await Order.find({
            id: myId
        },
        {
            _id : 1, id: 1, shipping_status: 1
        }
        );

        res.json(response);
    }
    catch (err) {
        console.log(err);
    }
}


module.exports.getDuplicates = async (req, res) => {
    try {
        let comprobacion = await Order.aggregate([  
            {$group: {
                    _id: {id: "$id"},
                    uniqueIds: {$addToSet:{_id: "$_id", shipping_status: "$shipping_status"}},
                    count: {$sum: 1}
                }
            },
            {$match: { 
                count: {"$gt": 1}
                }
            }
        ])
        console.log(comprobacion.length);
        res.json("Se muestran los pedidos repetidos: ", comprobacion);
    }
    catch (err) {
        console.log(err);
    }
}


module.exports.clearDuplicates = async (req, res) => {
    try {
        let response = await Order.aggregate([  
            {$group: {
                    _id: {id: "$id"},
                    uniqueIds: {$addToSet:{_id: "$_id", shipping_status: "$shipping_status"}},
                    count: {$sum: 1}
                }
            },
            {$match: { 
                count: {"$gt": 1}
                }
            }
        ])

        response.forEach(pedido => {
            let flag = 0;
            pedido.uniqueIds.forEach(
                async (pedidoRepetido) => {
                    if (pedidoRepetido.shipping_status === "unpacked" && flag === 0) {
                        flag = 1;
                        return await Order.deleteOne({_id: pedidoRepetido._id})
                    } else {
                        return pedidoRepetido
                    }
                }
            )
        })
        res.json("Se realizo limpieza de repetidos!");
    }
    catch (err) {
        console.log(err);
    }
}