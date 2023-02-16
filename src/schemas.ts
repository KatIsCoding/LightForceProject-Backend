import { z } from "zod";

export const LoginSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: "Please provide a valid username",
    }),
  }),
});

export const LedgeSchema = z.object({
  description: z.string(),
  debit: z.number(),
  credit: z.number(),
});

export const UserDataSchema = z.object({
  username: z.string().default(""),
  tokens: z.number().default(0),
  ledge: z.array(LedgeSchema).default([]),
  scores: z.array(z.number()).default([]),
});

export const StartGameSchema = z.object({
  body: z.object({
    username: z.string(),
    gameId: z.number(),
  }),
});

export const BuyTokensSchema = z.object({
  body: z.object({
    username: z.string(),
    tokens: z.number(),
  }),
});

export const UpdateScoreSchema = z.object({
  body: z.object({
    username: z.string(),
    score: z.number(),
  }),
});

export type UserDataType = z.infer<typeof UserDataSchema>;
export type LedgeType = z.infer<typeof LedgeSchema>;
