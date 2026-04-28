import express from "express";
import cors from "cors";
import { NODE_TYPES } from "@smart-document-pipeline/shared";
import { validatePipelineGraph } from "./validator.js";
import { savePipelineGraph } from "./pipelineRepository.js";

export function createApp(options = {}) {
  const app = express();
  const persistPipeline = options.persistPipeline || savePipelineGraph;

  app.use(cors());
  app.use(express.json());

  app.get("/api/node-types", (_, res) => {
    res.json({ nodeTypes: NODE_TYPES });
  });

  app.post("/api/pipelines", async (req, res) => {
    const payload = req.body || {};
    const validation = validatePipelineGraph(payload);

    if (!validation.valid) {
      return res.status(422).json({
        message: "Pipeline validation failed.",
        errors: validation.errors,
      });
    }

    try {
      const saved = await persistPipeline(payload);
      return res.status(200).json(saved);
    } catch (error) {
      return res.status(500).json({
        message: "Failed to save pipeline.",
      });
    }
  });

  return app;
}
