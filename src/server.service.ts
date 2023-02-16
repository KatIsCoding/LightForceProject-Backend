import { Request, Response } from "express";
import { UserDataSchema, UserDataType, LedgeType } from "./schemas";
import gamesInfo from "./games.json";

type UserName = string;

enum PossibleActions {
  PLAY_GAME,
  BUY_TOKENS,
}

const DEFAULT_GAME = {
  id: -1,
  cost: 0,
};

export default class ServerService {
  // Data does not need to be persistent, using a map instead of an object due to its advantages on constant key addition/removal
  usersMap = new Map<UserName, UserDataType>();

  private calculateTokensBasedOnLedge = async (ledge: LedgeType[]) => {
    return ledge.reduce((prev, next) => {
      prev += next.credit;
      prev -= next.debit;
      return prev;
    }, 0);
  };

  private updateLedgeAndTokens = async ({
    userObject,
    action,
    gameSelected,
    tokens,
  }: {
    userObject: UserDataType;
    action: PossibleActions;
    gameSelected: typeof gamesInfo[0];
    tokens: number;
  }) => {
    switch (action) {
      case PossibleActions.PLAY_GAME:
        userObject.ledge.push({
          description: "Played a game",
          debit: gameSelected.cost,
          credit: 0,
        });
        break;
      case PossibleActions.BUY_TOKENS:
        userObject.ledge.push({
          description: `Bought ${tokens} tokens`,
          debit: 0,
          credit: tokens,
        });
        break;
    }
    userObject.tokens = await this.calculateTokensBasedOnLedge(
      userObject.ledge
    );
    this.usersMap.set(userObject.username, userObject);
    return userObject;
  };

  private findUser = (username: string) => {
    if (!this.usersMap.has(username)) {
      return false;
    }

    // Had to use the TS (!) operator since ts limitations for keeping track of map state
    return this.usersMap.get(username)!;
  };

  private generateHighscores = () => {
    const highscores: [string, number][] = [];
    this.usersMap.forEach(({ scores }, key) => {
      highscores.push([key, scores[0] || 0]);
    });

    highscores.sort((a, b) => b[1] - a[1]);
    return highscores;
  };

  getPrices = async (req: Request, res: Response) => {
    res.json(gamesInfo[0]); // Possible in the future when multiple games exist, return all of them
  };

  // The reason for using arrow keys as class members is because they bind themselves to `this` automatically
  login = async (req: Request, res: Response) => {
    const {
      body: { username },
    } = req;
    if (this.usersMap.has(username)) {
      return res.json(this.usersMap.get(username));
    } else {
      /*
      Using a schema validator to generate a brand new object, the alternative and "manual" way of doing this is:
      this.usersMap.set(username, {username, tokens: 0, ledge: []})
      */
      this.usersMap.set(username, UserDataSchema.parse({ username }));
    }
    res.send(this.usersMap.get(username));
  };

  startGame = async (req: Request, res: Response) => {
    const {
      body: { username, gameId },
    } = req;

    const userObject = this.findUser(username);

    if (!userObject) {
      return res.status(400).json({ error: "User not found", playable: false });
    }

    // In case it doesn't find the desired game, it means it hasn't been implemented, in which case just return a default
    const gameSelected =
      gamesInfo.find((game) => game.id === gameId) || DEFAULT_GAME;

    if (userObject.tokens < gameSelected.cost) {
      return res
        .status(400)
        .json({ error: "Not enough credits", playable: false });
    }

    const newState = await this.updateLedgeAndTokens({
      userObject,
      action: PossibleActions.PLAY_GAME,
      gameSelected,
      tokens: 0,
    });

    res.json({ userData: newState, playable: true });
  };

  buyTokens = async (req: Request, res: Response) => {
    const {
      body: { username, tokens },
    } = req;
    const userObject = this.findUser(username);

    if (!userObject) {
      return res
        .status(400)
        .json({ error: "User doesn't exist", bought: false });
    }

    const newState = await this.updateLedgeAndTokens({
      userObject,
      action: PossibleActions.BUY_TOKENS,
      tokens,
      gameSelected: DEFAULT_GAME,
    });

    res.json(newState);
  };

  updateScore = async (req: Request, res: Response) => {
    const {
      body: { username, score },
    } = req;

    const userObject = this.findUser(username);

    if (!userObject) {
      return res.status(404).json({ error: "User Not found" });
    }

    userObject.scores.push(score);
    userObject.scores.sort((a, b) => b - a);
    this.usersMap.set(username, userObject);
    return res.json(this.generateHighscores());
  };

  getHighscores = async (req: Request, res: Response) => {
    return res.json(this.generateHighscores());
  };
}
