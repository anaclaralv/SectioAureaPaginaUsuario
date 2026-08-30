<?php
class Bloco {
    private $conn;
    private $table = "PI_Bloco";
    
    public $id_anotacao;
    public $conteudo;
    public $id_usuario;
    public $cor_nota;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    private function usuarioExiste($id_usuario) {
        $query = "SELECT id_usuario FROM PI_Usuario WHERE id_usuario = :id AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id_usuario);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
    
    public function create() {
        if(!$this->usuarioExiste($this->id_usuario)) {
            return false;
        }
        
        $query = "INSERT INTO " . $this->table . " (conteudo, id_usuario, cor_nota) 
                  VALUES (:conteudo, :id_usuario, :cor_nota)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->cor_nota = htmlspecialchars(strip_tags($this->cor_nota ?? '#ffffff'));
        
        $stmt->bindParam(":conteudo", $this->conteudo);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":cor_nota", $this->cor_nota);
        
        if($stmt->execute()) {
            $this->id_anotacao = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT id_anotacao, conteudo, cor_nota FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT id_anotacao, conteudo, cor_nota, id_usuario FROM " . $this->table . " 
                  WHERE id_anotacao = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_anotacao);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->conteudo = $row['conteudo'];
            $this->cor_nota = $row['cor_nota'];
            $this->id_usuario = $row['id_usuario'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET conteudo = :conteudo, cor_nota = :cor_nota 
                  WHERE id_anotacao = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":conteudo", $this->conteudo);
        $stmt->bindParam(":cor_nota", $this->cor_nota);
        $stmt->bindParam(":id", $this->id_anotacao);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE id_anotacao = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_anotacao);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>