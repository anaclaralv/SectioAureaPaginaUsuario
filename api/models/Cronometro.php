<?php
class Cronometro {
    private $conn;
    private $table = "PI_Cronometro";
    
    public $id_cron;
    public $id_usuario;
    public $tempo_cronometro;
    public $descricao;
    
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
        
        $query = "INSERT INTO " . $this->table . " (id_usuario, tempo_cronometro, descricao) 
                  VALUES (:id_usuario, :tempo_cronometro, :descricao)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":tempo_cronometro", $this->tempo_cronometro);
        $stmt->bindParam(":descricao", $this->descricao);
        
        if($stmt->execute()) {
            $this->id_cron = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET tempo_cronometro = :tempo_cronometro, descricao = :descricao 
                  WHERE id_cron = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":tempo_cronometro", $this->tempo_cronometro);
        $stmt->bindParam(":descricao", $this->descricao);
        $stmt->bindParam(":id", $this->id_cron);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE id_cron = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_cron);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>