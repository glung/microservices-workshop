import express, { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

const router = express.Router();
const authService = new AuthService();

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await authService.authenticateUserById(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

export default router;
