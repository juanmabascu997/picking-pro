const express = await import("express");
const router = express.Router();
const {
  getLabelToPrint,
  isBeingPackagedBy,
  connectTiendanube,
  getConnectedStores,
  handleWebhook,
  getProductsToPick,
  setProductsPicked,
  setNullPicked,
  getProductsToPack,
  reportProblem,
  packOrder,
  getOrdersWithProblem,
  solveProblem,
  getOrdersToShip,
  stopBeingPackaged,
  deleteStoreWebhoks
} = await import("../controllers/integrationControllers");

router.get("/", (req, res) => res.json({ message: "Inicio de API" }));

router.get("/connect", connectTiendanube);

router.get("/connected-stores", getConnectedStores);

router.delete("/delete-store", deleteStoreWebhoks);

router.get("/picking-products", getProductsToPick);

router.get("/set-picked-products", setProductsPicked);

router.get("/packing-products", getProductsToPack);

router.post("/is-being-package", isBeingPackagedBy);

router.post("/stop-being-package", stopBeingPackaged);

router.get("/label-print", getLabelToPrint);

router.post("/wh-order", handleWebhook);

router.post("/report-problem", reportProblem);

router.get("/orders-with-problem", getOrdersWithProblem);

router.post("/pack-order", packOrder);

router.post("/solve-problem", solveProblem);

router.get("/ship-orders", getOrdersToShip);

router.post("/null-picked", setNullPicked)

module.exports = router;
