<?php
class HistoricoLeitura {
    private $conn;
    private $table = "PI_HistoricoLeituras";
    
    public $id_leitura;
    public $id_usuario;
    public $titulo;
    public $data;
    public $paginas;
    public $anotacoes;
    public $texto_completo;
    
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
                  (id_usuario, titulo, data, paginas, anotacoes, texto_completo) 
                  VALUES (:id_usuario, :titulo, :data, :paginas, :anotacoes, :texto_completo)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        $this->data = $this->data ?? date('Y-m-d H:i:s');
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":data", $this->data);
        $stmt->bindParam(":paginas", $this->paginas);
        $stmt->bindParam(":anotacoes", $this->anotacoes);
        $stmt->bindParam(":texto_completo", $this->texto_completo);
        
        if($stmt->execute()) {
            $this->id_leitura = $this->conn->lastInsertId();
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
        $query = "SELECT * FROM " . $this->table . " WHERE id_leitura = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_leitura);
        $stmt->bindParam(2, $this->id_usuario);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->titulo = $row['titulo'];
            $this->data = $row['data'];
            $this->paginas = $row['paginas'];
            $this->anotacoes = $row['anotacoes'];
            $this->texto_completo = $row['texto_completo'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET titulo = :titulo, paginas = :paginas, anotacoes = :anotacoes, texto_completo = :texto_completo 
                  WHERE id_leitura = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":paginas", $this->paginas);
        $stmt->bindParam(":anotacoes", $this->anotacoes);
        $stmt->bindParam(":texto_completo", $this->texto_completo);
        $stmt->bindParam(":id", $this->id_leitura);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_leitura = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_leitura);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>
