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
        let response = await Order.aggregate([  
            {$group: {
                _id: {id: "$id"},
                uniqueIds: {$addToSet: "$_id"},
                count: {$sum: 1}
                }
            },
            {$match: { 
                count: {"$gt": 1}
                }
            }
        ])
        // .forEach(async function(doc) {
        //     let unico = await Order.find({
        //         _id: doc.uniqueIds[0],
        //         next_action: 
        //     });

        // })
        res.json(response);
    }
    catch (err) {
        console.log(err);
    }
}
