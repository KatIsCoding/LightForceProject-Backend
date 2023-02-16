import { Express, Request, Response, NextFunction } from "express";
import ServerService from "./server.service";
import { z, AnyZodObject } from "zod";
import {
  LoginSchema,
  StartGameSchema,
  BuyTokensSchema,
  UpdateScoreSchema,
} from "./schemas";

const schemaValidator = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        //query: req.query,
        //params: req.params,
      });
      return next();
    } catch (e) {
      return res.status(400).json(e);
    }
  };
};

export default function Router(app: Express) {
  const serverService = new ServerService();

  // Login route
  app.post("/login", schemaValidator(LoginSchema), serverService.login);

  //Start Game Route
  app.post(
    "/startGame",
    schemaValidator(StartGameSchema),
    serverService.startGame
  );

  //Buy Tokens Route
  app.post(
    "/buyTokens",
    schemaValidator(BuyTokensSchema),
    serverService.buyTokens
  );

  // Get games and prices
  app.get("/getPrices", serverService.getPrices);

  // Update scores
  app.post(
    "/newScore",
    schemaValidator(UpdateScoreSchema),
    serverService.updateScore
  );

  // Get highscores
  app.get("/getHighscores", serverService.getHighscores);
}
