<?php
class GravacaoEstudo {
    private $conn;
    private $table = "PI_GravacoesEstudo";
    
    public $id_gravacao;
    public $id_usuario;
    public $data;
    public $url;
    public $modo;
    public $nome;
    public $check_palavras_simples;
    public $check_analogias;
    public $check_lacunas;
    public $check_simplificado;
    public $anotacoes;
    public $duracao;
    
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
                  (id_usuario, data, url, modo, nome, check_palavras_simples, check_analogias, check_lacunas, check_simplificado, anotacoes, duracao) 
                  VALUES (:id_usuario, :data, :url, :modo, :nome, :check_palavras_simples, :check_analogias, :check_lacunas, :check_simplificado, :anotacoes, :duracao)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->modo = htmlspecialchars(strip_tags($this->modo));
        $this->data = $this->data ?? date('Y-m-d H:i:s');
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":data", $this->data);
        $stmt->bindParam(":url", $this->url);
        $stmt->bindParam(":modo", $this->modo);
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":check_palavras_simples", $this->check_palavras_simples);
        $stmt->bindParam(":check_analogias", $this->check_analogias);
        $stmt->bindParam(":check_lacunas", $this->check_lacunas);
        $stmt->bindParam(":check_simplificado", $this->check_simplificado);
        $stmt->bindParam(":anotacoes", $this->anotacoes);
        $stmt->bindParam(":duracao", $this->duracao);
        
        if($stmt->execute()) {
            $this->id_gravacao = $this->conn->lastInsertId();
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
        $query = "SELECT * FROM " . $this->table . " WHERE id_gravacao = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_gravacao);
        $stmt->bindParam(2, $this->id_usuario);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->data = $row['data'];
            $this->url = $row['url'];
            $this->modo = $row['modo'];
            $this->nome = $row['nome'];
            $this->check_palavras_simples = $row['check_palavras_simples'];
            $this->check_analogias = $row['check_analogias'];
            $this->check_lacunas = $row['check_lacunas'];
            $this->check_simplificado = $row['check_simplificado'];
            $this->anotacoes = $row['anotacoes'];
            $this->duracao = $row['duracao'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nome = :nome, url = :url, anotacoes = :anotacoes, 
                      check_palavras_simples = :check_palavras_simples, 
                      check_analogias = :check_analogias, 
                      check_lacunas = :check_lacunas, 
                      check_simplificado = :check_simplificado 
                  WHERE id_gravacao = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":url", $this->url);
        $stmt->bindParam(":anotacoes", $this->anotacoes);
        $stmt->bindParam(":check_palavras_simples", $this->check_palavras_simples);
        $stmt->bindParam(":check_analogias", $this->check_analogias);
        $stmt->bindParam(":check_lacunas", $this->check_lacunas);
        $stmt->bindParam(":check_simplificado", $this->check_simplificado);
        $stmt->bindParam(":id", $this->id_gravacao);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_gravacao = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_gravacao);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>
