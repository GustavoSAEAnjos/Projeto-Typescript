import "dotenv/config";
import express from "express";
import type { RowDataPacket } from "mysql2";
import { banco } from "./banco";
import type { Midia, Status, Tipo } from "../../src/tipos";

interface LinhaMidia extends RowDataPacket {
  id: number;
  titulo: string;
  status: string;
  tipo: string;
  generos: string | null;
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

app.get("/api/midias", async (_req, res) => {
  try {
    const [linhas] = await banco.execute<LinhaMidia[]>(
      `${SELECT_MIDIAS}
      GROUP BY M.Id, M.Titulo, M.Status, M.Tipo
      ORDER BY M.Id`,
    );
    res.json(linhas.map(mapearMidia));
  } catch (erro) {
    console.error("Erro ao consultar as mídias no MySQL:", erro);
    res.status(500).json({ erro: "Não foi possível carregar as mídias do banco." });
  }
});

app.get("/api/midias/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ erro: "Informe um ID de mídia válido." });
    return;
  }

  try {
    const [linhas] = await banco.execute<LinhaMidia[]>(
      `${SELECT_MIDIAS}
      WHERE M.Id = ?
      GROUP BY M.Id, M.Titulo, M.Status, M.Tipo`,
      [id],
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

const porta = Number(process.env.API_PORT ?? 3000);
if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error("API_PORT deve ser uma porta válida entre 1 e 65535.");
}

app.listen(porta, () => {
  console.log(`API do catálogo disponível em http://localhost:${porta}`);
});
