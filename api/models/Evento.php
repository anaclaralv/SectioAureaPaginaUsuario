<?php
class Evento {
    public $conn;
    private $table = "PI_Eventos";
    
    public $id_evento;
    public $id_usuario;
    public $tipo;
    public $data;
    public $cor;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Criar evento
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (id_usuario, tipo, data, cor) 
                  VALUES (:id_usuario, :tipo, :data, :cor)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->tipo = $this->tipo ?? '';
        $this->data = htmlspecialchars(strip_tags($this->data ?? ''));
        $this->cor = htmlspecialchars(strip_tags($this->cor ?? '#00FF00'));
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":data", $this->data);
        $stmt->bindParam(":cor", $this->cor);
        
        if($stmt->execute()) {
            $this->id_evento = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    // Listar todos do usuário
    public function read($id_usuario) {
        $query = "SELECT id_evento, id_usuario, tipo, data, cor 
                  FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario 
                  ORDER BY data ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    // Listar por data do usuário
    public function readByDate($id_usuario, $data) {
        $query = "SELECT id_evento, id_usuario, tipo, data, cor 
                  FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario AND data = :data";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->bindParam(":data", $data);
        $stmt->execute();
        return $stmt;
    }
    
    // Atualizar
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET tipo = :tipo, data = :data, cor = :cor 
                  WHERE id_evento = :id_evento AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":data", $this->data);
        $stmt->bindParam(":cor", $this->cor);
        $stmt->bindParam(":id_evento", $this->id_evento);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    // Deletar
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_evento = :id_evento AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_evento", $this->id_evento);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>