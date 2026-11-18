import "dotenv/config";
import bcrypt from "bcryptjs";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { exigirLogin, SEGREDO, usuarioDe } from "./autenticacao";
import { banco } from "./banco";
import type { Midia, NovaMidia, Status, Tipo } from "../../src/tipos";

interface LinhaMidia extends RowDataPacket {
  id: number;
  titulo: string;
  status: string;
  tipo: string;
  generos: string | null;
}

interface LinhaGenero extends RowDataPacket {
  id: number;
  nome: string;
}

interface LinhaUsuario extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
}

const app = express();
app.use(express.json());

const SELECT_MIDIAS = `
  SELECT
    M.Id AS id,
    M.Titulo AS titulo,
    M.Status AS status,
    M.Tipo AS tipo,
    GROUP_CONCAT(G.Nome ORDER BY G.Nome SEPARATOR ',') AS generos
  FROM Midias M
  LEFT JOIN MidiaGenero MG ON MG.MidiaId = M.Id
  LEFT JOIN Generos G ON G.Id = MG.GeneroId
`;

function mapearStatus(status: string): Status {
  switch (status.trim().toLocaleLowerCase("pt-BR")) {
    case "quero ver":
      return "quero ver";
    case "assistindo":
      return "assistindo";
    case "assisti":
      return "assisti";
    default:
      throw new Error(`Status inesperado no banco de dados: "${status}"`);
  }
}

function mapearTipo(tipo: string): Tipo {
  switch (tipo.trim().toLocaleLowerCase("pt-BR")) {
    case "filme":
      return "filme";
    case "série":
    case "serie":
      return "serie";
    default:
      throw new Error(`Tipo inesperado no banco de dados: "${tipo}"`);
  }
}

function mapearMidia(linha: LinhaMidia): Midia {
  return {
    id: linha.id,
    titulo: linha.titulo,
    status: mapearStatus(linha.status),
    tipo: mapearTipo(linha.tipo),
    tags: linha.generos ? linha.generos.split(",") : [],
  };
}

function statusDoBanco(status: Status): string {
  switch (status) {
    case "quero ver":
      return "Quero ver";
    case "assistindo":
      return "Assistindo";
    case "assisti":
      return "Assisti";
  }
}

function tipoDoBanco(tipo: Tipo): string {
  return tipo === "serie" ? "Série" : "Filme";
}

function validarNovaMidia(valor: unknown): { dados?: NovaMidia; erro?: string } {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    return { erro: "Envie os dados da mídia em formato JSON." };
  }

  const dados = valor as Record<string, unknown>;
  if (typeof dados.titulo !== "string" || dados.titulo.trim().length < 2 || dados.titulo.trim().length > 200) {
    return { erro: "O título deve ter entre 2 e 200 caracteres." };
  }
  if (
    dados.status !== "quero ver" &&
    dados.status !== "assistindo" &&
    dados.status !== "assisti"
  ) {
    return { erro: "Selecione um status válido." };
  }
  if (dados.tipo !== "filme" && dados.tipo !== "serie") {
    return { erro: "Selecione um tipo válido." };
  }
  if (
    dados.tags !== undefined &&
    (!Array.isArray(dados.tags) || !dados.tags.every((tag: unknown) => typeof tag === "string"))
  ) {
    return { erro: "A lista de gêneros é inválida." };
  }

  const tags = (dados.tags as string[] | undefined)?.map((tag) => tag.trim()) ?? [];
  if (tags.some((tag) => tag.length === 0) || new Set(tags).size !== tags.length) {
    return { erro: "Remova gêneros vazios ou repetidos." };
  }

  return {
    dados: {
      titulo: dados.titulo.trim(),
      status: dados.status,
      tipo: dados.tipo,
      tags,
    },
  };
}

function lerId(valor: string | string[]): number | undefined {
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) {
    return undefined;
  }
  const id = Number(valor);
  return Number.isSafeInteger(id) ? id : undefined;
}

function codigoDoErro(erro: unknown): string | undefined {
  if (typeof erro === "object" && erro !== null && "code" in erro && typeof erro.code === "string") {
    return erro.code;
  }
  return undefined;
}

function emailValido(valor: string): boolean {
  return [...valor].length <= 80 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

app.post("/api/usuarios", async (req, res) => {
  const dados = req.body as { nome?: unknown; email?: unknown; senha?: unknown } | undefined;
  if (
    typeof dados?.nome !== "string" ||
    [...dados.nome.trim()].length === 0 ||
    [...dados.nome.trim()].length > 80 ||
    typeof dados.email !== "string" ||
    !emailValido(dados.email.trim()) ||
    typeof dados.senha !== "string" ||
    [...dados.senha].length < 6 ||
    Buffer.byteLength(dados.senha, "utf8") > 72
  ) {
    res.status(400).json({
      erro: "Informe nome, e-mail válido e senha de 6 a 72 bytes. Nome e e-mail aceitam até 80 caracteres.",
    });
    return;
  }

  const nome = dados.nome.trim();
  const email = dados.email.trim().toLocaleLowerCase("pt-BR");
  const [existentes] = await banco.execute<RowDataPacket[]>(
    "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
    [email],
  );
  if (existentes.length > 0) {
    res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    return;
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);
  try {
    const [resultado] = await banco.execute<ResultSetHeader>(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senhaHash],
    );
    res.status(201).json({ id: resultado.insertId });
  } catch (erro) {
    if (codigoDoErro(erro) === "ER_DUP_ENTRY") {
      res.status(409).json({ erro: "Este e-mail já está cadastrado." });
      return;
    }
    throw erro;
  }
});

app.post("/api/login", async (req, res) => {
  const dados = req.body as { email?: unknown; senha?: unknown } | undefined;
  const email =
    typeof dados?.email === "string" ? dados.email.trim().toLocaleLowerCase("pt-BR") : "";
  const senha = typeof dados?.senha === "string" ? dados.senha : "";

  if (!emailValido(email) || Buffer.byteLength(senha, "utf8") > 72) {
    res.status(401).json({ erro: "E-mail ou senha inválidos." });
    return;
  }

  const [usuarios] = await banco.execute<LinhaUsuario[]>(
    "SELECT id, nome, email, senha AS senhaHash FROM usuarios WHERE email = ? ORDER BY id LIMIT 2",
    [email],
  );
  const usuario = usuarios.length === 1 ? usuarios[0] : undefined;
  if (!usuario || !senha || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    res.status(401).json({ erro: "E-mail ou senha inválidos." });
    return;
  }

  const token = jwt.sign({ id: usuario.id }, SEGREDO, { expiresIn: "8h" });
  res.json({ token, nome: usuario.nome });
});

app.get("/api/eu", exigirLogin, async (_req, res) => {
  const [usuarios] = await banco.execute<RowDataPacket[]>(
    "SELECT id, nome, email FROM usuarios WHERE id = ?",
    [usuarioDe(res)],
  );
  const usuario = usuarios[0];
  if (!usuario) {
    res.status(401).json({ erro: "Faça login para continuar." });
    return;
  }
  res.json(usuario);
});

app.get("/api/midias", exigirLogin, async (_req, res) => {
  try {
    const [linhas] = await banco.execute<LinhaMidia[]>(
      `${SELECT_MIDIAS}
      WHERE M.idUsuario = ?
      GROUP BY M.Id, M.Titulo, M.Status, M.Tipo
      ORDER BY M.Id`,
      [usuarioDe(res)],
    );
    res.json(linhas.map(mapearMidia));
  } catch (erro) {
    console.error("Erro ao consultar as mídias no MySQL:", erro);
    res.status(500).json({ erro: "Não foi possível carregar as mídias do banco." });
  }
});

app.get("/api/generos", async (_req, res) => {
  try {
    const [linhas] = await banco.execute<LinhaGenero[]>(
      "SELECT Id AS id, Nome AS nome FROM Generos ORDER BY Nome",
    );
    res.json(linhas);
  } catch (erro) {
    console.error("Erro ao consultar os gêneros no MySQL:", erro);
    res.status(500).json({ erro: "Não foi possível carregar os gêneros do banco." });
  }
});

app.get("/api/midias/:id", exigirLogin, async (req, res) => {
  const id = lerId(req.params.id);
  if (id === undefined) {
    res.status(400).json({ erro: "Informe um ID de mídia válido." });
    return;
  }

  try {
    const [linhas] = await banco.execute<LinhaMidia[]>(
      `${SELECT_MIDIAS}
      WHERE M.Id = ? AND M.idUsuario = ?
      GROUP BY M.Id, M.Titulo, M.Status, M.Tipo`,
      [id, usuarioDe(res)],
    );

    if (linhas.length === 0) {
      res.status(404).json({ erro: `Mídia #${id} não encontrada.` });
      return;
    }

    res.json(mapearMidia(linhas[0]));
  } catch (erro) {
    console.error(`Erro ao consultar a mídia #${id} no MySQL:`, erro);
    res.status(500).json({ erro: "Não foi possível carregar a mídia do banco." });
  }
});

app.post("/api/midias", exigirLogin, async (req, res) => {
  const validacao = validarNovaMidia(req.body);
  if (!validacao.dados) {
    res.status(400).json({ erro: validacao.erro });
    return;
  }

  const midia = validacao.dados;
  const conexao = await banco.getConnection();
  try {
    await conexao.beginTransaction();

    let generos: LinhaGenero[] = [];
    if (midia.tags.length > 0) {
      const placeholders = midia.tags.map(() => "?").join(", ");
      const [linhas] = await conexao.execute<LinhaGenero[]>(
        `SELECT Id AS id, Nome AS nome FROM Generos WHERE Nome IN (${placeholders})`,
        midia.tags,
      );
      generos = linhas;

      const encontrados = new Set(generos.map((genero) => genero.nome));
      const inexistente = midia.tags.find((nome) => !encontrados.has(nome));
      if (inexistente) {
        await conexao.rollback();
        res.status(400).json({ erro: `O gênero "${inexistente}" não existe.` });
        return;
      }
    }

    const [insercao] = await conexao.execute<ResultSetHeader>(
      "INSERT INTO Midias (Titulo, Status, Tipo, idUsuario) VALUES (?, ?, ?, ?)",
      [midia.titulo, statusDoBanco(midia.status), tipoDoBanco(midia.tipo), usuarioDe(res)],
    );

    for (const genero of generos) {
      await conexao.execute(
        "INSERT INTO MidiaGenero (MidiaId, GeneroId) VALUES (?, ?)",
        [insercao.insertId, genero.id],
      );
    }

    const [linhas] = await conexao.execute<LinhaMidia[]>(
      `${SELECT_MIDIAS}
      WHERE M.Id = ? AND M.idUsuario = ?
      GROUP BY M.Id, M.Titulo, M.Status, M.Tipo`,
      [insercao.insertId, usuarioDe(res)],
    );
    if (!linhas[0]) {
      throw new Error("A mídia foi inserida, mas não pôde ser consultada.");
    }

    const criada = mapearMidia(linhas[0]);
    await conexao.commit();
    res.status(201).json(criada);
  } catch (erro) {
    try {
      await conexao.rollback();
    } catch (erroRollback) {
      console.error("Erro ao desfazer o cadastro da mídia:", erroRollback);
    }
    throw erro;
  } finally {
    conexao.release();
  }
});

app.patch("/api/midias/:id/status", exigirLogin, async (req, res) => {
  const id = lerId(req.params.id);
  if (id === undefined) {
    res.status(400).json({ erro: "Informe um ID de mídia válido." });
    return;
  }

  const status = (req.body as { status?: unknown } | undefined)?.status;
  if (status !== "quero ver" && status !== "assistindo" && status !== "assisti") {
    res.status(400).json({ erro: "Selecione um status válido." });
    return;
  }

  try {
    const [resultado] = await banco.execute<ResultSetHeader>(
      "UPDATE Midias SET Status = ? WHERE Id = ? AND idUsuario = ?",
      [statusDoBanco(status), id, usuarioDe(res)],
    );

    if (resultado.affectedRows === 0) {
      const [linhas] = await banco.execute<LinhaMidia[]>(
        "SELECT Id AS id, Titulo AS titulo, Status AS status, Tipo AS tipo, NULL AS generos FROM Midias WHERE Id = ? AND idUsuario = ?",
        [id, usuarioDe(res)],
      );
      if (linhas.length === 0) {
        res.status(404).json({ erro: `Mídia #${id} não encontrada.` });
        return;
      }
    }

    res.status(204).end();
  } catch (erro) {
    console.error(`Erro ao atualizar o status da mídia #${id}:`, erro);
    res.status(500).json({ erro: "Não foi possível atualizar o status da mídia." });
  }
});

app.delete("/api/midias/:id", exigirLogin, async (req, res) => {
  const id = lerId(req.params.id);
  if (id === undefined) {
    res.status(400).json({ erro: "Informe um ID de mídia válido." });
    return;
  }

  const conexao = await banco.getConnection();
  try {
    await conexao.beginTransaction();
    const [midiasDoUsuario] = await conexao.execute<RowDataPacket[]>(
      "SELECT Id FROM Midias WHERE Id = ? AND idUsuario = ? FOR UPDATE",
      [id, usuarioDe(res)],
    );
    if (midiasDoUsuario.length === 0) {
      await conexao.rollback();
      res.status(404).json({ erro: `Mídia #${id} não encontrada.` });
      return;
    }

    await conexao.execute("DELETE FROM MidiaGenero WHERE MidiaId = ?", [id]);
    const [resultado] = await conexao.execute<ResultSetHeader>(
      "DELETE FROM Midias WHERE Id = ? AND idUsuario = ?",
      [id, usuarioDe(res)],
    );

    if (resultado.affectedRows === 0) {
      await conexao.rollback();
      res.status(404).json({ erro: `Mídia #${id} não encontrada.` });
      return;
    }

    await conexao.commit();
    res.status(204).end();
  } catch (erro) {
    try {
      await conexao.rollback();
    } catch (erroRollback) {
      console.error(`Erro ao desfazer a remoção da mídia #${id}:`, erroRollback);
    }
    throw erro;
  } finally {
    conexao.release();
  }
});

app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Erro inesperado na API:", erro);
  const status =
    typeof erro === "object" &&
    erro !== null &&
    "status" in erro &&
    erro.status === 400
      ? 400
      : 500;
  res.status(status).json({
    erro: status === 400 ? "O corpo da requisição não contém JSON válido." : "Ocorreu um erro interno.",
  });
});

const porta = Number(process.env.API_PORT ?? 3000);
if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error("API_PORT deve ser uma porta válida entre 1 e 65535.");
}

app.listen(porta, () => {
  console.log(`API do catálogo disponível em http://localhost:${porta}`);
});
