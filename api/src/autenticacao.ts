import "dotenv/config";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export const SEGREDO = (() => {
  const segredo = process.env.JWT_SEGREDO;
  if (!segredo || segredo.length < 32) {
    throw new Error("Configure JWT_SEGREDO no .env com pelo menos 32 caracteres.");
  }
  return segredo;
})();

export function exigirLogin(req: Request, res: Response, next: NextFunction): void {
  const cabecalho = req.get("authorization");
  const token = cabecalho?.startsWith("Bearer ") ? cabecalho.slice(7) : "";

  if (!token) {
    res.status(401).json({ erro: "Faça login para continuar." });
    return;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, SEGREDO, { algorithms: ["HS256"] });
  } catch (erro) {
    if (erro instanceof JsonWebTokenError) {
      res.status(401).json({ erro: "Faça login para continuar." });
      return;
    }
    next(erro);
    return;
  }

  if (
    typeof payload !== "object" ||
    typeof payload.id !== "number" ||
    !Number.isSafeInteger(payload.id) ||
    payload.id < 1
  ) {
    res.status(401).json({ erro: "Faça login para continuar." });
    return;
  }

  res.locals.usuarioId = payload.id;
  next();
}

export function usuarioDe(res: Response): number {
  const usuarioId: unknown = res.locals.usuarioId;
  if (typeof usuarioId !== "number" || !Number.isSafeInteger(usuarioId) || usuarioId < 1) {
    throw new Error("A requisição não contém um usuário autenticado.");
  }
  return usuarioId;
}
