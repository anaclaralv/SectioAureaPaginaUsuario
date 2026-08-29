<?php
class BibliotecaVideos {
    private $conn;
    private $table = "PI_BibliotecaVideos";
    
    public $id_video;
    public $id_usuario;
    public $materia;
    public $titulo;
    public $url;
    public $video_id;
    public $thumbnail;
    public $tema;
    public $anotacoes;
    public $assistido;
    public $nota;
    public $data_adicionado;
    
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
                  (id_usuario, materia, titulo, url, video_id, thumbnail, tema, anotacoes, assistido, nota, data_adicionado) 
                  VALUES (:id_usuario, :materia, :titulo, :url, :video_id, :thumbnail, :tema, :anotacoes, :assistido, :nota, :data_adicionado)";
        
        $stmt = $this->conn->prepare($query);
        
        $this->materia = htmlspecialchars(strip_tags($this->materia));
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        $this->url = htmlspecialchars(strip_tags($this->url));
        $this->video_id = htmlspecialchars(strip_tags($this->video_id));
        $this->thumbnail = htmlspecialchars(strip_tags($this->thumbnail));
        $this->tema = htmlspecialchars(strip_tags($this->tema));
        $this->data_adicionado = $this->data_adicionado ?? date('Y-m-d H:i:s');
        
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        $stmt->bindParam(":materia", $this->materia);
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":url", $this->url);
        $stmt->bindParam(":video_id", $this->video_id);
        $stmt->bindParam(":thumbnail", $this->thumbnail);
        $stmt->bindParam(":tema", $this->tema);
        $stmt->bindParam(":anotacoes", $this->anotacoes);
        $stmt->bindParam(":assistido", $this->assistido);
        $stmt->bindParam(":nota", $this->nota);
        $stmt->bindParam(":data_adicionado", $this->data_adicionado);
        
        if($stmt->execute()) {
            $this->id_video = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
    
    public function read($id_usuario) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_usuario = :id_usuario ORDER BY data_adicionado DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT * FROM " . $this->table . " WHERE id_video = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_video);
        $stmt->bindParam(2, $this->id_usuario);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->materia = $row['materia'];
            $this->titulo = $row['titulo'];
            $this->url = $row['url'];
            $this->video_id = $row['video_id'];
            $this->thumbnail = $row['thumbnail'];
            $this->tema = $row['tema'];
            $this->anotacoes = $row['anotacoes'];
            $this->assistido = $row['assistido'];
            $this->nota = $row['nota'];
            $this->data_adicionado = $row['data_adicionado'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET materia = :materia, titulo = :titulo, url = :url, video_id = :video_id, 
                      thumbnail = :thumbnail, tema = :tema, anotacoes = :anotacoes, 
                      assistido = :assistido, nota = :nota 
                  WHERE id_video = :id AND id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($query);
        
        $this->materia = htmlspecialchars(strip_tags($this->materia));
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        $this->url = htmlspecialchars(strip_tags($this->url));
        $this->video_id = htmlspecialchars(strip_tags($this->video_id));
        $this->thumbnail = htmlspecialchars(strip_tags($this->thumbnail));
        $this->tema = htmlspecialchars(strip_tags($this->tema));
        
        $stmt->bindParam(":materia", $this->materia);
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":url", $this->url);
        $stmt->bindParam(":video_id", $this->video_id);
        $stmt->bindParam(":thumbnail", $this->thumbnail);
        $stmt->bindParam(":tema", $this->tema);
        $stmt->bindParam(":anotacoes", $this->anotacoes);
        $stmt->bindParam(":assistido", $this->assistido);
        $stmt->bindParam(":nota", $this->nota);
        $stmt->bindParam(":id", $this->id_video);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_video = :id AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_video);
        $stmt->bindParam(":id_usuario", $this->id_usuario);
        return $stmt->execute();
    }
}
?>
