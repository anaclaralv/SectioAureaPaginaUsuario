<?php
class HistoricoSimulado {
    private $conn;
    private $table = "PI_HistoricoSimulados";
    
    public $id_simulado;
    public $id_usuario;
    public $data;
    public $materia;
    public $acertos;
    public $erros;
    public $taxa;
    public $total;
    
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
        
        $query = "INSERT INTO " . $this->table . " 
                  (id_usuario, data, materia, acertos, erros, taxa, total) 
                  VALUES (:id_usuario, :data, :materia, :acertos, :erros, :taxa, :total)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->materia = htmlspecialchars(strip_tags($this->materia));
        $this->data = $this->data ?? date('Y-m-d H:i:s');
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":data", $this->data);
        $stmt->bindParam(":materia", $this->materia);
        $stmt->bindParam(":acertos", $this->acertos);
        $stmt->bindParam(":erros", $this->erros);
        $stmt->bindParam(":taxa", $this->taxa);
        $stmt->bindParam(":total", $this->total);
        
        if($stmt->execute()) {
            $this->id_simulado = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_usuario = :id_usuario ORDER BY data DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT * FROM " . $this->table . " WHERE id_simulado = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_simulado);
        $stmt->bindParam(2, $this->id_usuario);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->data = $row['data'];
            $this->materia = $row['materia'];
            $this->acertos = $row['acertos'];
            $this->erros = $row['erros'];
            $this->taxa = $row['taxa'];
            $this->total = $row['total'];
            return true;
        }
        return false;
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_simulado = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_simulado);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>
