<?php
class Materia {
    private $conn;
    private $table = "PI_Materia";
    
    public $id_materia;
    public $nome;
    public $cor;
    public $id_usuario;
    public $ativo;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Verificar se usuário existe (antes de criar)
    private function usuarioExiste($id_usuario) {
        $query = "SELECT id_usuario FROM PI_Usuario WHERE id_usuario = :id AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id_usuario);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
    
    // Verificar se matéria existe (pra validação em outras tabelas)
    public function existe($id_materia, $id_usuario = null) {
        $query = "SELECT id_materia FROM " . $this->table . " WHERE id_materia = :id AND ativo = 1";
        if($id_usuario) {
            $query .= " AND id_usuario = :id_usuario";
        }
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id_materia);
        if($id_usuario) {
            $stmt->bindParam(":id_usuario", $id_usuario);
        }
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
    
    // CREATE
    public function create() {
        // Valida FK no código
        if(!$this->usuarioExiste($this->id_usuario)) {
            return false;
        }
        
        $query = "INSERT INTO " . $this->table . " (nome, cor, id_usuario) 
                  VALUES (:nome, :cor, :id_usuario)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->cor = htmlspecialchars(strip_tags($this->cor));
        
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":cor", $this->cor);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        if($stmt->execute()) {
            $this->id_materia = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    // READ all (só do usuário logado)
    public function read($id_usuario) {
        $query = "SELECT id_materia, nome, cor FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    // READ one
    public function readOne() {
        $query = "SELECT id_materia, nome, cor, id_usuario FROM " . $this->table . " 
                  WHERE id_materia = ? AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_materia);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->nome = $row['nome'];
            $this->cor = $row['cor'];
            $this->id_usuario = $row['id_usuario'];
            return true;
        }
        return false;
    }
    
    // UPDATE
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nome = :nome, cor = :cor 
                  WHERE id_materia = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":cor", $this->cor);
        $stmt->bindParam(":id", $this->id_materia);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    // DELETE lógico
    public function delete() {
        $query = "UPDATE " . $this->table . " SET ativo = 0 
                  WHERE id_materia = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_materia);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>