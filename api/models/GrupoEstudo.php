<?php
class GrupoEstudo {
    private $conn;
    private $table = "PI_GruposEstudo";
    
    public $id_grupo;
    public $id_usuario;
    public $nome;
    public $materia;
    public $codigo;
    public $link_meet;
    public $membros;
    public $temas;
    public $duvidas;
    public $reunioes;
    public $notas;
    public $flashcards_compartilhados;
    public $data_criacao;
    
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
                  (id_usuario, nome, materia, codigo, link_meet, membros, temas, duvidas, reunioes, notas, flashcards_compartilhados, data_criacao) 
                  VALUES (:id_usuario, :nome, :materia, :codigo, :link_meet, :membros, :temas, :duvidas, :reunioes, :notas, :flashcards_compartilhados, :data_criacao)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->materia = htmlspecialchars(strip_tags($this->materia));
        $this->codigo = htmlspecialchars(strip_tags($this->codigo));
        $this->link_meet = htmlspecialchars(strip_tags($this->link_meet));
        $this->data_criacao = $this->data_criacao ?? date('Y-m-d H:i:s');
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":materia", $this->materia);
        $stmt->bindParam(":codigo", $this->codigo);
        $stmt->bindParam(":link_meet", $this->link_meet);
        $stmt->bindParam(":membros", $this->membros);
        $stmt->bindParam(":temas", $this->temas);
        $stmt->bindParam(":duvidas", $this->duvidas);
        $stmt->bindParam(":reunioes", $this->reunioes);
        $stmt->bindParam(":notas", $this->notas);
        $stmt->bindParam(":flashcards_compartilhados", $this->flashcards_compartilhados);
        $stmt->bindParam(":data_criacao", $this->data_criacao);
        
        if($stmt->execute()) {
            $this->id_grupo = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $email = '';
        $queryEmail = "SELECT email FROM PI_Usuario WHERE id_usuario = :id";
        $stmtEmail = $this->conn->prepare($queryEmail);
        $stmtEmail->bindParam(":id", $id_usuario);
        $stmtEmail->execute();
        $rowEmail = $stmtEmail->fetch(PDO::FETCH_ASSOC);
        if($rowEmail) {
            $email = $rowEmail['email'];
        }
        
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE id_usuario = :id_usuario 
                  OR membros LIKE :email_search 
                  ORDER BY data_criacao DESC";
                  
        $stmt = $this->conn->prepare($query);
        $email_search = "%" . $email . "%";
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->bindParam(":email_search", $email_search);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT * FROM " . $this->table . " WHERE id_grupo = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_grupo);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id_usuario = $row['id_usuario'];
            $this->nome = $row['nome'];
            $this->materia = $row['materia'];
            $this->codigo = $row['codigo'];
            $this->link_meet = $row['link_meet'];
            $this->membros = $row['membros'];
            $this->temas = $row['temas'];
            $this->duvidas = $row['duvidas'];
            $this->reunioes = $row['reunioes'];
            $this->notas = $row['notas'];
            $this->flashcards_compartilhados = $row['flashcards_compartilhados'];
            $this->data_criacao = $row['data_criacao'];
            return true;
        }
        return false;
    }
    
    public function readByCode($codigo) {
        $query = "SELECT * FROM " . $this->table . " WHERE codigo = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $codigo);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id_grupo = $row['id_grupo'];
            $this->id_usuario = $row['id_usuario'];
            $this->nome = $row['nome'];
            $this->materia = $row['materia'];
            $this->codigo = $row['codigo'];
            $this->link_meet = $row['link_meet'];
            $this->membros = $row['membros'];
            $this->temas = $row['temas'];
            $this->duvidas = $row['duvidas'];
            $this->reunioes = $row['reunioes'];
            $this->notas = $row['notas'];
            $this->flashcards_compartilhados = $row['flashcards_compartilhados'];
            $this->data_criacao = $row['data_criacao'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nome = :nome, materia = :materia, link_meet = :link_meet, 
                      membros = :membros, temas = :temas, duvidas = :duvidas, 
                      reunioes = :reunioes, notas = :notas, 
                      flashcards_compartilhados = :flashcards_compartilhados 
                  WHERE id_grupo = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->materia = htmlspecialchars(strip_tags($this->materia));
        $this->link_meet = htmlspecialchars(strip_tags($this->link_meet));
        
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":materia", $this->materia);
        $stmt->bindParam(":link_meet", $this->link_meet);
        $stmt->bindParam(":membros", $this->membros);
        $stmt->bindParam(":temas", $this->temas);
        $stmt->bindParam(":duvidas", $this->duvidas);
        $stmt->bindParam(":reunioes", $this->reunioes);
        $stmt->bindParam(":notas", $this->notas);
        $stmt->bindParam(":flashcards_compartilhados", $this->flashcards_compartilhados);
        $stmt->bindParam(":id", $this->id_grupo);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_grupo = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_grupo);
        return $stmt->execute();
    }
}
?>
