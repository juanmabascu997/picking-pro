const Order = require("../models/orden");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

//PARA PROBAR: Metodo para cuando se guarda un cambio en el schema. Para evitar duplicados.

// schema.pre('save', function(next) {
//     if (foo()) {
//       console.log('calling next!');
//       // `return next();` will make sure the rest of this function doesn't run
//       /* return */ next();
//     }
//     // Unless you comment out the `return` above, 'after next' will print
//     console.log('after next');
//   });

async function duplicados(id, _id) {
  try {
    let lastTest = await Order.find(
      {
        id: id,
      },
      {
        _id: 1,
        id: 1,
        shipping_status: 1,
      }
    );
    if (lastTest.length > 1) {
      await Order.deleteOne({ _id: _id }).then(() => {
        console.log("Se corrige en duplicados Function. Id: " + id);
      });
      return true;
    }
    return false;
  } catch (err) {
    console.log("Error en duplicidad ", err);
    return false;
  }
}

module.exports.getProductsToPick = async (req, res) => {
  try {
    const pedidos = req.query.pedidos;
    const tiendas = req.query.filtrosTiendas;
    const tiposDeEnvios = req.query.filtrosEnvios;

    const token = req.query.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;
    var productsToPick = [];
    let ordersDB = {};
    var tiendas_ids = null;

    let usuarioInfo = await User.find({
      _id: userId,
    }).lean();

    //Chekeo si el usuario tiene pedidos pickeados, sin empaquetar, sin problemas
    ordersDB = await Order.find(
      {
        payment_status: "paid",
        order_picked: false,
        order_packed: false,
        shipping_status: "unpacked",
        order_problem: null,
        order_asigned_to: userId,
        order_asigned_to_name: usuarioInfo.name,
        shipping_option: { $nin: ["Retiras en RETIRO LOCAL RAMOS MEJIA"] },
      },
      {
        products: 1,
        id: 1,
        number: 1,
      }
    ).lean();

    if (!ordersDB.length) {
      //Si no los tiene, le asigno nuevos
      console.log("No products picked yet by user", userId);

      if (tiendas) {
        if (tiendas.length > 0) {
          tiendas_ids = tiendas.map((tienda) => {
            return parseInt(tienda.user_id, 10);
          });
        }
      }

      ordersDB = await Order.find(
        {
          store_id: tiendas_ids ? { $in: [...tiendas_ids] } : { $ne: null },
          payment_status: "paid",
          order_picked: false,
          order_packed: false,
          shipping_status: "unpacked",
          order_problem: null,
          order_picked_for: null,
          order_asigned_to: null,
          shipping_option: tiposDeEnvios
            ? {
                $in: [...tiposDeEnvios],
                $nin: ["Retiras en RETIRO LOCAL RAMOS MEJIA"],
              }
            : { $nin: ["Retiras en RETIRO LOCAL RAMOS MEJIA"] },
        },
        {
          products: 1,
          id: 1,
          number: 1,
        },
        {
          limit: pedidos,
        }
      ).lean();
    }

    if (!ordersDB.length)
      //Si no hay pedidos para empaquetar, respondo
      res.status(200).json([]);
    else {
      for (var i = 0; i < ordersDB.length; i++) {
        //Creo my array de objetos válidos

        let res = await duplicados(ordersDB[i].id, ordersDB[i]._id);
        if (res) {
          //Filtro mi elemento duplicado de mi arreglo
          ordersDB = ordersDB.filter((e) => e.id !== ordersDB[i].id);
        } else {
          for (var j = 0; j < ordersDB[i].products.length; j++) {
            //Busco por variante!! Si no se solapan variantes.
            const pos = productsToPick.findIndex(
              (product) =>
                product.product_id ==
                  parseInt(ordersDB[i].products[j].product_id) &&
                product.variant_id ==
                  parseInt(ordersDB[i].products[j].variant_id)
            );
            if (pos == -1) {
              const data = {
                product_id: ordersDB[i].products[j].product_id,
                name: ordersDB[i].products[j].name,
                image_link: ordersDB[i].products[j].image.src,
                quantity: parseInt(ordersDB[i].products[j].quantity),
                variant_id: parseInt(ordersDB[i].products[j].variant_id),
                sku: ordersDB[i].products[j].sku,
                barcode: ordersDB[i].products[j].barcode,
                id: [ordersDB[i].id],
              };
              productsToPick.push(data);
            } else {
              productsToPick[pos].id.push(ordersDB[i].id);
              productsToPick[pos].quantity += parseInt(
                ordersDB[i].products[j].quantity
              );
            }
          }
        }
      }

      for (let i = 0; i < ordersDB.length; i++) {
        //Updateo mi database con la data del usuario
        let usuarioInfo = await User.find({
          _id: userId,
        }).lean();

        const result = await Order.findOneAndUpdate(
          { id: ordersDB[i].id },
          {
            order_picked: false,
            order_asigned_to: userId,
            order_asigned_to_name: usuarioInfo.name,
            picked_at: new Date().toISOString(),
          }
        );
      }

      res.status(200).json(productsToPick);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: error,
    });
  }
};

module.exports.setProductsPicked = async (req, res) => {
  try {
    const myProducts = req.query.products;
    const token = req.query.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;

    console.log("Post productos pickeados: ", myProducts);
    for (let i = 0; i < myProducts.length; i++) {
      //Updateo mi database con la data del usuario
      const result = await Order.findOneAndUpdate(
        { id: Number(myProducts[i]) },
        {
          order_picked: true,
          order_asigned_to: null,
          order_asigned_to_name: null,
          order_picked_for: userId,
          picked_at: new Date().toISOString(),
        }
      );
    }

    res.status(200).json("Exito!");
  } catch (error) {
    res.status(400).json({
      error: error,
    });
  }
};

module.exports.cancelProductsForPick = async (req, res) => {
  try {
    const token = req.query.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;

    console.log("Cancel product for pick");

    console.log(userId);

    let ordersDB = await Order.find(
      {
        payment_status: "paid",
        shipping_status: "unpacked",
        order_problem: null,
        order_asigned_to: userId,
        order_picked: false,
        order_packed: false,
        order_asigned_to_name: payload.name,
      },
      {
        id: 1,
      }
    ).lean();

    for (let i = 0; i < ordersDB.length; i++) {
      //Updateo mi database con la data del usuario
      const result = await Order.findOneAndUpdate(
        { id: Number(ordersDB[i].id) },
        {
          order_packed: false,
          order_picked: false,
          order_asigned_to: null,
          order_asigned_to_name: null,
        },
        { returnOriginal: false }
      );
    }

    res.status(200).json("Exito!");
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: error,
    });
  }
};

module.exports.getProductsToPickByMatch = async (req, res) => {
  try {
    const pedidos = req.query.pedidos;
    let totalOrders = [];
    var productsToPick = [];

    const token = req.query.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;

    let usuarioInfo = await User.find({
      _id: userId,
    }).lean();

    let orden = await Order.find(
      {
        payment_status: "paid",
        order_picked: false,
        order_packed: false,
        shipping_status: "unpacked",
        order_problem: null,
        order_asigned_to: userId,
        order_asigned_to_name: usuarioInfo.name,
        shipping_option: { $nin: ["Retiras en RETIRO LOCAL RAMOS MEJIA"] },
      },
      {
        products: 1,
        id: 1,
        number: 1,
      }
    ).lean();

    if (!orden.length > 0) {
      //Si tiene asignados, le envio los que ya tiene + los que solicite para completar cupo
      orden = await Order.find(
        {
          payment_status: "paid",
          order_picked: false,
          order_packed: false,
          shipping_status: "unpacked",
          order_problem: null,
          order_picked_for: null,
          order_asigned_to: null,
          shipping_option: { $nin: ["Retiras en RETIRO LOCAL RAMOS MEJIA"] },
        },
        {
          products: 1,
          id: 1,
          number: 1,
        },
        {
          limit: pedidos,
        }
      ).lean();
    }

    if (!orden.length) {
      res.status(200).json([]);
    } else {
      let flag = true;
      let i = 0;

      while (totalOrders.length < pedidos && flag) {
        for (let j = 0; j < orden[i].products.length && flag; j++) {
          let productoId = orden[i].products[j].product_id;

          let masOrdenes = await Order.find(
            {
              payment_status: "paid",
              order_picked: false,
              order_packed: false,
              shipping_status: "unpacked",
              order_problem: null,
              order_picked_for: null,
              order_asigned_to: null,
              shipping_option: {
                $nin: ["Retiras en RETIRO LOCAL RAMOS MEJIA"],
              },
              products: { $elemMatch: { product_id: productoId } },
            },
            {
              products: 1,
              id: 1,
              number: 1,
            },
            {
              limit: pedidos,
            }
          ).lean();
          totalOrders.push(...masOrdenes);
          i++;
          if (totalOrders.length >= pedidos) {
            flag = false;
          }
        }
      }
    }
    if (totalOrders.length > pedidos) {
      totalOrders = totalOrders.slice(0, pedidos);
    }
    for (let i = 0; i < totalOrders.length; i++) {
      for (var j = 0; j < totalOrders[i].products.length; j++) {
        //Busco por variante!! Si no se solapan variantes.
        const pos = productsToPick.findIndex(
          (product) =>
            product.product_id ==
              parseInt(totalOrders[i].products[j].product_id) &&
            product.variant_id ==
              parseInt(totalOrders[i].products[j].variant_id)
        );
        if (pos == -1) {
          const data = {
            product_id: totalOrders[i].products[j].product_id,
            name: totalOrders[i].products[j].name,
            image_link: totalOrders[i].products[j].image.src,
            quantity: parseInt(totalOrders[i].products[j].quantity),
            variant_id: parseInt(totalOrders[i].products[j].variant_id),
            sku: totalOrders[i].products[j].sku,
            barcode: totalOrders[i].products[j].barcode,
            id: [totalOrders[i].id],
          };
          productsToPick.push(data);
        } else {
          productsToPick[pos].id.push(totalOrders[i].id);
          productsToPick[pos].quantity += parseInt(
            totalOrders[i].products[j].quantity
          );
        }
      }
    }

    for (let i = 0; i < totalOrders.length; i++) {
      //Updateo mi database con la data del usuario
      let usuarioInfo = await User.find({
        _id: userId,
      }).lean();

      const result = await Order.findOneAndUpdate(
        { id: totalOrders[i].id },
        {
          order_picked: false,
          order_asigned_to: userId,
          order_asigned_to_name: usuarioInfo.name,
          picked_at: new Date().toISOString(),
        }
      );
    }

    console.log(totalOrders.length);
    res.status(200).json(productsToPick);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: error,
    });
  }
};
