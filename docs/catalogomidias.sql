DROP DATABASE IF EXISTS catalogomidias;
CREATE DATABASE catalogomidias
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE catalogomidias;

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(80) NOT NULL,
  senha TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Midias (
  Id INT NOT NULL AUTO_INCREMENT,
  Titulo VARCHAR(200) NOT NULL,
  Status VARCHAR(20) NOT NULL,
  Tipo VARCHAR(10) NOT NULL,
  idUsuario INT NOT NULL,
  PRIMARY KEY (Id),
  CONSTRAINT chk_midias_status CHECK (Status IN ('Quero ver', 'Assistindo', 'Assisti')),
  CONSTRAINT chk_midias_tipo CHECK (Tipo IN ('Filme', 'Série')),
  CONSTRAINT conexcao_tabelas_midias_usuarios
    FOREIGN KEY (idUsuario) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Generos (
  Id INT NOT NULL AUTO_INCREMENT,
  Nome VARCHAR(50) NOT NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY uk_generos_nome (Nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MidiaGenero (
  MidiaId INT NOT NULL,
  GeneroId INT NOT NULL,
  PRIMARY KEY (MidiaId, GeneroId),
  CONSTRAINT fk_midiagenero_midia
    FOREIGN KEY (MidiaId) REFERENCES Midias(Id)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_midiagenero_genero
    FOREIGN KEY (GeneroId) REFERENCES Generos(Id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (nome, email, senha) VALUES
('Usuário Demonstracao', 'demo@filmes.local', '$2b$10$GazK47AiKRPVsfHnwLNuheTAfXeeqNXWJ7w1hncipIUwvXPbrhfWy');

INSERT INTO Generos (Nome) VALUES
('Ação'), ('Aventura'), ('Animação'), ('Comédia'), ('Drama'),
('Fantasia'), ('Ficção científica'), ('Mistério'), ('Romance'),
('Suspense'), ('Terror'), ('Documentário'), ('Musical'), ('Crime'),
('Histórico');

INSERT INTO Midias (Titulo, Status, Tipo, idUsuario) VALUES
('Interestelar', 'Quero ver', 'Filme', 1),
('Stranger Things', 'Assistindo', 'Série', 1),
('The Last of Us', 'Assisti', 'Série', 1);

INSERT INTO MidiaGenero (MidiaId, GeneroId)
SELECT 1, Id FROM Generos WHERE Nome IN ('Ficção científica', 'Drama');
INSERT INTO MidiaGenero (MidiaId, GeneroId)
SELECT 2, Id FROM Generos WHERE Nome IN ('Mistério', 'Ficção científica');
INSERT INTO MidiaGenero (MidiaId, GeneroId)
SELECT 3, Id FROM Generos WHERE Nome IN ('Drama', 'Suspense');
