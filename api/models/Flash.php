<?php
class Flash {
    private $conn;
    private $table = "PI_Flash";
    
    public $id_flash;
    public $id_materia;
    public $id_usuario;
    public $pergunta;
    public $tema;
    public $resposta;
    
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
    
    private function materiaExiste($id_materia, $id_usuario) {
        $query = "SELECT id_materia FROM PI_Materia 
                  WHERE id_materia = :id_materia AND id_usuario = :id_usuario AND ativo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_materia", $id_materia);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
    
    public function create() {
        if(!$this->usuarioExiste($this->id_usuario)) {
            return false;
        }
        if(!$this->materiaExiste($this->id_materia, $this->id_usuario)) {
            return false;
        }
        
        $query = "INSERT INTO " . $this->table . " 
                  (id_materia, id_usuario, pergunta, tema, resposta) 
                  VALUES (:id_materia, :id_usuario, :pergunta, :tema, :resposta)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->pergunta = htmlspecialchars(strip_tags($this->pergunta));
        $this->tema = htmlspecialchars(strip_tags($this->tema));
        $this->resposta = htmlspecialchars(strip_tags($this->resposta));
        
        $stmt->bindParam(":id_materia", $this->id_materia);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":pergunta", $this->pergunta);
        $stmt->bindParam(":tema", $this->tema);
        $stmt->bindParam(":resposta", $this->resposta);
        
        if($stmt->execute()) {
            $this->id_flash = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT f.*, m.nome as nome_materia 
                  FROM " . $this->table . " f
                  JOIN PI_Materia m ON f.id_materia = m.id_materia
                  WHERE f.id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function readByMateria($id_usuario, $id_materia) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario AND id_materia = :id_materia";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->bindParam(":id_materia", $id_materia);
        $stmt->execute();
        return $stmt;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET pergunta = :pergunta, tema = :tema, resposta = :resposta 
                  WHERE id_flash = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":pergunta", $this->pergunta);
        $stmt->bindParam(":tema", $this->tema);
        $stmt->bindParam(":resposta", $this->resposta);
        $stmt->bindParam(":id", $this->id_flash);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE id_flash = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_flash);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>