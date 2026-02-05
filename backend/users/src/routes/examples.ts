import express, { Request, Response } from "express";
import { ExampleService } from "../services/ExampleService";

const router = express.Router();
const exampleService = new ExampleService();

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const examples = await exampleService.listExamples();
    res.json({ examples });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const example = await exampleService.getExample(id);
    if (!example) {
      res.status(404).json({ error: "Example not found" });
      return;
    }

    res.json({ example });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body as { name?: string };
    const example = await exampleService.createExample(name || "");
    res.status(201).json({ example });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const status = errorMessage === "Name is required" ? 400 : 500;
    res.status(status).json({ error: errorMessage });
  }
});

export default router;
