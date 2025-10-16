import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as PipelineController from "../controllers/PipelineController";

const pipelineRoutes = Router();

pipelineRoutes.get("/pipeline/stages", isAuth, PipelineController.getStages);
pipelineRoutes.get("/pipeline", isAuth, PipelineController.getPipeline);
pipelineRoutes.post("/pipeline/stages", isAuth, PipelineController.createStage);
pipelineRoutes.put("/pipeline/stages/:stageId", isAuth, PipelineController.updateStage);

export default pipelineRoutes;
