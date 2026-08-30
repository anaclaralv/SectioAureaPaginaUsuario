<?php
class Cornell {
    private $conn;
    private $table = "PI_Cornell";
    
    public $id_cornell;
    public $id_usuario;
    public $titulo;
    public $pergunta;
    public $resposta;
    public $resumo;
    public $data_criacao;
    
    public function __construct($db) {
        $this->conn = $db;
        $this->garantirTabela();
    }
    
    private function garantirTabela() {
        $sql = "CREATE TABLE IF NOT EXISTS `PI_Cornell` (
            `id_cornell` INT NOT NULL AUTO_INCREMENT,
            `id_usuario` INT NOT NULL,
            `titulo` VARCHAR(255) DEFAULT 'Nota Cornell',
            `pergunta` TEXT NULL,
            `resposta` TEXT NULL,
            `resumo` TEXT NULL,
            `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id_cornell`),
            KEY `fk_cornell_usuario_idx` (`id_usuario`),
            CONSTRAINT `fk_cornell_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `PI_Usuario` (`id_usuario`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        try {
            $this->conn->exec($sql);
        } catch (PDOException $e) {
            // Ignora se ja existir
        }
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
        
        $query = "INSERT INTO " . $this->table . " (id_usuario, titulo, pergunta, resposta, resumo, data_criacao) 
                  VALUES (:id_usuario, :titulo, :pergunta, :resposta, :resumo, NOW())";
        
        $stmt = $this->conn->prepare($query);
        
        $this->titulo = htmlspecialchars(strip_tags($this->titulo ?? 'Nota Cornell'));
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":pergunta", $this->pergunta);
        $stmt->bindParam(":resposta", $this->resposta);
        $stmt->bindParam(":resumo", $this->resumo);
        
        if($stmt->execute()) {
            $this->id_cornell = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT id_cornell, id_usuario, titulo, pergunta, resposta, resumo, data_criacao 
                  FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario 
                  ORDER BY id_cornell DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT id_cornell, id_usuario, titulo, pergunta, resposta, resumo, data_criacao 
                  FROM " . $this->table . " 
                  WHERE id_cornell = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_cornell);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id_usuario = $row['id_usuario'];
            $this->titulo = $row['titulo'];
            $this->pergunta = $row['pergunta'];
            $this->resposta = $row['resposta'];
            $this->resumo = $row['resumo'];
            $this->data_criacao = $row['data_criacao'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET titulo = :titulo, pergunta = :pergunta, resposta = :resposta, resumo = :resumo 
                  WHERE id_cornell = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $this->titulo = htmlspecialchars(strip_tags($this->titulo ?? 'Nota Cornell'));
        
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":pergunta", $this->pergunta);
        $stmt->bindParam(":resposta", $this->resposta);
        $stmt->bindParam(":resumo", $this->resumo);
        $stmt->bindParam(":id", $this->id_cornell);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE id_cornell = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_cornell);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>
