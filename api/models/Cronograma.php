<?php
class Cronograma {
    private $conn;
    private $table = "PI_Cronograma";
    
    public $id_cronograma;
    public $id_usuario;
    public $id_materia;
    public $dia_semana;
    public $hora_inicio;
    public $hora_final;
    
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
                  (id_usuario, id_materia, dia_semana, hora_inicio, hora_final) 
                  VALUES (:id_usuario, :id_materia, :dia_semana, :hora_inicio, :hora_final)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->dia_semana = htmlspecialchars(strip_tags($this->dia_semana));
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":id_materia", $this->id_materia);
        $stmt->bindParam(":dia_semana", $this->dia_semana);
        $stmt->bindParam(":hora_inicio", $this->hora_inicio);
        $stmt->bindParam(":hora_final", $this->hora_final);
        
        if($stmt->execute()) {
            $this->id_cronograma = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT c.*, m.nome as nome_materia 
                  FROM " . $this->table . " c
                  JOIN PI_Materia m ON c.id_materia = m.id_materia
                  WHERE c.id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET id_materia = :id_materia, dia_semana = :dia_semana, 
                      hora_inicio = :hora_inicio, hora_final = :hora_final 
                  WHERE id_cronograma = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":id_materia", $this->id_materia);
        $stmt->bindParam(":dia_semana", $this->dia_semana);
        $stmt->bindParam(":hora_inicio", $this->hora_inicio);
        $stmt->bindParam(":hora_final", $this->hora_final);
        $stmt->bindParam(":id", $this->id_cronograma);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE id_cronograma = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_cronograma);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>