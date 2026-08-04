<?php
class Inteligencias {
    private $conn;
    private $table = "PI_Inteligencias";
    
    public $id_tipo;
    public $nome;
    public $metodo;
    public $cor;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // READ all (tabela fixa)
    public function read() {
        $query = "SELECT * FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
    
    // READ one
    public function readOne() {
        $query = "SELECT * FROM " . $this->table . " WHERE id_tipo = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_tipo);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->nome = $row['nome'];
            $this->metodo = $row['metodo'];
            $this->cor = $row['cor'];
            return true;
        }
        return false;
    }
}
?>