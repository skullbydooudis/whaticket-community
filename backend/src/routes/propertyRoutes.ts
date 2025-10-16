import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as PropertyController from "../controllers/PropertyController";

const propertyRoutes = Router();

propertyRoutes.get("/properties", isAuth, PropertyController.index);
propertyRoutes.post("/properties", isAuth, PropertyController.store);
propertyRoutes.get("/properties/:propertyId", isAuth, PropertyController.show);
propertyRoutes.get("/properties/:propertyId/analytics", isAuth, PropertyController.analytics);
propertyRoutes.put("/properties/:propertyId", isAuth, PropertyController.update);
propertyRoutes.delete("/properties/:propertyId", isAuth, PropertyController.remove);
propertyRoutes.get("/public/properties/:publicUrl", PropertyController.showByPublicUrl);

export default propertyRoutes;
