<?php
class Usuario {
    private $conn;
    private $table = "PI_Usuario";

    public $id_usuario;
    public $nome;
    public $email;
    public $senha;
    public $ativo;
    public $foto;
    public $plano;
    public $tipo_dom;
    public $clas_inteli;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Criar usuário
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nome, email, senha, plano, tipo_dom, clas_inteli) 
                  VALUES (:nome, :email, :senha, :plano, :tipo_dom, :clas_inteli)";
        
        $stmt = $this->conn->prepare($query);
        
        // Limpeza e validação
        $this->nome = htmlspecialchars(strip_tags($this->nome ?? ''));
        $this->email = htmlspecialchars(strip_tags($this->email ?? ''));
        $this->senha = password_hash($this->senha, PASSWORD_DEFAULT);
        $this->plano = htmlspecialchars(strip_tags($this->plano ?? 'Gratuito'));
        $this->tipo_dom = htmlspecialchars(strip_tags($this->tipo_dom ?? ''));
        
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":senha", $this->senha);
        $stmt->bindParam(":plano", $this->plano);
        $stmt->bindParam(":tipo_dom", $this->tipo_dom);
        $stmt->bindParam(":clas_inteli", $this->clas_inteli);
        
        if($stmt->execute()) {
            $this->id_usuario = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Buscar usuário por email (login)
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table . " WHERE email = :email AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id_usuario = $row['id_usuario'];
            $this->nome = $row['nome'];
            $this->email = $row['email'];
            $this->senha = $row['senha'];
            $this->plano = $row['plano'];
            $this->tipo_dom = $row['tipo_dom'];
            $this->clas_inteli = $row['clas_inteli'];
            $this->ativo = $row['ativo'];
            return true;
        }
        return false;
    }

    // Listar todos usuários ativos
    public function read() {
        $query = "SELECT id_usuario, nome, email, plano, tipo_dom, ativo 
                  FROM " . $this->table . " WHERE ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Buscar um usuário
    public function readOne() {
        $query = "SELECT id_usuario, nome, email, foto, plano, tipo_dom, clas_inteli 
                  FROM " . $this->table . " WHERE id_usuario = ? AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_usuario);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->nome = $row['nome'];
            $this->email = $row['email'];
            $this->foto = $row['foto'];
            $this->plano = $row['plano'];
            $this->tipo_dom = $row['tipo_dom'];
            $this->clas_inteli = $row['clas_inteli'];
            return true;
        }
        return false;
    }

    // Atualizar usuário
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nome = :nome, email = :email, foto = :foto, plano = :plano, 
                      tipo_dom = :tipo_dom, clas_inteli = :clas_inteli 
                  WHERE id_usuario = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":foto", $this->foto);
        $stmt->bindParam(":plano", $this->plano);
        $stmt->bindParam(":tipo_dom", $this->tipo_dom);
        $stmt->bindParam(":clas_inteli", $this->clas_inteli);
        $stmt->bindParam(":id", $this->id_usuario);
        
        return $stmt->execute();
    }

    // Delete lógico
    public function delete() {
        $query = "UPDATE " . $this->table . " SET ativo = 0 WHERE id_usuario = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_usuario);
        return $stmt->execute();
    }

    // Verificar se usuário existe (pra validação de FK no código)
    public function existe($id_usuario) {
        $query = "SELECT id_usuario FROM " . $this->table . " WHERE id_usuario = :id AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id_usuario);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
?>